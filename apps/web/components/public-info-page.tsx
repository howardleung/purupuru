import type { ReactNode } from "react";

type PublicInfoPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
  legalReview?: boolean;
};

export function PublicInfoPage({ eyebrow, title, intro, children, legalReview = false }: PublicInfoPageProps) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <p className="text-sm font-medium text-slate-500">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-4 text-lg leading-8 text-slate-600">{intro}</p>
      {legalReview ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Draft for early-stage transparency. Professional legal review is required before public launch.
        </p>
      ) : null}
      <div className="mt-8 space-y-8 text-sm leading-7 text-slate-700">{children}</div>
    </main>
  );
}