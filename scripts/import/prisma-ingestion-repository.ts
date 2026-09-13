import type { Prisma } from "../../packages/database/src/index.ts";
import type { MatchCandidate, NormalizedOfferItem, NormalizedSourceListing } from "../../packages/domain/src/ingestion.ts";

import type {
  ExistingObservation,
  ExistingOffer,
  IngestionRepository,
  ObservationWrite,
  OfferWrite,
  RetailerRecord,
} from "./ingestion-service.ts";

type DatabaseClient = Prisma.TransactionClient;

function offerRecord(offer: {
  id: string;
  retailerId: string;
  productVariantId: string;
  retailerListingId: string | null;
  listingUrl: string;
  productPrice: Prisma.Decimal;
  nativeCurrency: string;
  availableMarkets: string[];
  availabilityState: string;
  shippingState: string | null;
  shippingAmount: Prisma.Decimal | null;
  shippingCurrency: string | null;
  deliveryMethod: string | null;
  deliveryEstimate: string | null;
  shippingConditions: string | null;
  observedAt: Date;
  lastVerifiedAt: Date;
}): ExistingOffer {
  return {
    ...offer,
    productPrice: Number(offer.productPrice),
    shippingAmount: offer.shippingAmount === null ? null : Number(offer.shippingAmount),
  };
}

function observationRecord(observation: {
  id: string;
  offerId: string | null;
  amount: Prisma.Decimal;
  nativeCurrency: string;
  observedAt: Date;
}): ExistingObservation {
  return { ...observation, amount: Number(observation.amount) };
}

export class PrismaIngestionRepository implements IngestionRepository {
  private readonly database: DatabaseClient;

  constructor(database: DatabaseClient) {
    this.database = database;
  }

  async findRetailer(sourceKey: string): Promise<RetailerRecord | null> {
    return this.database.retailer.findUnique({
      where: { sourceKey },
      select: { id: true, name: true, sourceKey: true, country: true },
    });
  }

  async findMatchCandidates(record: NormalizedSourceListing): Promise<MatchCandidate[]> {
    const identityFilters: Prisma.ProductVariantWhereInput[] = [];
    if (record.gtin) identityFilters.push({ gtin: record.gtin });
    if (record.manufacturerSku) {
      identityFilters.push({ manufacturerSku: { equals: record.manufacturerSku, mode: "insensitive" } });
    }
    if (record.productTitle.trim()) {
      identityFilters.push({
        productVersion: {
          productFamily: {
            canonicalName: { equals: record.productTitle.trim(), mode: "insensitive" },
          },
        },
      });
    }
    if (identityFilters.length === 0) return [];

    const variants = await this.database.productVariant.findMany({
      where: { isActive: true, OR: identityFilters },
      include: {
        productVersion: {
          include: { productFamily: { include: { brand: true } } },
        },
      },
    });
    return variants.map((variant) => ({
      variantId: variant.id,
      productFamilyId: variant.productVersion.productFamilyId,
      productVersionId: variant.productVersionId,
      productName: variant.productVersion.productFamily.canonicalName,
      brandName: variant.productVersion.productFamily.brand.name,
      gtin: variant.gtin,
      manufacturerSku: variant.manufacturerSku,
      versionCode: variant.productVersion.versionCode,
      manufacturerVersionCode: variant.productVersion.manufacturerVersionCode,
      releaseDate: variant.productVersion.releaseDate?.toISOString() ?? null,
      formulationFingerprint: variant.productVersion.formulationFingerprint,
      packagingDescription: variant.productVersion.packagingDescription,
      normalizedQuantity: Number(variant.normalizedQuantity),
      normalizedUnit: variant.normalizedUnit,
    }));
  }

  async findOfferByExternalId(retailerId: string, externalListingId: string) {
    const offer = await this.database.offer.findUnique({
      where: { retailerId_retailerListingId: { retailerId, retailerListingId: externalListingId } },
    });
    return offer ? offerRecord(offer) : null;
  }

  async findOfferByUrl(retailerId: string, listingUrl: string) {
    const offer = await this.database.offer.findUnique({
      where: { retailerId_listingUrl: { retailerId, listingUrl } },
    });
    return offer ? offerRecord(offer) : null;
  }

  async createOffer(data: OfferWrite) {
    const offer = await this.database.offer.create({ data });
    return offerRecord(offer);
  }

  async updateOffer(id: string, data: OfferWrite) {
    const existing = await this.database.offer.findUniqueOrThrow({
      where: { id },
      select: { productPrice: true },
    });
    const priceChanged = Number(existing.productPrice) !== data.productPrice;
    const offer = await this.database.offer.update({
      where: { id },
      data: {
        ...data,
        ...(priceChanged ? { cadConvertedPrice: null, cadFxTimestamp: null } : {}),
      },
    });
    return offerRecord(offer);
  }

  async replaceOfferItems(offerId: string, items: readonly NormalizedOfferItem[]) {
    const relatedGtins = [...new Set(items.map((item) => item.relatedGtin).filter(Boolean))] as string[];
    const variants = relatedGtins.length
      ? await this.database.productVariant.findMany({
          where: { gtin: { in: relatedGtins } },
          select: { id: true, gtin: true },
        })
      : [];
    const byGtin = new Map(variants.map((variant) => [variant.gtin, variant.id]));

    await this.database.offerItem.deleteMany({ where: { offerId } });
    if (items.length > 0) {
      await this.database.offerItem.createMany({
        data: items.map((item) => ({
          offerId,
          label: item.label,
          quantity: item.quantity,
          itemType: item.itemType,
          isPromotional: item.isPromotional,
          relatedProductVariantId: item.relatedGtin ? (byGtin.get(item.relatedGtin) ?? null) : null,
        })),
      });
    }
  }

  async findObservation(offerId: string, observedAt: Date) {
    const observation = await this.database.priceObservation.findUnique({
      where: { offerId_observedAt: { offerId, observedAt } },
      select: { id: true, offerId: true, amount: true, nativeCurrency: true, observedAt: true },
    });
    return observation ? observationRecord(observation) : null;
  }

  async findLegacyObservation(input: ObservationWrite) {
    const observation = await this.database.priceObservation.findFirst({
      where: {
        offerId: null,
        productVariantId: input.productVariantId,
        retailerId: input.retailerId,
        sourceUrl: input.sourceUrl,
        amount: input.amount,
        nativeCurrency: input.nativeCurrency,
        observedAt: input.observedAt,
      },
      orderBy: { id: "asc" },
      select: { id: true, offerId: true, amount: true, nativeCurrency: true, observedAt: true },
    });
    return observation ? observationRecord(observation) : null;
  }

  async linkLegacyObservation(observationId: string, offerId: string) {
    await this.database.priceObservation.update({ where: { id: observationId }, data: { offerId } });
  }

  async createObservation(data: ObservationWrite) {
    const observation = await this.database.priceObservation.create({
      data,
      select: { id: true, offerId: true, amount: true, nativeCurrency: true, observedAt: true },
    });
    return observationRecord(observation);
  }
}