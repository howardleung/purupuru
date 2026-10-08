import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { UserRound } from "lucide-react";
import Link from "next/link";

import { isClerkConfigured } from "../lib/clerk-config";
import { GlobalSearch } from "./global-search";
import { PrimaryNav } from "./primary-nav";
import { ProductMegaMenu } from "./product-mega-menu";
import { BrandLogo } from "./brand-logo";
import { MobileNavigation } from "./mobile-navigation";

export function SiteHeader() {
  return (
    <header className="relative z-30 border-b border-slate-200/70 bg-white">
      <div className="page-container flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-3 md:py-4">
        <Link aria-label="PuruPuru home" className="shrink-0 rounded-lg" href="/">
          <BrandLogo />
        </Link>
        <div className="hidden min-w-0 flex-1 md:block"><GlobalSearch /></div>
        <div className="hidden items-center gap-1 2xl:flex"><ProductMegaMenu /><PrimaryNav /></div>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-1">
          {isClerkConfigured ? (
            <>
              <SignedOut>
                <div className="flex gap-1 sm:gap-2">
                  <SignInButton mode="modal">
                    <button className="ui-button ui-button--ghost" type="button">
                      Sign in
                    </button>
                  </SignInButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton>
                  <UserButton.MenuItems>
                    <UserButton.Link href="/profile" label="Profile" labelIcon={<UserRound aria-hidden size={16} />} />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </>
          ) : (
            <span className="hidden text-xs text-slate-500 sm:inline">Personal features unavailable</span>
          )}
          <MobileNavigation />
        </div>
        <div className="w-full md:hidden"><GlobalSearch id="mobile-global-search" /></div>
      </div>
      <div className="relative hidden border-t border-slate-100 md:block 2xl:hidden">
        <div className="page-container flex items-center justify-center gap-1 py-1.5">
          <ProductMegaMenu />
          <PrimaryNav />
        </div>
      </div>
    </header>
  );
}
