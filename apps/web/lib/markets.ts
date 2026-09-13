export const SUPPORTED_TARGET_MARKETS = [
  { code: "CA", name: "Canada" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
] as const;

export function isSupportedTargetMarket(value: string): boolean {
  return SUPPORTED_TARGET_MARKETS.some((market) => market.code === value);
}

export function marketName(code: string): string {
  return SUPPORTED_TARGET_MARKETS.find((market) => market.code === code)?.name ?? code;
}
