import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { isClerkConfigured } from "../lib/clerk-config";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <div className="space-y-5">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">Phase 1 foundation</p>
          <h1 className="text-3xl font-semibold tracking-tight">Otoku</h1>
          <p className="max-w-xl text-slate-600">
            The web application is running. Product features will be added in later phases.
          </p>
        </div>

        {isClerkConfigured ? (
          <>
            <SignedOut>
              <div className="flex gap-3">
                <SignInButton mode="modal">
                  <button className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white" type="button">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700" type="button">
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
    </main>
  );
}