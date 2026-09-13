import "server-only";

import { convertCurrencyAmount } from "@beauty-platform/domain";

const BANK_OF_CANADA_API = "https://www.bankofcanada.ca/valet";
const BANK_OF_CANADA_RATES_URL = "https://www.bankofcanada.ca/rates/exchange/daily-exchange-rates/";
const RATE_CACHE_SECONDS = 60 * 60 * 24;

export type CadConversion = {
  amountCad: number;
  sourceCurrency: string;
  rateToCad: number;
  rateDate: string;
  sourceName: "Bank of Canada";
  sourceUrl: string;
};

type ValetObservation = {
  d?: string;
  [seriesName: string]: { v?: string } | string | undefined;
};

type ValetResponse = {
  observations?: ValetObservation[];
};

function seriesNameForCad(currency: string) {
  return `FX${currency}CAD`;
}

export async function convertToCad(
  amount: number,
  sourceCurrency: string,
): Promise<CadConversion | null> {
  const currency = sourceCurrency.trim().toUpperCase();

  if (currency === "CAD" || !/^[A-Z]{3}$/.test(currency)) return null;

  const seriesName = seriesNameForCad(currency);
  const url = `${BANK_OF_CANADA_API}/observations/${seriesName}/json?recent=1`;

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: RATE_CACHE_SECONDS },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as ValetResponse;
    const observation = [...(payload.observations ?? [])]
      .reverse()
      .find((item) => item.d && typeof item[seriesName] === "object");
    const rateValue = observation?.[seriesName];
    const rateToCad = Number(
      typeof rateValue === "object" && rateValue !== null ? rateValue.v : Number.NaN,
    );
    const amountCad = convertCurrencyAmount(amount, rateToCad);

    if (!observation?.d || amountCad === null) return null;

    return {
      amountCad,
      sourceCurrency: currency,
      rateToCad,
      rateDate: observation.d,
      sourceName: "Bank of Canada",
      sourceUrl: BANK_OF_CANADA_RATES_URL,
    };
  } catch {
    return null;
  }
}
