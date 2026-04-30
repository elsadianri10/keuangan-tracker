"use client";

import { Pencil, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import BaseModal from "@/components/finance/shared/BaseModal";
import { StockQuote, StockWatchlistItem } from "@/types/market";

type StockWatchlistCardProps = {
  quotes: StockQuote[];
  watchlist: StockWatchlistItem[];
  loading: boolean;
  onSave: (items: StockWatchlistItem[]) => Promise<void>;
};

const exchangeLabels: Record<StockWatchlistItem["exchange"], string> = {
  IDX: "Indonesia",
  US: "Amerika Serikat",
};

const formatMoney = (value: number | null, currency: "IDR" | "USD") => {
  if (value === null) return "-";

  return new Intl.NumberFormat(currency === "IDR" ? "id-ID" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(value);
};

const formatChange = (quote: StockQuote) => {
  if (quote.change === null || quote.changePercent === null) return "-";

  const sign = quote.change > 0 ? "+" : "";
  return `${sign}${formatMoney(quote.change, quote.currency)} (${sign}${quote.changePercent.toFixed(2)}%)`;
};

export default function StockWatchlistCard({
  quotes,
  watchlist,
  loading,
  onSave,
}: StockWatchlistCardProps) {
  const [open, setOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<StockWatchlistItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setDraftItems(watchlist);
  }, [watchlist]);

  const firstUnavailableMessage = useMemo(
    () => quotes.find((quote) => quote.status === "unavailable")?.message ?? "",
    [quotes]
  );

  const handleChange = (
    index: number,
    field: keyof StockWatchlistItem,
    value: string
  ) => {
    setDraftItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]:
          field === "exchange"
            ? (value as StockWatchlistItem["exchange"])
            : value,
      };
      return next;
    });
  };

  const handleAddRow = () => {
    setDraftItems((prev) => [
      ...prev,
      {
        symbol: "",
        exchange: "IDX",
        displayName: "",
        sortOrder: prev.length,
      },
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setDraftItems((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSave = async () => {
    const normalized = draftItems.map((item, index) => ({
      ...item,
      symbol: item.symbol.trim().toUpperCase(),
      displayName: item.displayName?.trim() || item.symbol.trim().toUpperCase(),
      sortOrder: index,
    }));

    if (normalized.some((item) => !item.symbol)) {
      setErrorMessage("Semua baris watchlist harus punya simbol saham.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      await onSave(normalized);
      setOpen(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal menyimpan watchlist."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Saham Watchlist
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pantau saham pilihan Anda dan ubah daftar pantau kapan saja.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Atur Watchlist
          </button>
        </div>

        {firstUnavailableMessage ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {firstUnavailableMessage}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Memuat data saham...
          </p>
        ) : quotes.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Belum ada saham di watchlist.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border text-sm dark:border-gray-800">
              <thead>
                <tr className="bg-gray-100 dark:bg-white/5">
                  <th className="border px-3 py-2 text-left dark:border-gray-800">
                    Saham
                  </th>
                  <th className="border px-3 py-2 text-left dark:border-gray-800">
                    Bursa
                  </th>
                  <th className="border px-3 py-2 text-right dark:border-gray-800">
                    Harga
                  </th>
                  <th className="border px-3 py-2 text-right dark:border-gray-800">
                    Perubahan
                  </th>
                  <th className="border px-3 py-2 text-center dark:border-gray-800">
                    Update
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={`${quote.exchange}:${quote.symbol}`}>
                    <td className="border px-3 py-2 dark:border-gray-800">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {quote.displayName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {quote.providerSymbol}
                      </div>
                    </td>
                    <td className="border px-3 py-2 dark:border-gray-800">
                      {exchangeLabels[quote.exchange]}
                    </td>
                    <td className="border px-3 py-2 text-right dark:border-gray-800">
                      {formatMoney(quote.price, quote.currency)}
                    </td>
                    <td
                      className={`border px-3 py-2 text-right dark:border-gray-800 ${
                        quote.change !== null
                          ? quote.change > 0
                            ? "text-green-600 dark:text-green-400"
                            : quote.change < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-gray-600 dark:text-gray-300"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {formatChange(quote)}
                    </td>
                    <td className="border px-3 py-2 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                      {quote.lastRefreshed ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BaseModal
        open={open}
        onClose={() => {
          setOpen(false);
          setDraftItems(watchlist);
          setErrorMessage("");
        }}
        title="Atur Watchlist Saham"
        maxWidthClassName="max-w-4xl"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Untuk saham Indonesia, cukup isi simbol seperti `BBCA` atau `ANTM`.
            Untuk saham US, isi simbol seperti `AAPL`.
          </p>

          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="space-y-3">
            {draftItems.map((item, index) => (
              <div
                key={`${item.exchange}-${item.symbol}-${index}`}
                className="grid gap-3 rounded-xl border border-gray-200 p-4 dark:border-gray-800 md:grid-cols-[1.2fr_1fr_1.2fr_auto]"
              >
                <div>
                  <label className="mb-1 block text-sm font-medium">Simbol</label>
                  <input
                    type="text"
                    value={item.symbol}
                    onChange={(event) =>
                      handleChange(index, "symbol", event.target.value)
                    }
                    placeholder="Contoh: BBCA atau AAPL"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Pasar</label>
                  <select
                    value={item.exchange}
                    onChange={(event) =>
                      handleChange(index, "exchange", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <option value="IDX">Indonesia</option>
                    <option value="US">Amerika Serikat</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nama Tampilan
                  </label>
                  <input
                    type="text"
                    value={item.displayName ?? ""}
                    onChange={(event) =>
                      handleChange(index, "displayName", event.target.value)
                    }
                    placeholder="Opsional"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteRow(index)}
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Saham
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Watchlist"}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
