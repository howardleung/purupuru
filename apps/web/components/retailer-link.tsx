import Image from "next/image";

import { resolveRetailerLogo } from "../lib/retailer-logos";
import { safeExternalUrl } from "../lib/external-url";

export function RetailerLink({
  href,
  name,
  sourceKey,
  showName = false,
  className = "font-medium text-slate-950 underline decoration-slate-300 underline-offset-2",
}: {
  href: string;
  name: string;
  sourceKey?: string | null;
  showName?: boolean;
  className?: string;
}) {
  const logo = resolveRetailerLogo(sourceKey);

  return (
    <a
      aria-label={`Shop this listing at ${name}`}
      className={`group relative inline-flex items-center ${className}`}
      href={safeExternalUrl(href)}
      rel="noreferrer"
      target="_blank"
      title={name}
    >
      {logo ? (
        <>
          <Image
            alt=""
            aria-hidden="true"
            className="h-6 w-auto max-w-28 object-contain object-left"
            height={logo.height}
            src={logo.src}
            width={logo.width}
          />
          <span className={showName ? "ml-2" : "sr-only"}>{name}</span>
          {!showName ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-full z-10 mt-1 hidden whitespace-nowrap rounded bg-slate-950 px-2 py-1 text-xs font-normal text-white no-underline shadow-sm group-hover:block group-focus-visible:block"
            >
              {name}
            </span>
          ) : null}
        </>
      ) : (
        name
      )}
    </a>
  );
}
