import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { isClerkConfigured } from "../lib/clerk-config";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link className="text-xl font-semibold tracking-tight" href="/">
            Otoku
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-4">
            <Link className="text-sm text-slate-600 hover:text-slate-950" href="/">
              Catalogue
            </Link>
            <Link className="text-sm text-slate-600 hover:text-slate-950" href="/shopping-lists">
              Shopping lists
            </Link>
          </nav>
        </div>

        {isClerkConfigured ? (
          <>
            <SignedOut>
              <div className="flex gap-2">
                <SignInButton mode="modal">
                  <button className="rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100" type="button">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="button">
                    Create account
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
            <SignedIn>
              <UserButton />
            </SignedIn>
          </>
        ) : null}
      </div>
    </header>
  );
}
