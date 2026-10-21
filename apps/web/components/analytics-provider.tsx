"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { createContext, Suspense, useContext, useEffect, useId, useRef, useState } from "react";

import { analytics, stopAnalyticsRequests } from "../lib/analytics-client";
import { CONSENT_KEY, CONSENT_MAX_AGE, readAnalyticsConsent, type ProductIdentity } from "../lib/analytics-contract";

const PreferencesContext = createContext(() => undefined as void);

function NavigationTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => { analytics.navigate(pathname, search); }, [pathname, search]);
  return null;
}

export function ProductViewTracker({ product }: { product: ProductIdentity }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const { product_family_id, product_version_id, product_variant_id } = product;
  useEffect(() => {
    analytics.product(pathname, search, { product_family_id, product_version_id, product_variant_id });
  }, [pathname, search, product_family_id, product_version_id, product_variant_id]);
  return null;
}

export function AnalyticsPreferencesButton() {
  const open = useContext(PreferencesContext);
  return <button className="hover:text-slate-950 hover:underline" onClick={open} type="button">Analytics preferences</button>;
}

export function AnalyticsProvider({ children, production }: { children: React.ReactNode; production: boolean }) {
  const [consent, setConsent] = useState<boolean | null | undefined>(undefined);
  const [preferences, setPreferences] = useState(false);
  const [storageMessage, setStorageMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useId();
  const description = useId();

  useEffect(() => {
    const local = /^(localhost|127\.|\[::1\])/.test(window.location.hostname);
    analytics.configure(process.env.NEXT_PUBLIC_POSTHOG_KEY, process.env.NEXT_PUBLIC_POSTHOG_HOST, production && !local);
    function restore() {
      let saved: boolean | null = null;
      let expires = 0;
      try {
        const raw = localStorage.getItem(CONSENT_KEY);
        saved = readAnalyticsConsent(raw);
        if (saved === true && raw) expires = (JSON.parse(raw) as { at: number }).at + CONSENT_MAX_AGE;
      } catch { /* No consent when storage is unavailable. */ }
      analytics.setConsent(saved === true, expires);
      if (saved !== true) stopAnalyticsRequests();
      setConsent(saved);
    }
    function storage(event: StorageEvent) { if (event.key === CONSENT_KEY || event.key === null) restore(); }
    restore();
    window.addEventListener("storage", storage);
    // Expired choices prompt again, including on tabs left open for a long time.
    window.addEventListener("focus", restore);
    return () => { window.removeEventListener("storage", storage); window.removeEventListener("focus", restore); };
  }, [production]);

  useEffect(() => {
    if (!preferences || !dialog.current) return;
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, [preferences]);

  function choose(accepted: boolean) {
    const at = Date.now();
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ version: 1, accepted, at }));
      setStorageMessage("");
    } catch {
      // Keep collection off if a durable choice cannot be saved.
      accepted = false;
      setStorageMessage("Your preference could not be saved. Optional analytics remain off.");
    }
    analytics.setConsent(accepted, at + CONSENT_MAX_AGE);
    if (!accepted) stopAnalyticsRequests();
    setConsent(accepted);
    setPreferences(false);
  }

  const explanation = <>Allow optional PostHog analytics, processed in the US, to help us understand page visits, product interest, Likes and retailer clicks? We do not link your account. Shopping works either way. Change or withdraw consent anytime in Analytics preferences. <Link className="underline" href="/privacy">Privacy details</Link>.</>;
  const choices = <div className="mt-4 flex flex-wrap gap-3">
    <button className="ui-button ui-button--secondary" onClick={() => choose(true)} type="button">Accept analytics</button>
    <button className="ui-button ui-button--secondary" onClick={() => choose(false)} type="button">Reject analytics</button>
  </div>;

  return <PreferencesContext.Provider value={() => setPreferences(true)}>
    {children}
    <Suspense fallback={null}><NavigationTracker /></Suspense>
    {consent === null && !preferences ? <section aria-label="Optional analytics" className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-xl border border-slate-300 bg-white p-5 text-slate-950 shadow-float">
      <h2 className="text-lg font-bold">Your analytics choice</h2><p className="mt-2 text-sm">{explanation}</p>{choices}
    </section> : null}
    {preferences ? <dialog aria-labelledby={title} aria-describedby={description} ref={dialog} onCancel={() => setPreferences(false)} className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-xl bg-white p-6 text-slate-950 shadow-float backdrop:bg-slate-950/45">
      <h2 id={title} className="text-lg font-bold">Analytics preferences</h2>
      <p className="mt-2 text-sm" id={description}>{explanation}</p>
      <p className="mt-3 text-sm">Current choice: {consent === true ? "accepted" : consent === false ? "rejected" : "not set"}.</p>
      {choices}<button className="ui-link mt-4 text-sm" onClick={() => setPreferences(false)} type="button">Close preferences</button>
    </dialog> : null}
    {storageMessage ? <p className="fixed bottom-4 left-4 z-[60] rounded-xl border bg-white p-4 text-sm" role="status">{storageMessage}</p> : null}
  </PreferencesContext.Provider>;
}
