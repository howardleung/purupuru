import { BENCHMARK_PRECEDENCE, type BenchmarkKind } from "@beauty-platform/domain/shopping-list";

import type { CatalogueProduct } from "./catalogue-contract";

type HomepageBenchmark = NonNullable<CatalogueProduct["currentVersion"]>["benchmarks"][number];

export type HomepageDeal = {
  product: CatalogueProduct;
  currentPriceCad: number;
  referencePriceCad: number | null;
  discountPercent: number | null;
  retailerName: string;
};

function benchmarkRank(type: string) {
  const rank = BENCHMARK_PRECEDENCE.indexOf(type as BenchmarkKind);
  return rank === -1 ? BENCHMARK_PRECEDENCE.length : rank;
}

function selectCanadianReference(
  benchmarks: readonly HomepageBenchmark[],
  currentPriceCad: number,
) {
  return benchmarks
    .filter((benchmark) => benchmark.market === "CA" && benchmark.amountCad !== null && benchmark.amountCad > currentPriceCad)
    .sort((left, right) => {
      const rankDifference = benchmarkRank(left.type) - benchmarkRank(right.type);
      if (rankDifference !== 0) return rankDifference;
      return new Date(right.verifiedAt).getTime() - new Date(left.verifiedAt).getTime();
    })[0] ?? null;
}

export function buildHomepageDeals(
  products: readonly CatalogueProduct[],
  limit = 4,
): HomepageDeal[] {
  return products
    .flatMap((product): HomepageDeal[] => {
      const version = product.currentVersion;
      const price = version?.lowestCanadianPrice;
      if (!version || !price || price.amountCad === null) return [];

      const benchmark = selectCanadianReference(version.benchmarks, price.amountCad);
      const referencePriceCad = benchmark?.amountCad ?? null;
      const discountPercent = referencePriceCad === null
        ? null
        : Math.round(((referencePriceCad - price.amountCad) / referencePriceCad) * 100);

      return [{
        product,
        currentPriceCad: price.amountCad,
        referencePriceCad,
        discountPercent: discountPercent && discountPercent > 0 ? discountPercent : null,
        retailerName: price.retailerName,
      }];
    })
    .sort((left, right) => {
      if (left.discountPercent !== null || right.discountPercent !== null) {
        if (left.discountPercent === null) return 1;
        if (right.discountPercent === null) return -1;
        if (left.discountPercent !== right.discountPercent) return right.discountPercent - left.discountPercent;
      }
      return left.currentPriceCad - right.currentPriceCad ||
        left.product.canonicalName.localeCompare(right.product.canonicalName);
    })
    .slice(0, limit);
}

