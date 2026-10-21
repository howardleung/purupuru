"use client";

import type { ComponentProps } from "react";

import { analytics } from "../lib/analytics-client";
import type { OutboundIdentity } from "../lib/analytics-contract";

export function RetailerOutboundLink({ analytics: identity, ...props }: Omit<ComponentProps<"a">, "onClick" | "onAuxClick"> & { analytics?: OutboundIdentity }) {
  function capture() {
    if (!identity) return;
    try {
      analytics.navigate(window.location.pathname, window.location.search.slice(1));
      analytics.outbound(identity);
    } catch { /* Retailer navigation always proceeds, even when analytics is unavailable. */ }
  }
  return <a {...props} onClick={capture} onAuxClick={(event) => { if (event.button === 1) capture(); }} />;
}
