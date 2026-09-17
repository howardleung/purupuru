import Image from "next/image";

/** Replace this temporary mark/text lockup with reviewed final SVG artwork here. */
export function BrandLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5">
      <Image alt="" aria-hidden height={50} src="/brand/purupuru-mark-temporary.svg" width={44} />
      <span>
        <span className="brand-wordmark block">PuruPuru</span>
        {!compact ? <span className="mt-1.5 block text-[0.5rem] font-extrabold uppercase tracking-[0.18em] text-slate-500">Skincare without borders</span> : null}
      </span>
    </span>
  );
}
