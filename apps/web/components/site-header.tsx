import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { isClerkConfigured } from "../lib/clerk-config";

const navigation = [
  { href: "/", label: "Browse" },
  { href: "/collection", label: "My Collection" },
  { href: "/shopping-lists", label: "Shopping Lists" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:flex-nowrap sm:px-6 sm:py-4">
        <Link className="text-xl font-semibold tracking-tight" href="/">
          Otoku
        </Link>

        <nav
          aria-label="Primary"
          className="order-3 flex w-full gap-1 overflow-x-auto border-t border-slate-100 pt-3 sm:order-none sm:w-auto sm:gap-2 sm:border-0 sm:pt-0"
        >
          {navigation.map((item) => (
            <Link
              className="shrink-0 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center">
          {isClerkConfigured ? (
            <>
              <SignedOut>
                <div className="flex gap-1 sm:gap-2">
                  <SignInButton mode="modal">
                    <button className="rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-100 sm:px-3" type="button">
                      Sign in
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="hidden rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white sm:block" type="button">
                      Create account
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          ) : (
            <span className="text-xs text-slate-500">Personal features unavailable</span>
          )}
        </div>
      </div>
    </header>
  );
}
