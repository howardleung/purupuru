export type RetailerLogoAsset = {
  src: string;
  width: number;
  height: number;
};

export type RetailerLogoRegistry = Readonly<Record<string, RetailerLogoAsset>>;

function normalizeRetailerName(name: string) {
  return name.trim().toLocaleLowerCase("en-CA").replace(/\s+/g, " ");
}

/**
 * Only reviewed, repository-hosted retailer marks belong here. A retailer name
 * intentionally falls back to text until its local asset and usage rights have
 * been verified; remote logo hotlinks are not accepted.
 */
export const approvedRetailerLogos: RetailerLogoRegistry = {};

export function resolveRetailerLogo(
  retailerName: string,
  registry: RetailerLogoRegistry = approvedRetailerLogos,
) {
  return registry[normalizeRetailerName(retailerName)] ?? null;
}

