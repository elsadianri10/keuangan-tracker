"use client";

import { Pencil, Save } from "lucide-react";
import { useEffect, useState } from "react";
import BaseModal from "@/components/finance/shared/BaseModal";
import {
  MarketCurrency,
  MarketIndicator,
  MarketOverview,
  MarketPreferences,
} from "@/types/market";

type MarketOverviewCardProps = {
  overview: MarketOverview | null;
  loading: boolean;
  preferences: MarketPreferences | null;
  onSavePreferences: (preferences: MarketPreferences) => Promise<void>;
};

const currencyOptions: MarketCurrency[] = [
  "USD",
  "IDR",
  "EUR",
  "SGD",
  "JPY",
  "GBP",
  "AUD",
];

const formatIndicatorValue = (indicator: MarketIndicator) => {
  if (indicator.value === null) return "-";

  const locale = indicator.currency === "IDR" ? "id-ID" : "en-US";
  const maximumFractionDigits = indicator.currency === "IDR" ? 0 : 2;
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: indicator.currency,
    maximumFractionDigits,
  }).format(indicator.value);

  return indicator.unit ? `${formatted} ${indicator.unit}` : formatted;
};

export default function MarketOverviewCard({
  overview,
  loading,
  preferences,
  onSavePreferences,
}: MarketOverviewCardProps) {
  const [open, setOpen] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<MarketPreferences>({
    forexFrom: "USD",
    forexTo: "IDR",
    metalsCurrency: "IDR",
  });
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (preferences) {
      setDraftPreferences(preferences);
    }
  }, [preferences]);

  const indicators = overview
    ? [overview.usdIdr, overview.gold, overview.silver]
    : [];
  const firstUnavailableMessage =
    indicators.find((indicator) => indicator.status === "unavailable")?.message ?? "";

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Market Overview
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Pantau kurs mata uang serta harga spot emas dan perak.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          >
            <Pencil className="mr-2 h-4 w-4" />
            Atur Market
          </button>
        </div>

        {firstUnavailableMessage ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            {firstUnavailableMessage}
          </p>
        ) : null}

        {loading ? (
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Memuat data market overview...
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {indicators.map((indicator) => (
              <div
                key={indicator.code}
                className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {indicator.label}
                </p>
                <p className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  {formatIndicatorValue(indicator)}
                </p>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  {indicator.lastRefreshed ?? "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BaseModal
        open={open}
        onClose={() => {
          setOpen(false);
          setErrorMessage("");
          if (preferences) {
            setDraftPreferences(preferences);
          }
        }}
        title="Atur Market Overview"
        maxWidthClassName="max-w-2xl"
      >
        <div className="space-y-4">
          {errorMessage ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Kurs Dari
              </label>
              <select
                value={draftPreferences.forexFrom}
                onChange={(event) =>
                  setDraftPreferences((prev) => ({
                    ...prev,
                    forexFrom: event.target.value as MarketCurrency,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Kurs Ke
              </label>
              <select
                value={draftPreferences.forexTo}
                onChange={(event) =>
                  setDraftPreferences((prev) => ({
                    ...prev,
                    forexTo: event.target.value as MarketCurrency,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
              >
                {currencyOptions.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Mata Uang Emas & Perak
            </label>
            <select
              value={draftPreferences.metalsCurrency}
              onChange={(event) =>
                setDraftPreferences((prev) => ({
                  ...prev,
                  metalsCurrency: event.target.value as MarketCurrency,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            >
              {currencyOptions.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (draftPreferences.forexFrom === draftPreferences.forexTo) {
                  setErrorMessage("Mata uang asal dan tujuan kurs tidak boleh sama.");
                  return;
                }

                setSaving(true);
                setErrorMessage("");

                try {
                  await onSavePreferences(draftPreferences);
                  setOpen(false);
                } catch (error) {
                  setErrorMessage(
                    error instanceof Error
                      ? error.message
                      : "Gagal menyimpan preferensi market."
                  );
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Menyimpan..." : "Simpan Preferensi"}
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
