import {
  chooseVariantForVersion,
  compareOffersByProductPrice,
} from "@beauty-platform/domain";
import { createEmptyCollectionState } from "@beauty-platform/domain/collection";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "../../../components/breadcrumbs";
import { CollectionActions } from "../../../components/collection-actions";
import { AddToShoppingList } from "../../../components/add-to-shopping-list";
import { OfferSection, type OfferView } from "../../../components/offer-section";
import { ProductSelectors } from "../../../components/product-selectors";
import { getProductFamilyDetails } from "../../../lib/catalogue";
import { isClerkConfigured } from "../../../lib/clerk-config";
import { getPersistedCollectionState } from "../../../lib/collection-state";
import { getCurrentUser } from "../../../lib/current-user";
import { getShoppingListsForUser } from "../../../lib/shopping-lists";
import { convertToCad } from "../../../lib/currency-conversion";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ version?: string; variant?: string }>;
};

const benchmarkLabels: Record<string, string> = {
  MSRP: "MSRP",
  RETAIL_PRICE: "Retail price",
  REFERENCE_PRICE: "Reference price",
};

const marketNames: Record<string, string> = {
  CA: "Canada",
  JP: "Japan",
  KR: "South Korea",
};

function formatNativeMoney(value: number, currency: string) {
  if (currency === "CAD") return formatCad(value);

  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatCad(value: number) {
  return `CA$${new Intl.NumberFormat("en-CA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

function formatRateDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${value}T12:00:00.000Z`),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { family } = await getProductFamilyDetails(slug);
  return { title: family ? `${family.brand.name} ${family.canonicalName}` : "Product" };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const { family, breadcrumbs } = await getProductFamilyDetails(slug);

  if (!family || family.versions.length === 0) notFound();

  const versionOptions = family.versions.map((version) => ({
    id: version.id,
    versionName: version.versionName,
    versionCode: version.versionCode,
    status: version.status,
    defaultVariantId: version.defaultVariantId,
    variants: version.variants.map((variant) => ({
      id: variant.id,
      normalizedQuantity: Number(variant.normalizedQuantity),
      normalizedUnit: variant.normalizedUnit,
      displaySize: variant.displaySize,
    })),
  }));

  const selectedVersionRecord =
    family.versions.find(
      (version) => version.id === query.version || version.versionCode === query.version,
    ) ??
    family.versions.find((version) => version.id === family.currentVersionId) ??
    family.versions[0];
  const selectedVersion = versionOptions.find((version) => version.id === selectedVersionRecord.id)!;
  const requestedVariant = selectedVersionRecord.variants.find(
    (variant) => variant.id === query.variant,
  );
  const fallbackVariant = chooseVariantForVersion(
    selectedVersion.variants,
    null,
    selectedVersion.defaultVariantId,
  );
  const selectedVariantRecord =
    requestedVariant ??
    selectedVersionRecord.variants.find((variant) => variant.id === fallbackVariant?.id) ??
    selectedVersionRecord.variants[0];

  if (!selectedVariantRecord) notFound();

  const selectedVariant = selectedVersion.variants.find(
    (variant) => variant.id === selectedVariantRecord.id,
  )!;
  const toOfferView = (offer: (typeof selectedVariantRecord.offers)[number]): OfferView => ({
    id: offer.id,
    listingUrl: offer.listingUrl,
    productPrice: Number(offer.productPrice),
    nativeCurrency: offer.nativeCurrency,
    cadConvertedPrice: offer.cadConvertedPrice === null ? null : Number(offer.cadConvertedPrice),
    availabilityState: offer.availabilityState,
    shippingState: offer.shippingState,
    shippingAmount: offer.shippingAmount === null ? null : Number(offer.shippingAmount),
    shippingCurrency: offer.shippingCurrency,
    shippingConditions: offer.shippingConditions,
    deliveryMethod: offer.deliveryMethod,
    deliveryEstimate: offer.deliveryEstimate,
    lastVerifiedAt: offer.lastVerifiedAt,
    retailer: { name: offer.retailer.name, country: offer.retailer.country },
    items: offer.items,
  });
  const canadianOffers = selectedVariantRecord.offers
    .filter((offer) => offer.availableMarkets.includes("CA"))
    .map(toOfferView)
    .sort(compareOffersByProductPrice);
  const destinationMarket = family.originMarket;
  const destinationOffers = destinationMarket
    ? selectedVariantRecord.offers
        .filter((offer) => offer.availableMarkets.includes(destinationMarket))
        .map(toOfferView)
        .sort(compareOffersByProductPrice)
    : [];
  const [benchmarkConversions, currentUser] = await Promise.all([
    Promise.all(
      selectedVariantRecord.benchmarkPrices.map(async (benchmark) => [
        benchmark.id,
        await convertToCad(Number(benchmark.amount), benchmark.nativeCurrency),
      ] as const),
    ).then((entries) => new Map(entries)),
    isClerkConfigured ? getCurrentUser() : Promise.resolve(null),
  ]);
  const [initialCollectionState, shoppingLists] = await Promise.all([
    currentUser
      ? getPersistedCollectionState(currentUser.id, selectedVersionRecord.id)
      : Promise.resolve(createEmptyCollectionState()),
    currentUser ? getShoppingListsForUser(currentUser.id) : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="flex min-h-72 items-center justify-center rounded-2xl bg-slate-100 text-7xl font-semibold text-slate-300">
          {family.brand.name.slice(0, 1)}
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {family.brand.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{family.canonicalName}</h1>
          <p className="mt-3 text-slate-600">
            {family.primaryCanonicalCategory.displayName} · {selectedVersionRecord.versionName} · {selectedVariantRecord.displaySize}
          </p>
          {selectedVersionRecord.packagingDescription ? (
            <p className="mt-4 text-sm text-slate-600">
              {selectedVersionRecord.packagingDescription}
            </p>
          ) : null}
          <div className="mt-8">
            <ProductSelectors
              productSlug={family.slug}
              selectedVariant={selectedVariant}
              selectedVersion={selectedVersion}
              versions={versionOptions}
            />
          </div>
          <div className="mt-8">
            {isClerkConfigured ? (
              <CollectionActions
                initialState={initialCollectionState}
                productSlug={family.slug}
                productVariantId={selectedVariantRecord.id}
                productVersionId={selectedVersionRecord.id}
                variantLabel={selectedVariantRecord.displaySize}
              />
            ) : (
              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold">Your collection</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Authentication must be configured before personal actions are available.
                </p>
              </section>
            )}
          </div>
          {isClerkConfigured ? (
            <div className="mt-4">
              <AddToShoppingList
                lists={shoppingLists}
                productSlug={family.slug}
                productVariantId={selectedVariantRecord.id}
                variantLabel={selectedVariantRecord.displaySize}
              />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">Benchmark prices</h2>
          {selectedVariantRecord.benchmarkPrices.length > 0 ? (
            <div className="mt-4 space-y-4">
              {selectedVariantRecord.benchmarkPrices.map((benchmark) => (
                <div key={benchmark.id}>
                  <p className="text-sm text-slate-500">
                    {benchmarkLabels[benchmark.type]} · {marketNames[benchmark.market] ?? benchmark.market}
                  </p>
                  <p className="mt-1 text-xl font-semibold">
                    {formatNativeMoney(Number(benchmark.amount), benchmark.nativeCurrency)}
                    {benchmarkConversions.get(benchmark.id) ? (
                      <span className="font-medium text-slate-600">
                        {` (${formatCad(benchmarkConversions.get(benchmark.id)!.amountCad)})`}
                      </span>
                    ) : null}
                  </p>
                  {benchmarkConversions.get(benchmark.id) ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Approx. CAD conversion ·{" "}
                      <a
                        className="underline decoration-slate-300 underline-offset-2"
                        href={benchmarkConversions.get(benchmark.id)!.sourceUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {benchmarkConversions.get(benchmark.id)!.sourceName} daily rate
                      </a>{" "}
                      · rate updated {formatRateDate(benchmarkConversions.get(benchmark.id)!.rateDate)}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    Source: {benchmark.sourceUrl ? (
                      <a className="underline" href={benchmark.sourceUrl} rel="noreferrer" target="_blank">
                        {benchmark.sourceDisplayName}
                      </a>
                    ) : (
                      benchmark.sourceDisplayName
                    )}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No verified MSRP, retail price, or reference price is available for this version and size.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold">External signals</h2>
          {selectedVersionRecord.externalSignals.length > 0 ? (
            <div className="mt-4 space-y-4">
              {selectedVersionRecord.externalSignals.map((signal) => (
                <div key={signal.id}>
                  <a className="font-medium underline decoration-slate-300 underline-offset-2" href={signal.sourceUrl} rel="noreferrer" target="_blank">
                    {signal.sourceDisplayName}
                  </a>
                  <p className="mt-1 text-sm text-slate-700">
                    {signal.rating !== null && signal.ratingScale !== null
                      ? `${Number(signal.rating)} / ${Number(signal.ratingScale)}`
                      : "No rating supplied"}
                    {signal.reviewCount !== null ? ` · ${signal.reviewCount.toLocaleString("en-CA")} reviews` : ""}
                  </p>
                  {signal.rankingLabel ? (
                    <p className="mt-1 text-sm text-slate-600">{signal.rankingLabel}</p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-600">
              No version-specific external signals are currently verified.
            </p>
          )}
        </section>
      </div>

      <OfferSection
        description="Offers explicitly recorded as serving Canada. Prices are sorted by product price, before shipping."
        offers={canadianOffers}
        title="Buy in Canada"
      />

      {destinationMarket && destinationMarket !== "CA" ? (
        <OfferSection
          description={`Offers for the product’s origin market. Native ${destinationOffers[0]?.nativeCurrency ?? "currency"} prices are shown first; no conversion is inferred when exchange-rate data is missing.`}
          offers={destinationOffers}
          title={`Buy in ${marketNames[destinationMarket] ?? destinationMarket}`}
        />
      ) : null}
    </main>
  );
}
