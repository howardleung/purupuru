import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 text-slate-600">
        This page is unavailable, or this private item does not belong to the signed-in account.
      </p>
      <Link className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/catalogue">
        Browse catalogue
      </Link>
    </main>
  );
}
