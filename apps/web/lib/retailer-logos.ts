export type RetailerLogoAsset = {
  src: string;
  width: number;
  height: number;
};

export type RetailerLogoRegistry = Readonly<Record<string, RetailerLogoAsset>>;

/**
 * Keys are canonical Retailer.sourceKey values, never display names. Only
 * reviewed, repository-hosted retailer marks belong here. A retailer
 * intentionally falls back to text until its local asset and usage rights have
 * been verified; remote logo hotlinks are not accepted.
 */
export const approvedRetailerLogos: RetailerLogoRegistry = {};

export function resolveRetailerLogo(
  retailerSourceKey: string | null | undefined,
  registry: RetailerLogoRegistry = approvedRetailerLogos,
) {
  if (!retailerSourceKey) return null;

  return registry[retailerSourceKey] ?? null;
}
