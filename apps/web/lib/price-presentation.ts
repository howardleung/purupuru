export type LocalFirstPrice = {
  primaryAmount: number;
  primaryCurrency: string;
  primaryIsApproximate: boolean;
  nativeSecondary: { amount: number; currency: string } | null;
  cadConversionUnavailable: boolean;
};

export function getLocalFirstPrice(
  nativeAmount: number,
  nativeCurrency: string,
  cadAmount: number | null,
): LocalFirstPrice {
  const currency = nativeCurrency.trim().toUpperCase();

  if (currency === "CAD") {
    return {
      primaryAmount: nativeAmount,
      primaryCurrency: currency,
      primaryIsApproximate: false,
      nativeSecondary: null,
      cadConversionUnavailable: false,
    };
  }

  if (cadAmount !== null && Number.isFinite(cadAmount)) {
    return {
      primaryAmount: cadAmount,
      primaryCurrency: "CAD",
      primaryIsApproximate: true,
      nativeSecondary: { amount: nativeAmount, currency },
      cadConversionUnavailable: false,
    };
  }

  return {
    primaryAmount: nativeAmount,
    primaryCurrency: currency,
    primaryIsApproximate: false,
    nativeSecondary: null,
    cadConversionUnavailable: true,
  };
}
