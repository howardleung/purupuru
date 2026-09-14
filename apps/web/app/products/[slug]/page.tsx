import {
  chooseVariantForVersion,
  compareOffersByProductPrice,
} from "@beauty-platform/domain";
import { createEmptyCollectionState } from "@beauty-platform/domain/collection";
import { buildPriceHistorySeries } from "@beauty-platform/domain/price-history";
import { selectPrimaryProductImage } from "@beauty-platform/domain/product-images";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "../../../components/breadcrumbs";
import { OfferSection, type OfferView } from "../../../components/offer-section";
import { PersonalActionsModal } from "../../../components/personal-actions-modal";
import { PriceHistorySection } from "../../../components/price-history-section";
import { ProductImage } from "../../../components/product-image";
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

function formatVerifiedDate(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { dateStyle: "medium" }).format(value);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { family } = await getProductFamilyDetails(slug);
  if (!family) return { title: "Product" };

  const version =
    family.versions.find((item) => item.id === family.currentVersionId) ?? family.versions[0];
  const image = version
    ? selectPrimaryProductImage(version.images, version.id, version.defaultVariantId)
    : null;
  const title = `${family.brand.name} ${family.canonicalName}`;
  const description = `Compare verified benchmarks, tracked offers, and exact sizes for ${title}.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · Otoku`,
      description,
      images: image ? [{ url: image.url, alt: image.altText }] : undefined,
    },
  };
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

  const selectedImage = selectPrimaryProductImage(
    selectedVersionRecord.images,
    selectedVersionRecord.id,
    selectedVariantRecord.id,
  );
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
  const primaryBenchmark = ["MSRP", "RETAIL_PRICE", "REFERENCE_PRICE"]
    .flatMap((type) => selectedVariantRecord.benchmarkPrices.filter((benchmark) => benchmark.type === type))
    .at(0) ?? null;
  const [primaryBenchmarkConversion, currentUser] = await Promise.all([
    primaryBenchmark
      ? convertToCad(Number(primaryBenchmark.amount), primaryBenchmark.nativeCurrency)
      : Promise.resolve(null),
    isClerkConfigured ? getCurrentUser() : Promise.resolve(null),
  ]);
  const [initialCollectionState, shoppingLists] = await Promise.all([
    currentUser
      ? getPersistedCollectionState(currentUser.id, selectedVersionRecord.id)
      : Promise.resolve(createEmptyCollectionState()),
    currentUser ? getShoppingListsForUser(currentUser.id) : Promise.resolve([]),
  ]);
  const priceHistorySeries = buildPriceHistorySeries({
    selectedVariantId: selectedVariantRecord.id,
    offers: selectedVariantRecord.offers.map((offer) => ({
      id: offer.id,
      productVariantId: selectedVariantRecord.id,
      retailerId: offer.retailerId,
      retailerName: offer.retailer.name,
      listingUrl: offer.listingUrl,
      amount: Number(offer.productPrice),
      nativeCurrency: offer.nativeCurrency,
      lastVerifiedAt: offer.lastVerifiedAt,
    })),
    observations: selectedVariantRecord.priceObservations.map((observation) => ({
      id: observation.id,
      offerId: observation.offerId,
      productVariantId: observation.productVariantId,
      retailerId: observation.retailerId,
      retailerName: observation.retailer?.name ?? observation.retailerName,
      sourceUrl: observation.sourceUrl,
      amount: Number(observation.amount),
      nativeCurrency: observation.nativeCurrency,
      observedAt: observation.observedAt,
      verificationType: observation.verificationType,
    })),
  });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-x-10 md:gap-y-6">
        <section className="md:col-start-2 md:row-start-1" aria-labelledby="product-title">
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
            {family.brand.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight" id="product-title">
            {family.canonicalName}
          </h1>
          <p className="mt-3 text-slate-600">
            {family.primaryCanonicalCategory.displayName} · {selectedVersionRecord.versionName} · {selectedVariantRecord.displaySize}
          </p>
        </section>

        <figure className="md:col-start-1 md:row-span-2 md:row-start-1">
          <ProductImage
            className="min-h-72 md:min-h-[28rem]"
            image={selectedImage}
            key={selectedImage?.url ?? "image-fallback"}
            priority
            productName={`${family.brand.name} ${family.canonicalName} ${selectedVariantRecord.displaySize}`}
            sizes="(max-width: 768px) calc(100vw - 2rem), 42vw"
          />
          {selectedImage?.sourcePageUrl ? (
            <figcaption className="mt-2 text-xs text-slate-500">
              Image: {" "}
              <a
                className="underline decoration-slate-300 underline-offset-2"
                href={selectedImage.sourcePageUrl}
                rel="noreferrer"
                target="_blank"
              >
                {selectedImage.sourceName}
              </a>
            </figcaption>
          ) : null}
        </figure>

        <div className="md:col-start-1 md:row-start-3">
          <ProductSelectors
            productSlug={family.slug}
            selectedVariant={selectedVariant}
            selectedVersion={selectedVersion}
            versions={versionOptions}
          />
        </div>

        <div className="flex items-center gap-3 border-t border-slate-200 pt-5 md:col-start-1 md:row-start-4">
          {isClerkConfigured ? (
            <PersonalActionsModal
              initialState={initialCollectionState}
              lists={shoppingLists}
              productSlug={family.slug}
              productVariantId={selectedVariantRecord.id}
              productVersionId={selectedVersionRecord.id}
              variantLabel={selectedVariantRecord.displaySize}
            />
          ) : (
            <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">+</span>
          )}
          <div>
            <p className="text-sm font-semibold">Save or plan</p>
            <p className="text-xs text-slate-500">Collection, rating, purchase, and shopping-list actions</p>
          </div>
        </div>

        <div className="md:col-start-2 md:row-span-3 md:row-start-2">
          <section className="border-b border-slate-200 pb-6" aria-labelledby="primary-benchmark-title">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500" id="primary-benchmark-title">
              Strongest verified benchmark
            </p>
            {primaryBenchmark ? (
              <>
                <p className="mt-2 text-sm text-slate-600">
                  {benchmarkLabels[primaryBenchmark.type]} · {marketNames[primaryBenchmark.market] ?? primaryBenchmark.market}
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatNativeMoney(Number(primaryBenchmark.amount), primaryBenchmark.nativeCurrency)}
                  {primaryBenchmarkConversion ? (
                    <span className="ml-2 text-sm font-medium text-slate-500">
                      Approx. {formatCad(primaryBenchmarkConversion.amountCad)}
                    </span>
                  ) : null}
                </p>
                <details className="mt-2 text-xs text-slate-500">
                  <summary className="cursor-pointer font-medium text-slate-600">Benchmark details</summary>
                  <div className="mt-2 space-y-1">
                    <p>
                      Source: {primaryBenchmark.sourceUrl ? (
                        <a className="underline" href={primaryBenchmark.sourceUrl} rel="noreferrer" target="_blank">
                          {primaryBenchmark.sourceDisplayName}
                        </a>
                      ) : primaryBenchmark.sourceDisplayName}
                    </p>
                    <p>Verified {formatVerifiedDate(primaryBenchmark.verifiedAt)}</p>
                    {primaryBenchmarkConversion ? (
                      <p>
                        Approx. CAD ·{" "}
                        <a className="underline" href={primaryBenchmarkConversion.sourceUrl} rel="noreferrer" target="_blank">
                          {primaryBenchmarkConversion.sourceName} daily rate
                        </a>{" "}
                        · rate updated {formatRateDate(primaryBenchmarkConversion.rateDate)}
                      </p>
                    ) : primaryBenchmark.nativeCurrency !== "CAD" ? (
                      <p>Approx. CAD conversion is unavailable; the native benchmark remains authoritative.</p>
                    ) : null}
                  </div>
                </details>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                No verified benchmark is available for this formulation and size.
              </p>
            )}
          </section>

          <div className="pt-6">
            <OfferSection
              compact
              description="Retailer listings explicitly recorded as serving Canada, ordered by product price before shipping."
              emptyMessage="No Canadian buying options are currently tracked for this version and size."
              offers={canadianOffers}
              title="Buy in Canada"
            />
          </div>
        </div>
      </div>

      {destinationMarket && destinationMarket !== "CA" ? (
        <OfferSection
          description={`Actual tracked listings recorded for ${marketNames[destinationMarket] ?? destinationMarket}. Native ${destinationOffers[0]?.nativeCurrency ?? "currency"} prices remain authoritative; benchmark sources and external signals are not treated as shopping options.`}
          emptyMessage={`No currently verified ${marketNames[destinationMarket] ?? destinationMarket} offers are tracked for this version and size.`}
          offers={destinationOffers}
          title={`Buy in ${marketNames[destinationMarket] ?? destinationMarket}`}
        />
      ) : null}

      <PriceHistorySection
        productContext={selectedVersionRecord.versionName + " · " + selectedVariantRecord.displaySize}
        series={priceHistorySeries}
      />

      <section className="mt-10 border-t border-slate-200 pt-8 sm:mt-12" aria-labelledby="product-details-title">
        <h2 className="text-xl font-semibold" id="product-details-title">Details and signals</h2>
        <div className="mt-5 grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Product details</h3>
            <dl className="mt-3 grid gap-3 text-sm">
              <div><dt className="text-slate-500">Version</dt><dd className="font-medium">{selectedVersionRecord.versionName}</dd></div>
              <div><dt className="text-slate-500">Size</dt><dd className="font-medium">{selectedVariantRecord.displaySize}</dd></div>
              <div><dt className="text-slate-500">Category</dt><dd className="font-medium">{family.primaryCanonicalCategory.displayName}</dd></div>
              {selectedVersionRecord.packagingDescription ? (
                <div><dt className="text-slate-500">Packaging</dt><dd className="font-medium">{selectedVersionRecord.packagingDescription}</dd></div>
              ) : null}
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">External signals</h3>
            <p className="mt-2 text-xs text-slate-500">Evidence signals are informational sources, not retailer buying options.</p>
            {selectedVersionRecord.externalSignals.length > 0 ? (
              <div className="mt-3 space-y-4">
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
                    {signal.rankingLabel ? <p className="mt-1 text-sm text-slate-600">{signal.rankingLabel}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No version-specific external signals are currently verified.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
