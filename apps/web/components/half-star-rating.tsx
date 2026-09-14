"use client";

import { Star } from "lucide-react";
import { useState } from "react";

export function HalfStarRating({
  value,
  onCommit,
  disabled = false,
  label = "Personal rating",
}: {
  value: number | null;
  onCommit: (halfSteps: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const [preview, setPreview] = useState<number | null>(null);
  const shown = preview ?? value ?? 0;

  return (
    <fieldset onMouseLeave={() => setPreview(null)}>
      <legend className="text-sm font-medium text-slate-700">{label}</legend>
      <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: 5 }, (_, starIndex) => {
          const starNumber = starIndex + 1;
          const fill = Math.max(0, Math.min(1, shown / 2 - starIndex)) * 100;
          return (
            <span className="relative h-10 w-10 shrink-0" key={starNumber}>
              <Star aria-hidden className="absolute inset-1 h-8 w-8 text-slate-300" strokeWidth={1.5} />
              <span aria-hidden className="pointer-events-none absolute inset-1 overflow-hidden" style={{ width: `${fill}%` }}>
                <Star className="h-8 w-8 fill-amber-400 text-amber-400" strokeWidth={1.5} />
              </span>
              {(starNumber === 1 ? [2] : [starNumber * 2 - 1, starNumber * 2]).map((halfSteps, halfIndex, options) => (
                <button
                  aria-checked={value === halfSteps}
                  aria-label={`${(halfSteps / 2).toFixed(1)} stars`}
                  className={`absolute top-0 h-10 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${options.length === 1 ? "left-0 w-full" : halfIndex === 0 ? "left-0 w-1/2" : "right-0 w-1/2"}`}
                  disabled={disabled}
                  key={halfSteps}
                  onClick={() => onCommit(halfSteps)}
                  onFocus={() => setPreview(halfSteps)}
                  onMouseEnter={() => setPreview(halfSteps)}
                  role="radio"
                  type="button"
                />
              ))}
            </span>
          );
        })}
        <span className="ml-2 min-w-12 text-sm font-medium text-slate-600">
          {shown ? (shown / 2).toFixed(1) : "—"}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500">Choose a half-star step from 1.0 to 5.0.</p>
    </fieldset>
  );
}
