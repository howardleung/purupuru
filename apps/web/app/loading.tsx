export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading page" className="page-container py-8 sm:py-10">
      <div className="animate-pulse">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="mt-5 h-9 w-72 max-w-full rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-xl rounded bg-slate-100" />
        <div className="mt-8 h-28 rounded-xl bg-slate-100" />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="h-72 rounded-xl bg-slate-100" />
          <div className="h-72 rounded-xl bg-slate-100" />
        </div>
      </div>
      <span className="sr-only">Loading PuruPuru…</span>
    </main>
  );
}
