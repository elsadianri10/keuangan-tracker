import {
  MarketIndicator,
  MarketPreferences,
  MarketOverview,
  StockQuote,
  StockWatchlistItem,
} from "@/types/market";

declare global {
  var __stockQuoteCache__:
    | Map<string, { expiresAt: number; quote: StockQuote }>
    | undefined;
  var __marketOverviewCache__:
    | { expiresAt: number; cacheKey: string; overview: MarketOverview }
    | undefined;
  var __alphaVantageQueue__: Promise<void> | undefined;
  var __alphaVantageLastRequestAt__: number | undefined;
}

const quoteCache = global.__stockQuoteCache__ ?? new Map<string, { expiresAt: number; quote: StockQuote }>();
let marketOverviewCache = global.__marketOverviewCache__;
let alphaVantageQueue = global.__alphaVantageQueue__ ?? Promise.resolve();
let alphaVantageLastRequestAt = global.__alphaVantageLastRequestAt__ ?? 0;

if (process.env.NODE_ENV !== "production") {
  global.__stockQuoteCache__ = quoteCache;
  global.__marketOverviewCache__ = marketOverviewCache;
  global.__alphaVantageQueue__ = alphaVantageQueue;
  global.__alphaVantageLastRequestAt__ = alphaVantageLastRequestAt;
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const ALPHA_VANTAGE_MIN_INTERVAL_MS = 1100;
const defaultMarketPreferences: MarketPreferences = {
  forexFrom: "USD",
  forexTo: "IDR",
  metalsCurrency: "IDR",
};

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const fetchAlphaVantageJson = async (url: URL) => {
  let releaseGate: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseGate = resolve;
  });
  const previousQueue = alphaVantageQueue;
  alphaVantageQueue = previousQueue.then(() => gate);

  await previousQueue;

  const now = Date.now();
  const diff = now - alphaVantageLastRequestAt;
  if (diff < ALPHA_VANTAGE_MIN_INTERVAL_MS) {
    await wait(ALPHA_VANTAGE_MIN_INTERVAL_MS - diff);
  }

  alphaVantageLastRequestAt = Date.now();
  if (process.env.NODE_ENV !== "production") {
    global.__alphaVantageLastRequestAt__ = alphaVantageLastRequestAt;
    global.__alphaVantageQueue__ = alphaVantageQueue;
  }

  try {
    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json()) as Record<string, unknown>;
    return { response, data };
  } finally {
    releaseGate();
  }
};

const getProviderSymbol = (item: Pick<StockWatchlistItem, "symbol" | "exchange">) =>
  item.exchange === "IDX" ? `${item.symbol}.JK` : item.symbol;

const buildUnavailableQuote = (
  item: StockWatchlistItem,
  message: string
): StockQuote => ({
  symbol: item.symbol,
  providerSymbol: getProviderSymbol(item),
  exchange: item.exchange,
  displayName: item.displayName?.trim() || item.symbol,
  currency: item.exchange === "IDX" ? "IDR" : "USD",
  price: null,
  previousClose: null,
  change: null,
  changePercent: null,
  status: "unavailable",
  message,
});

const parseNumber = (value: unknown) => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchStockQuote = async (item: StockWatchlistItem): Promise<StockQuote> => {
  const cacheKey = `${item.exchange}:${item.symbol}`;
  const cached = quoteCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return buildUnavailableQuote(
      item,
      "ALPHA_VANTAGE_API_KEY belum dikonfigurasi."
    );
  }

  const providerSymbol = getProviderSymbol(item);
  const endpoint = new URL("https://www.alphavantage.co/query");
  endpoint.searchParams.set("function", "TIME_SERIES_DAILY");
  endpoint.searchParams.set("symbol", providerSymbol);
  endpoint.searchParams.set("outputsize", "compact");
  endpoint.searchParams.set("apikey", apiKey);

  try {
    const { response, data } = await fetchAlphaVantageJson(endpoint);
    if (!response.ok) {
      return buildUnavailableQuote(item, "Gagal mengambil data saham.");
    }

    if (typeof data.Information === "string") {
      return buildUnavailableQuote(item, data.Information);
    }

    if (typeof data.Note === "string") {
      return buildUnavailableQuote(item, data.Note);
    }

    if (typeof data["Error Message"] === "string") {
      return buildUnavailableQuote(item, String(data["Error Message"]));
    }

    const metaData = data["Meta Data"] as Record<string, string> | undefined;
    const timeSeries = data["Time Series (Daily)"] as
      | Record<string, Record<string, string>>
      | undefined;

    if (!timeSeries || Object.keys(timeSeries).length === 0) {
      return buildUnavailableQuote(item, "Data saham tidak tersedia.");
    }

    const dates = Object.keys(timeSeries).sort((a, b) => b.localeCompare(a));
    const latest = timeSeries[dates[0]];
    const previous = timeSeries[dates[1]] ?? latest;
    const price = parseNumber(latest?.["4. close"]);
    const previousClose = parseNumber(previous?.["4. close"]);
    const change =
      price !== null && previousClose !== null ? price - previousClose : null;
    const changePercent =
      change !== null && previousClose
        ? (change / previousClose) * 100
        : null;

    const quote: StockQuote = {
      symbol: item.symbol,
      providerSymbol,
      exchange: item.exchange,
      displayName: item.displayName?.trim() || item.symbol,
      currency: item.exchange === "IDX" ? "IDR" : "USD",
      price,
      previousClose,
      change,
      changePercent,
      lastRefreshed: metaData?.["3. Last Refreshed"] ?? dates[0],
      status: price !== null ? "success" : "unavailable",
      message: price !== null ? undefined : "Harga saham tidak tersedia.",
    };

    quoteCache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      quote,
    });

    return quote;
  } catch (error) {
    return buildUnavailableQuote(
      item,
      error instanceof Error ? error.message : "Terjadi kesalahan saat mengambil data saham."
    );
  }
};

export const getStockQuotes = async (items: StockWatchlistItem[]) =>
  Promise.all(items.map((item) => fetchStockQuote(item)));

const buildUnavailableIndicator = (
  code: string,
  label: string,
  currency: string,
  message: string,
  unit?: string
): MarketIndicator => ({
  code,
  label,
  value: null,
  currency,
  unit,
  status: "unavailable",
  message,
});

const fetchExchangeRate = async (
  fromCurrency: MarketPreferences["forexFrom"],
  toCurrency: MarketPreferences["forexTo"]
): Promise<MarketIndicator> => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return buildUnavailableIndicator(
      `${fromCurrency}${toCurrency}`,
      `${fromCurrency}/${toCurrency}`,
      toCurrency,
      "ALPHA_VANTAGE_API_KEY belum dikonfigurasi."
    );
  }

  const endpoint = new URL("https://www.alphavantage.co/query");
  endpoint.searchParams.set("function", "CURRENCY_EXCHANGE_RATE");
  endpoint.searchParams.set("from_currency", fromCurrency);
  endpoint.searchParams.set("to_currency", toCurrency);
  endpoint.searchParams.set("apikey", apiKey);

  try {
    const { response, data } = await fetchAlphaVantageJson(endpoint);
    if (!response.ok) {
      return buildUnavailableIndicator(
        `${fromCurrency}${toCurrency}`,
        `${fromCurrency}/${toCurrency}`,
        toCurrency,
        `Gagal mengambil nilai tukar ${fromCurrency}/${toCurrency}.`
      );
    }

    if (typeof data.Information === "string") {
      return buildUnavailableIndicator(
        `${fromCurrency}${toCurrency}`,
        `${fromCurrency}/${toCurrency}`,
        toCurrency,
        data.Information
      );
    }

    if (typeof data.Note === "string") {
      return buildUnavailableIndicator(
        `${fromCurrency}${toCurrency}`,
        `${fromCurrency}/${toCurrency}`,
        toCurrency,
        data.Note
      );
    }

    const exchangeRate = data["Realtime Currency Exchange Rate"] as
      | Record<string, string>
      | undefined;
    const value = parseNumber(exchangeRate?.["5. Exchange Rate"]);

    return {
      code: `${fromCurrency}${toCurrency}`,
      label: `${fromCurrency}/${toCurrency}`,
      value,
      currency: toCurrency,
      lastRefreshed: exchangeRate?.["6. Last Refreshed"],
      status: value !== null ? "success" : "unavailable",
      message:
        value !== null
          ? undefined
          : `Nilai tukar ${fromCurrency}/${toCurrency} tidak tersedia.`,
    };
  } catch (error) {
    return buildUnavailableIndicator(
      `${fromCurrency}${toCurrency}`,
      `${fromCurrency}/${toCurrency}`,
      toCurrency,
      error instanceof Error
        ? error.message
        : `Terjadi kesalahan saat mengambil ${fromCurrency}/${toCurrency}.`
    );
  }
};

const fetchMetalSpot = async (
  symbol: "GOLD" | "SILVER",
  label: string
): Promise<MarketIndicator> => {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return buildUnavailableIndicator(
      symbol,
      label,
      "USD",
      "ALPHA_VANTAGE_API_KEY belum dikonfigurasi.",
      "per troy ounce"
    );
  }

  const endpoint = new URL("https://www.alphavantage.co/query");
  endpoint.searchParams.set("function", "GOLD_SILVER_SPOT");
  endpoint.searchParams.set("symbol", symbol);
  endpoint.searchParams.set("apikey", apiKey);

  try {
    const { response, data } = await fetchAlphaVantageJson(endpoint);
    if (!response.ok) {
      return buildUnavailableIndicator(
        symbol,
        label,
        "USD",
        `Gagal mengambil harga ${label.toLowerCase()}.`,
        "per troy ounce"
      );
    }

    if (typeof data.Information === "string") {
      return buildUnavailableIndicator(
        symbol,
        label,
        "USD",
        data.Information,
        "per troy ounce"
      );
    }

    if (typeof data.Note === "string") {
      return buildUnavailableIndicator(
        symbol,
        label,
        "USD",
        data.Note,
        "per troy ounce"
      );
    }

    const value =
      parseNumber(data.price) ??
      parseNumber(data.spot_price) ??
      parseNumber(data["spot price"]);
    const lastRefreshed =
      (typeof data.timestamp === "string" ? data.timestamp : undefined) ??
      (typeof data.last_refreshed === "string" ? data.last_refreshed : undefined);

    return {
      code: symbol,
      label,
      value,
      currency: "USD",
      unit: "per troy ounce",
      lastRefreshed,
      status: value !== null ? "success" : "unavailable",
      message: value !== null ? undefined : `Harga ${label.toLowerCase()} tidak tersedia.`,
    };
  } catch (error) {
    return buildUnavailableIndicator(
      symbol,
      label,
      "USD",
      error instanceof Error
        ? error.message
        : `Terjadi kesalahan saat mengambil harga ${label.toLowerCase()}.`,
      "per troy ounce"
    );
  }
};

export const getMarketOverview = async (
  preferences: MarketPreferences = defaultMarketPreferences
): Promise<MarketOverview> => {
  const cacheKey = JSON.stringify(preferences);
  if (
    marketOverviewCache &&
    marketOverviewCache.expiresAt > Date.now() &&
    marketOverviewCache.cacheKey === cacheKey
  ) {
    return marketOverviewCache.overview;
  }

  const [forex, goldUsd, silverUsd, metalsExchangeRate] = await Promise.all([
    fetchExchangeRate(preferences.forexFrom, preferences.forexTo),
    fetchMetalSpot("GOLD", "Emas"),
    fetchMetalSpot("SILVER", "Perak"),
    preferences.metalsCurrency === "USD"
      ? Promise.resolve<MarketIndicator>({
          code: "USDUSD",
          label: "USD/USD",
          value: 1,
          currency: "USD",
          status: "success",
        })
      : fetchExchangeRate("USD", preferences.metalsCurrency),
  ]);

  const convertMetalCurrency = (indicator: MarketIndicator): MarketIndicator => {
    if (preferences.metalsCurrency === "USD") {
      return indicator;
    }

    if (indicator.value === null || metalsExchangeRate.value === null) {
      return {
        ...indicator,
        currency: preferences.metalsCurrency,
        value: null,
        message: indicator.message ?? metalsExchangeRate.message,
      };
    }

    return {
      ...indicator,
      currency: preferences.metalsCurrency,
      value: indicator.value * metalsExchangeRate.value,
    };
  };

  const overview = {
    usdIdr: forex,
    gold: convertMetalCurrency(goldUsd),
    silver: convertMetalCurrency(silverUsd),
  };

  if (process.env.NODE_ENV !== "production") {
    marketOverviewCache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      cacheKey,
      overview,
    };
    global.__marketOverviewCache__ = marketOverviewCache;
  }

  return overview;
};
