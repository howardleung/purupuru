import "server-only";

import { prisma } from "@beauty-platform/database";
import {
  compareDestinationOffers,
  isOfferEligibleForMarket,
  selectStrongestBenchmark,
  type ShoppingListBenchmark,
  type ShoppingListOffer,
} from "@beauty-platform/domain/shopping-list";

import { convertToCad } from "./currency-conversion";

export type ShoppingListSummary = {
  id: string;
  name: string;
  targetMarket: string;
  itemCount: number;
  updatedAt: string;
};

export type PreparedShoppingListOffer = ShoppingListOffer & {
  retailerName: string;
  listingUrl: string;
  rateDate: string | null;
  rateSource: string | null;
};

export type PreparedShoppingListBenchmark = ShoppingListBenchmark & {
  sourceDisplayName: string;
  sourceUrl: string | null;
  rateDate: string | null;
  rateSource: string | null;
};

export type PreparedShoppingListItem = {
  id: string;
  quantity: number;
  purchasedQuantity: number;
  productVariantId: string;
  displaySize: string;
  productVersionId: string;
  versionName: string;
  productFamilyId: string;
  productSlug: string;
  productName: string;
  brandName: string;
  offers: PreparedShoppingListOffer[];
  benchmark: PreparedShoppingListBenchmark | null;
};

export type PreparedShoppingList = {
  id: string;
  name: string;
  targetMarket: string;
  items: PreparedShoppingListItem[];
};

async function amountInCad(amount: number, currency: string) {
  if (currency === "CAD") {
    return { amountCad: amount, rateDate: null, rateSource: null };
  }

  const conversion = await convertToCad(amount, currency);
  return {
    amountCad: conversion?.amountCad ?? null,
    rateDate: conversion?.rateDate ?? null,
    rateSource: conversion?.sourceName ?? null,
  };
}

export async function getShoppingListsForUser(userId: string): Promise<ShoppingListSummary[]> {
  const lists = await prisma.shoppingList.findMany({
    where: { userId, visibility: "PRIVATE" },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    targetMarket: list.targetMarket,
    itemCount: list._count.items,
    updatedAt: list.updatedAt.toISOString(),
  }));
}

export async function getShoppingListForUser(
  userId: string,
  shoppingListId: string,
): Promise<PreparedShoppingList | null> {
  const list = await prisma.shoppingList.findFirst({
    where: { id: shoppingListId, userId, visibility: "PRIVATE" },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          productVariant: {
            include: {
              benchmarkPrices: { orderBy: { verifiedAt: "desc" } },
              offers: {
                where: { isActive: true },
                include: { retailer: true },
              },
              productVersion: {
                include: {
                  productFamily: { include: { brand: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!list) return null;

  const items = await Promise.all(
    list.items.map(async (item): Promise<PreparedShoppingListItem> => {
      const variant = item.productVariant;
      const benchmarkRecord = selectStrongestBenchmark(
        variant.benchmarkPrices
          .filter((benchmark) => benchmark.market === list.targetMarket)
          .map((benchmark) => ({
            id: benchmark.id,
            type: benchmark.type,
            nativeAmount: Number(benchmark.amount),
            nativeCurrency: benchmark.nativeCurrency,
            amountCad: null,
            verifiedAt: benchmark.verifiedAt,
          })),
      );
      const benchmarkConversion = benchmarkRecord
        ? await amountInCad(benchmarkRecord.nativeAmount, benchmarkRecord.nativeCurrency)
        : null;
      const benchmarkSource = benchmarkRecord
        ? variant.benchmarkPrices.find((candidate) => candidate.id === benchmarkRecord.id)
        : null;
      const benchmark: PreparedShoppingListBenchmark | null =
        benchmarkRecord && benchmarkConversion && benchmarkSource
          ? {
              ...benchmarkRecord,
              amountCad: benchmarkConversion.amountCad,
              verifiedAt: new Date(benchmarkRecord.verifiedAt).toISOString(),
              sourceDisplayName: benchmarkSource.sourceDisplayName,
              sourceUrl: benchmarkSource.sourceUrl,
              rateDate: benchmarkConversion.rateDate,
              rateSource: benchmarkConversion.rateSource,
            }
          : null;

      const offers = (
        await Promise.all(
          variant.offers
            .filter((offer) =>
              isOfferEligibleForMarket(
                {
                  id: offer.id,
                  nativeAmount: Number(offer.productPrice),
                  nativeCurrency: offer.nativeCurrency,
                  amountCad: null,
                  availableMarkets: offer.availableMarkets,
                  availabilityState: offer.availabilityState,
                },
                list.targetMarket,
              ),
            )
            .map(async (offer): Promise<PreparedShoppingListOffer> => {
              const conversion = await amountInCad(
                Number(offer.productPrice),
                offer.nativeCurrency,
              );
              return {
                id: offer.id,
                nativeAmount: Number(offer.productPrice),
                nativeCurrency: offer.nativeCurrency,
                amountCad: conversion.amountCad,
                availableMarkets: offer.availableMarkets,
                availabilityState: offer.availabilityState,
                retailerName: offer.retailer.name,
                listingUrl: offer.listingUrl,
                rateDate: conversion.rateDate,
                rateSource: conversion.rateSource,
              };
            }),
        )
      ).sort(compareDestinationOffers);

      const version = variant.productVersion;
      const family = version.productFamily;
      return {
        id: item.id,
        quantity: item.quantity,
        purchasedQuantity: item.purchasedQuantity,
        productVariantId: variant.id,
        displaySize: variant.displaySize,
        productVersionId: version.id,
        versionName: version.versionName,
        productFamilyId: family.id,
        productSlug: family.slug,
        productName: family.canonicalName,
        brandName: family.brand.name,
        offers,
        benchmark,
      };
    }),
  );

  return {
    id: list.id,
    name: list.name,
    targetMarket: list.targetMarket,
    items,
  };
}
