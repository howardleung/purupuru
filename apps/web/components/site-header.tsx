import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Menu } from "lucide-react";
import Link from "next/link";

import { isClerkConfigured } from "../lib/clerk-config";
import { GlobalSearch } from "./global-search";
import { PrimaryNav } from "./primary-nav";
import { ProductMegaMenu } from "./product-mega-menu";

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 md:grid-cols-[minmax(16rem,1fr)_auto_minmax(16rem,1fr)] md:px-6 md:py-4">
        <div className="hidden max-w-sm md:block"><GlobalSearch /></div>
        <Link className="text-xl font-semibold tracking-tight md:text-2xl" href="/">
          PuruPuru
        </Link>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
          {isClerkConfigured ? (
            <>
              <SignedOut>
                <div className="flex gap-1 sm:gap-2">
                  <SignInButton mode="modal">
                    <button className="rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:px-3" type="button">
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <span className="hidden text-xs text-slate-500 sm:inline">Personal features unavailable</span>
          )}
          <details className="relative md:hidden">
            <summary aria-label="Open navigation" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full hover:bg-slate-100">
              <Menu aria-hidden className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <ProductMegaMenu mobile />
              <PrimaryNav mobile />
            </div>
          </details>
        </div>
        <div className="col-span-2 md:hidden"><GlobalSearch id="mobile-global-search" /></div>
      </div>
      <div className="relative hidden border-t border-slate-100 md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-1 px-6 py-1.5">
          <ProductMegaMenu />
          <PrimaryNav />
        </div>
      </div>
    </header>
  );
}
