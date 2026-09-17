import { Droplets, Eye, FlaskConical, Milk, PackageSearch, SprayCan, Sun, VenetianMask } from "lucide-react";

// Presentation only: taxonomy and links always come from real CanonicalCategory records.
const symbols = {
  cleansers: SprayCan,
  toners: Milk,
  moisturizers: Droplets,
  treatments: FlaskConical,
  sunscreen: Sun,
  masks: VenetianMask,
  "eye-care": Eye,
  "lip-care": Droplets,
};
const tones = {
  cleansers: "mist", toners: "grey", moisturizers: "blush", treatments: "oak",
  sunscreen: "mist", masks: "blush", "eye-care": "oak", "lip-care": "mist",
} as const;

export function categoryTone(slug: string): string {
  return Object.hasOwn(tones, slug) ? tones[slug as keyof typeof tones] : "grey";
}

export function CategorySymbol({ slug, className = "h-8 w-8" }: { slug: string; className?: string }) {
  const Icon = Object.hasOwn(symbols, slug) ? symbols[slug as keyof typeof symbols] : PackageSearch;
  return <Icon aria-hidden className={className} strokeWidth={1.6} />;
}
