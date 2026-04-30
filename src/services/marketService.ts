import { auth } from "@/lib/firebase";
import {
  MarketPreferences,
  MarketOverview,
  StockQuote,
  StockWatchlistItem,
} from "@/types/market";

const getCurrentUserEmail = (fallback?: string | null) =>
  auth.currentUser?.email ?? fallback ?? null;

const requestJson = async <T>(input: RequestInfo, init?: RequestInit) => {
  const response = await fetch(input, init);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "message" in data
        ? String(data.message)
        : "Request gagal diproses.";
    throw new Error(message);
  }

  return data as T;
};

export const fetchStockWatchlist = async (
  userUID: string,
  email?: string | null
): Promise<StockWatchlistItem[]> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    return await requestJson<StockWatchlistItem[]>(
      `/api/market/watchlist?${searchParams.toString()}`
    );
  } catch (error) {
    console.error("Error fetching stock watchlist:", error);
    return [];
  }
};

export const updateStockWatchlist = async (
  userUID: string,
  items: StockWatchlistItem[],
  email?: string | null
) =>
  requestJson<StockWatchlistItem[]>("/api/market/watchlist", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      items,
    }),
  });

export const fetchStockQuotes = async (
  userUID: string,
  email?: string | null
): Promise<{ watchlist: StockWatchlistItem[]; quotes: StockQuote[] }> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    return await requestJson<{ watchlist: StockWatchlistItem[]; quotes: StockQuote[] }>(
      `/api/market/stocks?${searchParams.toString()}`
    );
  } catch (error) {
    console.error("Error fetching stock quotes:", error);
    return { watchlist: [], quotes: [] };
  }
};

export const fetchMarketPreferences = async (
  userUID: string,
  email?: string | null
): Promise<MarketPreferences | null> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    return await requestJson<MarketPreferences>(
      `/api/market/preferences?${searchParams.toString()}`
    );
  } catch (error) {
    console.error("Error fetching market preferences:", error);
    return null;
  }
};

export const updateMarketPreferences = async (
  userUID: string,
  preferences: MarketPreferences,
  email?: string | null
) =>
  requestJson<MarketPreferences>("/api/market/preferences", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firebaseUid: userUID,
      email: getCurrentUserEmail(email),
      preferences,
    }),
  });

export const fetchMarketOverview = async (
  userUID: string,
  email?: string | null
): Promise<{ overview: MarketOverview | null; preferences: MarketPreferences | null }> => {
  try {
    const searchParams = new URLSearchParams({ firebaseUid: userUID });
    const userEmail = getCurrentUserEmail(email);

    if (userEmail) {
      searchParams.set("email", userEmail);
    }

    return await requestJson<{
      overview: MarketOverview;
      preferences: MarketPreferences;
    }>(`/api/market/overview?${searchParams.toString()}`);
  } catch (error) {
    console.error("Error fetching market overview:", error);
    return { overview: null, preferences: null };
  }
};
