"use client";

import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

import { deleteAccount } from "../app/profile/actions";
import { trapTabKey } from "../lib/modal-focus";
import { initialDeleteAccountActionState } from "../lib/profile-contract";

export function DeleteAccountDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [state, setState] = useState(initialDeleteAccountActionState);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  function close() {
    if (isPending) return;
    setIsOpen(false);
    setConfirmation("");
    setState(initialDeleteAccountActionState);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        setIsOpen(false);
        setConfirmation("");
        setState(initialDeleteAccountActionState);
        window.requestAnimationFrame(() => triggerRef.current?.focus());
      }
      trapTabKey(event, dialogRef.current);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, isPending]);

  return (
    <>
      <button
        className="ui-button border border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
        onClick={() => setIsOpen(true)}
        ref={triggerRef}
        type="button"
      >
        <Trash2 aria-hidden className="h-4 w-4" /> Delete account
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 grid items-end bg-slate-950/45 p-0 sm:place-items-center sm:p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <section
            aria-describedby="delete-account-description"
            aria-labelledby="delete-account-title"
            aria-modal="true"
            className="w-full rounded-t-2xl bg-white p-5 shadow-float sm:max-w-lg sm:rounded-2xl sm:p-6"
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-rose-700">Permanent action</p>
                <h2 className="mt-2 text-xl font-extrabold text-slate-950" id="delete-account-title">Delete your account?</h2>
              </div>
              <button
                aria-label="Close delete account dialog"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-slate-100"
                disabled={isPending}
                onClick={close}
                ref={closeRef}
                type="button"
              >
                <X aria-hidden className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600" id="delete-account-description">
              This permanently deletes your PuruPuru profile, collection, ratings, purchase history, and shopping lists, then deletes your sign-in account. This cannot be undone.
            </p>

            <form
              className="mt-5 grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                startTransition(async () => {
                  const nextState = await deleteAccount(state, formData);
                  setState(nextState);
                  if (nextState.status === "SUCCESS") window.location.assign("/");
                });
              }}
            >
              <label className="grid gap-2 text-sm font-bold text-slate-800">
                Type DELETE to confirm
                <input
                  autoComplete="off"
                  className="ui-input font-normal"
                  disabled={isPending}
                  name="confirmation"
                  onChange={(event) => setConfirmation(event.target.value)}
                  spellCheck={false}
                  value={confirmation}
                />
              </label>
              <p aria-live="polite" className="min-h-5 text-sm text-rose-700" role={state.status === "ERROR" || state.status === "RETRY_REQUIRED" ? "alert" : undefined}>
                {state.message}
              </p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button className="ui-button ui-button--secondary" disabled={isPending} onClick={close} type="button">Cancel</button>
                <button
                  className="ui-button bg-rose-700 text-white hover:bg-rose-800"
                  disabled={confirmation !== "DELETE" || isPending}
                  type="submit"
                >
                  {isPending ? "Deleting…" : "Permanently delete account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
