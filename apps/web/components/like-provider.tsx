"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import type { LikeTarget } from "@beauty-platform/domain/likes";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

import { cancelPendingLike, completePendingLike, prepareLikeAuthentication, readLikes, setProductLike } from "../app/likes/actions";

type LikeContextValue = {
  liked: ReadonlySet<string>;
  pending: ReadonlySet<string>;
  ready: boolean;
  retry: () => void;
  request: (target: LikeTarget) => void;
};
const unavailable: LikeContextValue = { liked: new Set(), pending: new Set(), ready: false, request: () => undefined, retry: () => undefined };
const LikeContext = createContext<LikeContextValue>(unavailable);
export const useLikes = () => useContext(LikeContext);

export function LikeProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState<{ userId: string; liked: Set<string> } | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const locks = useRef(new Set<string>());
  const activeUser = useRef(userId);
  activeUser.current = userId;
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [failedUser, setFailedUser] = useState<string | null>(null);
  const [gate, setGate] = useState<LikeTarget | null>(null);
  const [mode, setMode] = useState<"prompt" | "sign-in" | "sign-up">("prompt");
  const [preparing, setPreparing] = useState(false);
  const [returnUrl, setReturnUrl] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const gateGeneration = useRef(0);
  const recoveryRequest = useRef<{ userId: string; target: LikeTarget } | null>(null);
  const initialization = useRef<{
    key: string;
    promise: Promise<{ completion: Awaited<ReturnType<typeof completePendingLike>>; result: Awaited<ReturnType<typeof readLikes>> }>;
  } | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const mutate = useCallback(async (target: LikeTarget, liked: boolean) => {
    const actor = userId;
    const lock = `${actor}:${target.productVersionId}`;
    if (!actor || locks.current.has(lock)) return;
    locks.current.add(lock);
    setPending((current) => new Set(current).add(lock));
    setError(null);
    setAccount((current) => {
      if (current?.userId !== actor) return current;
      const next = new Set(current.liked);
      if (liked) next.add(target.productVersionId); else next.delete(target.productVersionId);
      return { userId: actor, liked: next };
    });
    try {
      const result = await setProductLike({ ...target, liked });
      if (result.status !== "SUCCESS") throw new Error(result.message);
      if (activeUser.current === actor) router.refresh();
    } catch (failure) {
      if (activeUser.current !== actor) return;
      setAccount((current) => {
        if (current?.userId !== actor) return current;
        const next = new Set(current.liked);
        if (liked) next.delete(target.productVersionId); else next.add(target.productVersionId);
        return { userId: actor, liked: next };
      });
      setError(failure instanceof Error ? failure.message : "Your Like could not be saved. Please try again.");
    } finally {
      locks.current.delete(lock);
      if (activeUser.current === actor) setPending((current) => {
        const next = new Set(current); next.delete(lock); return next;
      });
    }
  }, [userId, router]);


  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      initialization.current = null;
      if (isLoaded && !isSignedIn) recoveryRequest.current = null;
      return;
    }
    let cancelled = false;
    const actor = userId;
    // Authentication succeeded independently of database availability.
    setGate(null);
    setFailedUser(null);
    const key = `${actor}:${reload}`;
    // Reuse the same handoff during Strict Mode's effect replay.
    if (initialization.current?.key !== key) {
      initialization.current = { key, promise: (async () => {
        // Also runs after an OAuth redirect; the server consumes the expiring request.
        const completion = await completePendingLike();
        return { completion, result: await readLikes() };
      })() };
    }
    void initialization.current.promise.then(({ completion, result }) => {
      if (cancelled || activeUser.current !== actor) return;
      if (result.status !== "SUCCESS") {
        setFailedUser(actor);
        setError(result.message);
        return;
      }
      if (result.userId !== actor) {
        setFailedUser(actor);
        setError("Your account changed. Please retry loading Likes.");
        return;
      }
      setAccount({ userId: actor, liked: new Set(result.versionIds) });
      if (completion && completion.status !== "SUCCESS") setError(completion.message);
      if (completion?.status === "SUCCESS") router.refresh();
      const recovery = recoveryRequest.current;
      if (recovery?.userId === actor) {
        recoveryRequest.current = null;
        // Resuming this exact pending save must not immediately toggle it back off.
        if (!completion || completion.productVersionId !== recovery.target.productVersionId) {
          void mutate(recovery.target, !result.versionIds.includes(recovery.target.productVersionId));
        }
      }
    }).catch(() => {
      if (!cancelled && activeUser.current === actor) {
        setFailedUser(actor);
        setError("Your Likes could not be loaded. Please retry.");
      }
    });
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, userId, reload, router, mutate]);

  useEffect(() => {
    if (!gate) return;
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
      trigger.current?.focus();
    };
  }, [gate]);


  function close() {
    gateGeneration.current += 1;
    setGate(null);
    void cancelPendingLike().catch(() => setError("The save request could not be cancelled. Please retry before signing in."));
  }

  async function authenticate(nextMode: "sign-in" | "sign-up") {
    if (!gate || preparing) return;
    const generation = gateGeneration.current;
    setPreparing(true);
    setError(null);
    try {
      const result = await prepareLikeAuthentication(gate);
      if (generation !== gateGeneration.current) { await cancelPendingLike(); return; }
      if (result.status !== "SUCCESS") { setError(result.message); return; }
      setReturnUrl(window.location.href);
      setMode(nextMode);
    } catch {
      setError("Sign-in could not be opened. Please try again.");
    } finally { setPreparing(false); }
  }

  const liked = isSignedIn && account?.userId === userId ? account.liked : unavailable.liked;
  function retry() {
    setError(null);
    setReload((value) => value + 1);
    router.refresh();
  }
  return (
    <LikeContext.Provider value={{
      liked, pending: new Set([...pending].filter((key) => key.startsWith(`${userId}:`)).map((key) => key.slice(`${userId}:`.length))),
      ready: Boolean(isLoaded && (!isSignedIn || account?.userId === userId || failedUser === userId)),
      retry,
      request: (target) => {
        if (!isLoaded) return;
        if (!isSignedIn) {
          trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          gateGeneration.current += 1;
          setMode("prompt"); setGate(target); setError(null);
        } else if (failedUser === userId || account?.userId !== userId) {
          // Unknown is not unliked: reload before deciding whether this heart should add or remove.
          if (userId) recoveryRequest.current = { userId, target };
          retry();
        } else void mutate(target, !liked.has(target.productVersionId));
      },
    }}>
      {children}
      {error ? <div className="fixed bottom-4 left-4 right-4 z-[70] rounded-xl border border-amber-300 bg-white p-4 text-sm text-slate-950 shadow-float sm:left-auto sm:max-w-md" role="alert">
        {error} <button className="ui-link ml-2" onClick={retry} type="button">Retry loading Likes</button>
        <button aria-label="Dismiss Like message" className="ml-3" onClick={() => setError(null)} type="button">Dismiss</button>
      </div> : null}
      {gate ? <dialog aria-describedby={descriptionId} aria-labelledby={titleId} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl bg-white p-6 text-slate-950 shadow-float backdrop:bg-slate-950/45" onCancel={(event) => { event.preventDefault(); close(); }} ref={dialog}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-xl font-bold" id={titleId}>Save your skincare favourites</h2>
          <button aria-label="Close save favourites dialog" className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-slate-100" onClick={close} type="button"><X aria-hidden className="h-5 w-5" /></button>
        </div>
        <p className="mt-3 text-sm text-slate-600" id={descriptionId}>Create a free account to save products you love, find them later, and get personalized recommendations.</p>
        {mode === "prompt" ? <div className="mt-5 grid gap-4">
          <button autoFocus className="ui-button ui-button--primary" disabled={preparing} onClick={() => void authenticate("sign-up")} type="button">Create free account</button>
          <button className="ui-link text-sm" disabled={preparing} onClick={() => void authenticate("sign-in")} type="button">Already have an account? Sign in</button>
        </div> : <div className="mt-5">
          {mode === "sign-up" ? <SignUp routing="virtual" forceRedirectUrl={returnUrl} signInForceRedirectUrl={returnUrl} /> : <SignIn routing="virtual" forceRedirectUrl={returnUrl} signUpForceRedirectUrl={returnUrl} />}
          <button className="ui-link mt-3 text-sm" onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")} type="button">{mode === "sign-up" ? "Already have an account? Sign in" : "Create free account"}</button>
        </div>}
        <button className="ui-link mt-5 text-sm" onClick={close} type="button">Continue browsing</button>
      </dialog> : null}
    </LikeContext.Provider>
  );
}
