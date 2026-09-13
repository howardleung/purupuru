import {
  matchCanonicalVariant,
  type IngestionShippingState,
  type MatchCandidate,
  type NormalizedOfferItem,
  type NormalizedSourceListing,
} from "../../packages/domain/src/ingestion.ts";

export type RetailerRecord = { id: string; name: string; sourceKey: string; country: string | null };

export type ExistingOffer = {
  id: string;
  retailerId: string;
  productVariantId: string;
  retailerListingId: string | null;
  listingUrl: string;
  productPrice: number;
  nativeCurrency: string;
  availableMarkets: string[];
  availabilityState: string;
  shippingState: string | null;
  shippingAmount: number | null;
  shippingCurrency: string | null;
  deliveryMethod: string | null;
  deliveryEstimate: string | null;
  shippingConditions: string | null;
  observedAt: Date;
  lastVerifiedAt: Date;
};

export type ExistingObservation = {
  id: string;
  offerId: string | null;
  amount: number;
  nativeCurrency: string;
  observedAt: Date;
};

export type OfferWrite = {
  retailerId: string;
  productVariantId: string;
  retailerListingId: string | null;
  listingUrl: string;
  productPrice: number;
  nativeCurrency: string;
  availableMarkets: string[];
  availabilityState: NormalizedSourceListing["availabilityState"];
  shippingState: IngestionShippingState | null;
  shippingAmount: number | null;
  shippingCurrency: string | null;
  deliveryMethod: string | null;
  deliveryEstimate: string | null;
  shippingConditions: string | null;
  observedAt: Date;
  lastVerifiedAt: Date;
  isActive: boolean;
};

export type ObservationWrite = {
  offerId: string;
  productVariantId: string;
  retailerId: string;
  retailerName: string;
  amount: number;
  nativeCurrency: string;
  observedAt: Date;
  verificationType: NormalizedSourceListing["verificationType"];
  sourceUrl: string;
};

export interface IngestionRepository {
  findRetailer(sourceKey: string): Promise<RetailerRecord | null>;
  findMatchCandidates(record: NormalizedSourceListing): Promise<MatchCandidate[]>;
  findOfferByExternalId(retailerId: string, externalListingId: string): Promise<ExistingOffer | null>;
  findOfferByUrl(retailerId: string, listingUrl: string): Promise<ExistingOffer | null>;
  createOffer(data: OfferWrite): Promise<ExistingOffer>;
  updateOffer(id: string, data: OfferWrite): Promise<ExistingOffer>;
  replaceOfferItems(offerId: string, items: readonly NormalizedOfferItem[]): Promise<void>;
  findObservation(offerId: string, observedAt: Date): Promise<ExistingObservation | null>;
  findLegacyObservation(input: ObservationWrite): Promise<ExistingObservation | null>;
  linkLegacyObservation(observationId: string, offerId: string): Promise<void>;
  createObservation(data: ObservationWrite): Promise<ExistingObservation>;
}

export type IngestionResult = {
  sourceKey: string;
  externalListingId: string | null;
  sourceUrl: string;
  dryRun: boolean;
  status: "matched" | "created" | "updated" | "unchanged" | "unmatched" | "ambiguous" | "rejected";
  match: {
    status: "matched" | "unmatched" | "ambiguous" | "rejected";
    variantId: string | null;
    evidence: string[];
    reason: string | null;
  };
  offer: { action: "created" | "updated" | "unchanged" | "none"; offerId: string | null; changes: string[] };
  observation: { action: "created" | "linked" | "unchanged" | "none"; observationId: string | null };
  errors: string[];
};

function sameArray(left: readonly string[], right: readonly string[]) {
  return [...left].sort().join("\u0000") === [...right].sort().join("\u0000");
}

function sameNullable(left: unknown, right: unknown) {
  return left === right || (left === null && right === null);
}

function writeFor(
  retailerId: string,
  variantId: string,
  record: NormalizedSourceListing,
): OfferWrite {
  const observedAt = new Date(record.observedAt!);
  return {
    retailerId,
    productVariantId: variantId,
    retailerListingId: record.externalListingId,
    listingUrl: record.sourceUrl,
    productPrice: record.amount!,
    nativeCurrency: record.nativeCurrency!,
    availableMarkets: [...record.availableMarkets].sort(),
    availabilityState: record.availabilityState,
    shippingState: record.shipping?.state ?? null,
    shippingAmount: record.shipping?.amount ?? null,
    shippingCurrency: record.shipping?.currency ?? null,
    deliveryMethod: record.shipping?.method ?? null,
    deliveryEstimate: record.shipping?.estimate ?? null,
    shippingConditions: record.shipping?.conditions ?? null,
    observedAt,
    lastVerifiedAt: observedAt,
    isActive: true,
  };
}

function currentChanges(offer: ExistingOffer, write: OfferWrite) {
  const changes: string[] = [];
  const fields: Array<[keyof ExistingOffer, keyof OfferWrite, string]> = [
    ["retailerListingId", "retailerListingId", "external listing ID"],
    ["listingUrl", "listingUrl", "listing URL"],
    ["productPrice", "productPrice", "product price"],
    ["availabilityState", "availabilityState", "availability"],
    ["shippingState", "shippingState", "shipping state"],
    ["shippingAmount", "shippingAmount", "shipping amount"],
    ["shippingCurrency", "shippingCurrency", "shipping currency"],
    ["deliveryMethod", "deliveryMethod", "delivery method"],
    ["deliveryEstimate", "deliveryEstimate", "delivery estimate"],
    ["shippingConditions", "shippingConditions", "shipping conditions"],
  ];
  for (const [offerKey, writeKey, label] of fields) {
    if (!sameNullable(offer[offerKey], write[writeKey])) changes.push(label);
  }
  if (!sameArray(offer.availableMarkets, write.availableMarkets)) changes.push("available markets");
  if (write.lastVerifiedAt.getTime() > offer.lastVerifiedAt.getTime()) changes.push("verification timestamp");
  return changes;
}

function rejected(record: NormalizedSourceListing, dryRun: boolean, reason: string): IngestionResult {
  return {
    sourceKey: record.sourceKey,
    externalListingId: record.externalListingId,
    sourceUrl: record.sourceUrl,
    dryRun,
    status: "rejected",
    match: { status: "rejected", variantId: null, evidence: [], reason },
    offer: { action: "none", offerId: null, changes: [] },
    observation: { action: "none", observationId: null },
    errors: [reason],
  };
}

/** Process one listing. Callers provide transaction boundaries for execute mode. */
export async function ingestNormalizedListing(
  repository: IngestionRepository,
  record: NormalizedSourceListing,
  options: { dryRun: boolean },
): Promise<IngestionResult> {
  const retailer = await repository.findRetailer(record.sourceKey);
  if (!retailer) return rejected(record, options.dryRun, `Unknown retailer sourceKey: ${record.sourceKey}`);

  const match = matchCanonicalVariant(record, await repository.findMatchCandidates(record));
  if (match.status !== "matched") {
    return {
      sourceKey: record.sourceKey,
      externalListingId: record.externalListingId,
      sourceUrl: record.sourceUrl,
      dryRun: options.dryRun,
      status: match.status,
      match: {
        status: match.status,
        variantId: null,
        evidence: [],
        reason: match.reason,
      },
      offer: { action: "none", offerId: null, changes: [] },
      observation: { action: "none", observationId: null },
      errors: match.status === "rejected" ? [match.reason] : [],
    };
  }

  const [byExternalId, byUrl] = await Promise.all([
    record.externalListingId
      ? repository.findOfferByExternalId(retailer.id, record.externalListingId)
      : Promise.resolve(null),
    repository.findOfferByUrl(retailer.id, record.sourceUrl),
  ]);
  if (byExternalId && byUrl && byExternalId.id !== byUrl.id) {
    return rejected(record, options.dryRun, "External listing ID and URL resolve to different existing offers");
  }
  let offer = byExternalId ?? byUrl;
  if (offer && offer.productVariantId !== match.candidate.variantId) {
    return rejected(record, options.dryRun, "Stable offer identity conflicts with the matched canonical variant");
  }
  if (
    offer?.retailerListingId &&
    record.externalListingId &&
    offer.retailerListingId !== record.externalListingId
  ) {
    return rejected(record, options.dryRun, "Listing URL is already attached to a different external listing ID");
  }
  if (offer && offer.nativeCurrency !== record.nativeCurrency) {
    return rejected(record, options.dryRun, "Native currency changed for an existing offer identity");
  }

  const write = writeFor(retailer.id, match.candidate.variantId, record);
  const plannedOfferId = offer?.id ?? "(new offer)";
  const observationWrite: ObservationWrite = {
    offerId: plannedOfferId,
    productVariantId: match.candidate.variantId,
    retailerId: retailer.id,
    retailerName: retailer.name,
    amount: record.amount!,
    nativeCurrency: record.nativeCurrency!,
    observedAt: write.observedAt,
    verificationType: record.verificationType,
    sourceUrl: record.sourceUrl,
  };
  const existingObservation = offer
    ? await repository.findObservation(offer.id, write.observedAt)
    : null;
  if (
    existingObservation &&
    (existingObservation.amount !== observationWrite.amount ||
      existingObservation.nativeCurrency !== observationWrite.nativeCurrency)
  ) {
    return rejected(record, options.dryRun, "An observation already exists at this timestamp with different price data");
  }
  const legacyObservation = existingObservation
    ? null
    : await repository.findLegacyObservation(observationWrite);

  const incomingIsCurrent = !offer || write.observedAt.getTime() >= offer.lastVerifiedAt.getTime();
  let changes = offer && incomingIsCurrent ? currentChanges(offer, write) : [];
  let offerAction: IngestionResult["offer"]["action"] = "unchanged";
  if (!offer) {
    offerAction = "created";
    changes = ["new offer"];
    if (!options.dryRun) offer = await repository.createOffer(write);
  } else if (incomingIsCurrent && changes.length > 0) {
    offerAction = "updated";
    if (!options.dryRun) offer = await repository.updateOffer(offer.id, write);
  }

  const effectiveOfferId = offer?.id ?? plannedOfferId;
  if (record.bundleItems !== null && (offerAction === "created" || offerAction === "updated")) {
    changes.push("structured offer items");
    if (!options.dryRun) await repository.replaceOfferItems(effectiveOfferId, record.bundleItems);
  }

  let observationAction: IngestionResult["observation"]["action"] = "unchanged";
  let observationId = existingObservation?.id ?? null;
  if (!existingObservation && legacyObservation) {
    observationAction = "linked";
    observationId = legacyObservation.id;
    if (!options.dryRun) await repository.linkLegacyObservation(legacyObservation.id, effectiveOfferId);
  } else if (!existingObservation) {
    observationAction = "created";
    if (!options.dryRun) {
      const created = await repository.createObservation({ ...observationWrite, offerId: effectiveOfferId });
      observationId = created.id;
    }
  }

  const status = offerAction === "created" ? "created" : offerAction === "updated" ? "updated" : "unchanged";
  return {
    sourceKey: record.sourceKey,
    externalListingId: record.externalListingId,
    sourceUrl: record.sourceUrl,
    dryRun: options.dryRun,
    status,
    match: {
      status: "matched",
      variantId: match.candidate.variantId,
      evidence: match.evidence,
      reason: null,
    },
    offer: { action: offerAction, offerId: effectiveOfferId, changes },
    observation: { action: observationAction, observationId },
    errors: [],
  };
}