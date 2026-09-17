"use client";

import Image from "next/image";
import { useState } from "react";

export type ProductImageData = {
  url: string;
  altText: string;
};

type ProductImageProps = {
  image: ProductImageData | null;
  productName: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
};

export function ProductImage({
  image,
  productName,
  className = "aspect-square",
  priority = false,
  sizes = "(max-width: 640px) 100vw, 50vw",
}: ProductImageProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (!image || failedUrl === image.url) {
    return (
      <div
        aria-label={`Product image unavailable for ${productName}`}
        className={`flex items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-4 text-center text-xs font-semibold text-slate-600 ${className}`}
        role="img"
      >
        Image coming soon
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-slate-50 ${className}`}>
      <Image
        alt={image.altText}
        className="object-contain p-4"
        fill
        onError={() => setFailedUrl(image.url)}
        priority={priority}
        sizes={sizes}
        src={image.url}
      />
    </div>
  );
}
