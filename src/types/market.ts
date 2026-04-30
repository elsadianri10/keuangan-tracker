export type StockExchange = "IDX" | "US";
export type MarketCurrency = "USD" | "IDR" | "EUR" | "SGD" | "JPY" | "GBP" | "AUD";

export interface StockWatchlistItem {
  id?: string;
  symbol: string;
  exchange: StockExchange;
  displayName?: string;
  sortOrder: number;
}

export interface StockQuote {
  symbol: string;
  providerSymbol: string;
  exchange: StockExchange;
  displayName: string;
  currency: "IDR" | "USD";
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  lastRefreshed?: string;
  status: "success" | "unavailable";
  message?: string;
}

export interface MarketIndicator {
  code: string;
  label: string;
  value: number | null;
  currency: string;
  unit?: string;
  lastRefreshed?: string;
  status: "success" | "unavailable";
  message?: string;
}

export interface MarketOverview {
  usdIdr: MarketIndicator;
  gold: MarketIndicator;
  silver: MarketIndicator;
}

export interface MarketPreferences {
  forexFrom: MarketCurrency;
  forexTo: MarketCurrency;
  metalsCurrency: MarketCurrency;
}
