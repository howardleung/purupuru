import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold">Not found</h1>
      <p className="mt-3 text-slate-600">This product or category is not in the catalogue.</p>
      <Link className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/">
        Browse catalogue
      </Link>
    </main>
  );
}
