"use client";

import {
  groupPriceHistoryByCurrency,
  type PriceHistoryChartSeries,
  type PriceHistorySeries,
} from "@beauty-platform/domain/price-history";
import { useState } from "react";

import { RetailerLink } from "./retailer-link";

const verificationLabels: Record<string, string> = {
  RETAILER_SOURCE: "Retailer source",
  RECEIPT_VERIFIED: "Receipt verified",
  COMMUNITY_REPORTED: "Community reported",
  OTHER: "Demo observation",
};

const seriesColours = ["#0f766e", "#c2410c", "#2563eb", "#7c3aed", "#be123c", "#4d7c0f"];

function formatMoney(value: number, currency: string) {
  return `${new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "CAD" ? 2 : 0,
    maximumFractionDigits: currency === "CAD" ? 2 : 0,
  }).format(value)} ${currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

type ChartPoint = {
  id: string;
  amount: number;
  observedAt: string;
  verificationType: string;
  retailerName: string;
  listingUrl: string;
  seriesIndex: number;
};

function CurrencyHistoryChart({
  nativeCurrency,
  series,
}: {
  nativeCurrency: string;
  series: PriceHistoryChartSeries[];
}) {
  const points: ChartPoint[] = series.flatMap((retailerSeries, seriesIndex) =>
    retailerSeries.observations.map((observation) => ({
      ...observation,
      retailerName: retailerSeries.retailerName,
      listingUrl: retailerSeries.listingUrl,
      seriesIndex,
    })),
  );
  const latestPoint = [...points].sort(
    (left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt),
  )[0];
  const [selectedPointId, setSelectedPointId] = useState<string | null>(latestPoint?.id ?? null);
  const selectedPoint = points.find((point) => point.id === selectedPointId) ?? latestPoint;

  const width = 720;
  const height = 238;
  const margins = { top: 18, right: 18, bottom: 34, left: 64 };
  const plotWidth = width - margins.left - margins.right;
  const plotHeight = height - margins.top - margins.bottom;
  const timestamps = points.map((point) => Date.parse(point.observedAt));
  const amounts = points.map((point) => point.amount);
  const minTimestamp = Math.min(...timestamps);
  const maxTimestamp = Math.max(...timestamps);
  const rawMinAmount = Math.min(...amounts);
  const rawMaxAmount = Math.max(...amounts);
  const amountPadding = Math.max((rawMaxAmount - rawMinAmount) * 0.1, rawMaxAmount * 0.02, 0.01);
  const minAmount = Math.max(0, rawMinAmount - amountPadding);
  const maxAmount = rawMaxAmount + amountPadding;

  const x = (date: string) =>
    minTimestamp === maxTimestamp
      ? margins.left + plotWidth / 2
      : margins.left + ((Date.parse(date) - minTimestamp) / (maxTimestamp - minTimestamp)) * plotWidth;
  const y = (amount: number) =>
    margins.top + ((maxAmount - amount) / (maxAmount - minAmount)) * plotHeight;

  return (
    <section className="border-t border-slate-200 pt-5 first:border-0 first:pt-0" aria-label={`${nativeCurrency} price history`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold">{nativeCurrency} history</h3>
        <p className="text-xs text-slate-500">{points.length} recorded observation{points.length === 1 ? "" : "s"}</p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <svg
          aria-label={`${nativeCurrency} price history chart with ${series.length} retailer listing series`}
          className="h-auto min-w-[36rem] w-full"
          role="group"
          viewBox={`0 0 ${width} ${height}`}
        >
          {[0, 0.5, 1].map((fraction) => {
            const gridY = margins.top + plotHeight * fraction;
            const amount = maxAmount - (maxAmount - minAmount) * fraction;
            return (
              <g key={fraction}>
                <line stroke="#e2e8f0" x1={margins.left} x2={width - margins.right} y1={gridY} y2={gridY} />
                <text fill="#64748b" fontSize="11" textAnchor="end" x={margins.left - 9} y={gridY + 4}>
                  {new Intl.NumberFormat("en-CA", { maximumFractionDigits: 2 }).format(amount)}
                </text>
              </g>
            );
          })}
          <text fill="#64748b" fontSize="11" textAnchor="start" x={margins.left} y={height - 9}>
            {formatDate(new Date(minTimestamp).toISOString())}
          </text>
          <text fill="#64748b" fontSize="11" textAnchor="end" x={width - margins.right} y={height - 9}>
            {formatDate(new Date(maxTimestamp).toISOString())}
          </text>

          {series.map((retailerSeries, seriesIndex) => {
            const colour = seriesColours[seriesIndex % seriesColours.length];
            const coordinates = retailerSeries.observations
              .map((observation) => `${x(observation.observedAt)},${y(observation.amount)}`)
              .join(" ");

            return (
              <g key={retailerSeries.offerId}>
                {retailerSeries.observations.length > 1 ? (
                  <polyline fill="none" points={coordinates} stroke={colour} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
                ) : null}
                {retailerSeries.observations.map((observation) => {
                  const label = `${retailerSeries.retailerName}, ${formatDate(observation.observedAt)}, ${formatMoney(observation.amount, nativeCurrency)}`;
                  const active = observation.id === selectedPoint?.id;
                  return (
                    <circle
                      aria-label={label}
                      className="cursor-pointer outline-none focus:stroke-slate-950"
                      cx={x(observation.observedAt)}
                      cy={y(observation.amount)}
                      fill={active ? colour : "white"}
                      key={observation.id}
                      onClick={() => setSelectedPointId(observation.id)}
                      onFocus={() => setSelectedPointId(observation.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedPointId(observation.id);
                        }
                      }}
                      onMouseEnter={() => setSelectedPointId(observation.id)}
                      r={active ? 6 : 5}
                      role="button"
                      stroke={colour}
                      strokeWidth="3"
                      tabIndex={0}
                    >
                      <title>{label}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label={`${nativeCurrency} chart legend`}>
        {series.map((retailerSeries, seriesIndex) => (
          <div className="flex items-center gap-2" key={retailerSeries.offerId}>
            <span
              aria-hidden="true"
              className="h-0.5 w-5 rounded-full"
              style={{ backgroundColor: seriesColours[seriesIndex % seriesColours.length] }}
            />
            <RetailerLink
              href={retailerSeries.listingUrl}
              name={retailerSeries.retailerName}
              sourceKey={retailerSeries.retailerSourceKey}
            />
            {retailerSeries.currentPrice ? (
              <span className="text-xs text-slate-500">
                current {formatMoney(retailerSeries.currentPrice.amount, nativeCurrency)} · verified{" "}
                {formatDate(retailerSeries.currentPrice.lastVerifiedAt)}
              </span>
            ) : null}
          </div>
        ))}
      </div>

      {selectedPoint ? (
        <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm" aria-live="polite">
          <span className="font-medium">{selectedPoint.retailerName}</span>
          <span className="text-slate-600"> · {formatDate(selectedPoint.observedAt)} · {formatMoney(selectedPoint.amount, nativeCurrency)} · {verificationLabels[selectedPoint.verificationType] ?? "Recorded observation"}</span>
        </div>
      ) : null}

      {points.length === 1 ? (
        <p className="mt-3 text-xs text-slate-500">
          Sparse history: only one observation has been recorded, so no trend line is inferred.
        </p>
      ) : null}

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium text-slate-700">View data</summary>
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Retailer listing</th>
                <th className="px-3 py-2 font-medium">Observed</th>
                <th className="px-3 py-2 font-medium">Historical price</th>
                <th className="px-3 py-2 font-medium">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[...points]
                .sort((left, right) => Date.parse(left.observedAt) - Date.parse(right.observedAt))
                .map((point) => (
                  <tr key={point.id}>
                    <td className="px-3 py-2">
                      <RetailerLink
                        href={point.listingUrl}
                        name={point.retailerName}
                        sourceKey={series[point.seriesIndex]?.retailerSourceKey}
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-600">{formatDate(point.observedAt)}</td>
                    <td className="px-3 py-2 font-medium">{formatMoney(point.amount, nativeCurrency)}</td>
                    <td className="px-3 py-2 text-slate-600">{verificationLabels[point.verificationType] ?? "Recorded observation"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}

export function PriceHistorySection({
  productContext,
  series,
}: {
  productContext: string;
  series: PriceHistorySeries[];
}) {
  const currencyGroups = groupPriceHistoryByCurrency(series);

  return (
    <section className="mt-10 sm:mt-12" aria-labelledby="price-history-title">
      <div>
        <h2 className="text-xl font-semibold" id="price-history-title">Price History</h2>
        <p className="mt-1 text-sm text-slate-600">
          Tracked observations for {productContext}. Each retailer listing is a separate series.
        </p>
      </div>

      {currencyGroups.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600 sm:p-6">
          <p>No price observations have been recorded for this version and size yet.</p>
          <p className="mt-1">More observations will appear as PuruPuru continues tracking this offer.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-6 rounded-xl border border-slate-200 p-4 sm:p-5">
          {currencyGroups.map((group) => (
            <CurrencyHistoryChart
              key={group.nativeCurrency}
              nativeCurrency={group.nativeCurrency}
              series={group.series}
            />
          ))}
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Price history is limited to recorded observations. Current offer prices are shown separately
        and are not backfilled as history. Native currencies use separate charts because
        observation-date CAD rates are not yet stored.
      </p>
    </section>
  );
}
