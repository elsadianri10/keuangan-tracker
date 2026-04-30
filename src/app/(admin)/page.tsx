"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MarketOverviewCard from "@/components/finance/dashboard/MarketOverviewCard";
import { auth } from "@/lib/firebase";
import { formatRupiah } from "@/lib/formatUniversal";
import { fetchHutang, fetchPiutang } from "@/services/hutangPiutangService";
import {
  fetchMarketOverview,
  updateMarketPreferences,
} from "@/services/marketService";
import { fetchTagihanWithItems } from "@/services/tagihanService";
import { MarketOverview, MarketPreferences } from "@/types/market";

type Summary = {
  tagihanAkun: number;
  totalItemTagihan: number;
  totalNominalTagihan: number;
  totalHutang: number;
  totalNominalHutang: number;
  totalPiutang: number;
  totalNominalPiutang: number;
};

export default function DashboardPage() {
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [marketPreferences, setMarketPreferences] =
    useState<MarketPreferences | null>(null);
  const [marketLoading, setMarketLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({
    tagihanAkun: 0,
    totalItemTagihan: 0,
    totalNominalTagihan: 0,
    totalHutang: 0,
    totalNominalHutang: 0,
    totalPiutang: 0,
    totalNominalPiutang: 0,
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) return;

      setMarketLoading(true);
      const [tagihan, hutang, piutang, marketResult] = await Promise.all([
        fetchTagihanWithItems(user.uid, user.email),
        fetchHutang(user.uid),
        fetchPiutang(user.uid),
        fetchMarketOverview(user.uid, user.email),
      ]);

      const totalNominalTagihan = tagihan.reduce((totalAkun, akun) => {
        const totalItems = akun.items.reduce((totalItem, item) => {
          const totalInstallments =
            item.installments.length > 0
              ? item.installments.reduce(
                  (totalInstallment, installment) =>
                    totalInstallment +
                    (installment.isPaid ? 0 : installment.nominal),
                  0
                )
              : item.nominal;

          return totalItem + totalInstallments;
        }, 0);

        return totalAkun + totalItems + (akun.biayaAdmin ?? 0);
      }, 0);

      const totalNominalPiutang = piutang.reduce((totalPiutang, item) => {
        const totalDana = item.itemsDana.reduce(
          (totalDanaItem, dana) => totalDanaItem + dana.nominalPinjam,
          0
        );
        const totalLimit = item.itemsLimit.reduce(
          (totalLimitItem, limit) => totalLimitItem + limit.nominalLimit,
          0
        );

        return totalPiutang + totalDana + totalLimit;
      }, 0);

      setSummary({
        tagihanAkun: tagihan.length,
        totalItemTagihan: tagihan.reduce((sum, akun) => sum + akun.items.length, 0),
        totalNominalTagihan,
        totalHutang: hutang.length,
        totalNominalHutang: hutang.reduce(
          (sum, item) => sum + item.nominalPinjam,
          0
        ),
        totalPiutang: piutang.length,
        totalNominalPiutang,
      });
      setMarketOverview(marketResult.overview);
      setMarketPreferences(marketResult.preferences);
      setMarketLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshMarketOverview = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setMarketLoading(true);
    const marketResult = await fetchMarketOverview(user.uid, user.email);
    setMarketOverview(marketResult.overview);
    setMarketPreferences(marketResult.preferences);
    setMarketLoading(false);
  };

  const handleSaveMarketPreferences = async (preferences: MarketPreferences) => {
    const user = auth.currentUser;
    if (!user) return;

    await updateMarketPreferences(user.uid, preferences, user.email);
    await refreshMarketOverview();
  };

  const cards = [
    {
      label: "Akun Tagihan",
      value: summary.tagihanAkun,
      meta: `${summary.totalItemTagihan} item cicilan`,
      amount: `Total Rp ${formatRupiah(summary.totalNominalTagihan)}`,
      href: "/tagihan",
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Data Hutang",
      value: summary.totalHutang,
      meta: "Jumlah data hutang",
      amount: `Total Rp ${formatRupiah(summary.totalNominalHutang)}`,
      href: "/hutangpiutang",
      color: "from-amber-500 to-orange-500",
    },
    {
      label: "Data Piutang",
      value: summary.totalPiutang,
      meta: "Jumlah data piutang",
      amount: `Total Rp ${formatRupiah(summary.totalNominalPiutang)}`,
      href: "/hutangpiutang",
      color: "from-fuchsia-500 to-pink-500",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-linear-to-r from-brand-950 via-brand-900 to-slate-900 p-8 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">
          My Finance Tracker
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          Welcome to Finance Tracker
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/75">
          Pantau ringkasan tagihan, hutang, piutang, dan wishlist Anda dalam
          satu dashboard.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-white/5"
          >
            <div
              className={`mb-4 h-2 w-24 rounded-full bg-linear-to-r ${card.color}`}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">
              {card.value}
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {card.meta}
            </p>
            <p className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-200">
              {card.amount}
            </p>
          </Link>
        ))}
      </div>
      
      {/* Market Overview */}
      {/* <MarketOverviewCard
        overview={marketOverview}
        loading={marketLoading}
        preferences={marketPreferences}
        onSavePreferences={handleSaveMarketPreferences}
      /> */}

      {/* Quick Access & Ringkasan */}
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Access
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/tagihan"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Buka Modul Tagihan
            </Link>
            <Link
              href="/hutangpiutang"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Buka Hutang & Piutang
            </Link>
            <Link
              href="/wishlist"
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Buka Wishlist
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ringkasan
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <li>Pantau jumlah akun tagihan dan item cicilan Anda dengan cepat.</li>
            <li>Lihat ringkasan data hutang dan piutang dalam satu dashboard.</li>
            <li>Akses menu utama dengan lebih mudah melalui tombol pintas di samping.</li>
          </ul>
        </div>
      </div>

    </div>
  );
}
