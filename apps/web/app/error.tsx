"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        PuruPuru could not load this page. Your saved collection and shopping-list data were not changed.
      </p>
      <button
        className="ui-button ui-button--primary mt-6"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  );
}
