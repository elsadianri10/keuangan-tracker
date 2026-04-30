"use client";

import { ChevronDown, ChevronUp, Pencil, Plus, RefreshCcw, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import PiutangForm from "@/components/finance/hutang-piutang/PiutangForm";
import HutangForm from "@/components/finance/hutang-piutang/HutangForm";
import { LoadingTable } from "@/components/finance/shared/LoadingState";
import BaseModal from "@/components/finance/shared/BaseModal";
import { ConfirmModal } from "@/components/finance/shared/ModalDialog";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { auth } from "@/lib/firebase";
import { formatDateLong, formatRupiah } from "@/lib/formatUniversal";
import {
  deleteHutang,
  deletePiutang,
  fetchHutang,
  fetchPiutang,
} from "@/services/hutangPiutangService";
import { Hutang, Piutang } from "@/types/hutangPiutang";

export default function HutangPiutangPage() {
  const isOnline = useOnlineStatus();
  const userEmail = auth.currentUser?.email ?? "User";

  const [loading, setLoading] = useState(true);
  const [showHutang, setShowHutang] = useState(false);
  const [dataHutang, setDataHutang] = useState<Hutang[]>([]);
  const [openDialogHutang, setOpenDialogHutang] = useState(false);
  const [selectedHutang, setSelectedHutang] = useState<Hutang | null>(null);
  const [selectedDeleteHutang, setSelectedDeleteHutang] = useState<Hutang | null>(
    null
  );
  const [showConfirmHutang, setShowConfirmHutang] = useState(false);

  const [showPiutang, setShowPiutang] = useState(false);
  const [dataPiutang, setDataPiutang] = useState<Piutang[]>([]);
  const [selectedPiutang, setSelectedPiutang] = useState<Piutang | null>(null);
  const [selectedDeletePiutang, setSelectedDeletePiutang] =
    useState<Piutang | null>(null);
  const [showConfirmPiutang, setShowConfirmPiutang] = useState(false);
  const [openDialogPiutang, setOpenDialogPiutang] = useState(false);
  const [piutangTab, setPiutangTab] = useState<"uang_pribadi" | "limit_paylater">(
    "uang_pribadi"
  );

  const usedDanaPribadiList = dataPiutang
    .filter((item) => item.jenisPiutang === "Dana Pribadi")
    .map((item) => item.asalDana);
  const usedLimitList = dataPiutang
    .filter((item) => item.jenisPiutang === "Limit Pay Later")
    .map((item) => item.asalLimit);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      await loadAllData(user.uid);
    });

    return () => unsubscribe();
  }, []);

  const loadAllData = async (userId: string) => {
    try {
      setLoading(true);
      const [hutang, piutang] = await Promise.all([
        fetchHutang(userId),
        fetchPiutang(userId),
      ]);
      setDataHutang(hutang);
      setDataPiutang(piutang);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await loadAllData(user.uid);
  };

  const handleSubmitHutang = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await loadAllData(user.uid);
    setSelectedHutang(null);
    setOpenDialogHutang(false);
  };

  const handleSubmitPiutang = async () => {
    const user = auth.currentUser;
    if (!user) return;
    await loadAllData(user.uid);
    setSelectedPiutang(null);
    setOpenDialogPiutang(false);
  };

  const handleDeleteHutang = async () => {
    const user = auth.currentUser;
    if (!user || !selectedDeleteHutang?.id) return;

    try {
      await deleteHutang(user.uid, selectedDeleteHutang.id);
      setDataHutang((prev) =>
        prev.filter((item) => item.id !== selectedDeleteHutang.id)
      );
    } catch (error) {
      console.error("Gagal menghapus hutang:", error);
    } finally {
      setShowConfirmHutang(false);
      setSelectedDeleteHutang(null);
    }
  };

  const handleDeletePiutang = async () => {
    const user = auth.currentUser;
    if (!user || !selectedDeletePiutang?.id) return;

    try {
      await deletePiutang(
        user.uid,
        selectedDeletePiutang.jenisPiutang,
        selectedDeletePiutang.id
      );
      setDataPiutang((prev) =>
        prev.filter((item) => item.id !== selectedDeletePiutang.id)
      );
    } catch (error) {
      console.error("Gagal menghapus piutang:", error);
    } finally {
      setShowConfirmPiutang(false);
      setSelectedDeletePiutang(null);
    }
  };

  const filteredPiutang = dataPiutang.filter((item) =>
    piutangTab === "uang_pribadi"
      ? item.jenisPiutang === "Dana Pribadi"
      : item.jenisPiutang === "Limit Pay Later"
  );

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Daftar Hutang & Piutang
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Catat dan kelola data hutang serta piutang Anda dalam satu halaman.
        </p>
      </div>

      <div className="mb-4">
        <button
          className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
          onClick={handleRefresh}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh Data
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowHutang((prev) => !prev)}
          className="mb-4 flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-left font-semibold dark:bg-white/5"
        >
          <span>Hutang Saya</span>
          {showHutang ? <ChevronUp /> : <ChevronDown />}
        </button>

        <div className="mb-3 flex justify-end">
          <button
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => {
              setSelectedHutang(null);
              setOpenDialogHutang(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data Hutang
          </button>
        </div>

        {showHutang ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/5">
            {loading ? (
              isOnline ? (
                <LoadingTable />
              ) : (
                <p className="text-red-500 italic">Tidak ada koneksi internet.</p>
              )
            ) : dataHutang.length === 0 ? (
              <p className="text-gray-500 italic">Belum ada data hutang.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border text-sm dark:border-gray-800">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-white/5">
                      <th className="border px-2 py-1 dark:border-gray-800">
                        Nama Kreditur
                      </th>
                      <th className="border px-2 py-1 dark:border-gray-800">
                        Keterangan
                      </th>
                      <th className="border px-2 py-1 dark:border-gray-800">
                        Tanggal Pinjam
                      </th>
                      <th className="border px-2 py-1 dark:border-gray-800">
                        Tanggal Kembali
                      </th>
                      <th className="border px-2 py-1 dark:border-gray-800">
                        Nominal
                      </th>
                      <th className="border px-2 py-1 dark:border-gray-800">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataHutang.map((hutang) => (
                      <tr key={hutang.id}>
                        <td className="border px-2 py-1 dark:border-gray-800">
                          {hutang.namaKreditur}
                        </td>
                        <td className="border px-2 py-1 dark:border-gray-800">
                          {hutang.keteranganPinjam}
                        </td>
                        <td className="border px-2 py-1 text-center dark:border-gray-800">
                          {formatDateLong(hutang.tglPinjam)}
                        </td>
                        <td className="border px-2 py-1 text-center dark:border-gray-800">
                          {formatDateLong(hutang.tglKembali)}
                        </td>
                        <td className="border px-2 py-1 text-right dark:border-gray-800">
                          Rp {hutang.nominalPinjam.toLocaleString("id-ID")}
                        </td>
                        <td className="border px-2 py-1 text-center dark:border-gray-800">
                          <div className="flex justify-center gap-2">
                            <button
                              className="inline-flex rounded-lg bg-yellow-100 p-2 text-yellow-600 transition hover:bg-yellow-200"
                              onClick={() => {
                                setSelectedHutang(hutang);
                                setOpenDialogHutang(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              className="inline-flex rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                              onClick={() => {
                                setSelectedDeleteHutang(hutang);
                                setShowConfirmHutang(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold dark:bg-white/5">
                      <td
                        colSpan={4}
                        className="border px-2 py-1 text-right dark:border-gray-800"
                      >
                        Total Akhir
                      </td>
                      <td className="border px-2 py-1 text-right dark:border-gray-800">
                        Rp{" "}
                        {dataHutang
                          .reduce((acc, item) => acc + item.nominalPinjam, 0)
                          .toLocaleString("id-ID")}
                      </td>
                      <td className="border px-2 py-1 dark:border-gray-800" />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowPiutang((prev) => !prev)}
          className="mb-4 flex w-full items-center justify-between rounded-xl bg-gray-100 px-4 py-3 text-left font-semibold dark:bg-white/5"
        >
          <span>Piutang</span>
          {showPiutang ? <ChevronUp /> : <ChevronDown />}
        </button>

        <div className="mb-3 flex justify-end">
          <button
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            onClick={() => {
              setSelectedPiutang(null);
              setOpenDialogPiutang(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tambah Data Piutang
          </button>
        </div>

        {showPiutang ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/5">
            <div className="mb-4 flex">
              {(["uang_pribadi", "limit_paylater"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPiutangTab(tab)}
                  className={`border px-4 py-2 ${
                    tab === "uang_pribadi" ? "rounded-l-lg" : "rounded-r-lg"
                  } ${
                    piutangTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-200"
                  }`}
                >
                  {tab === "uang_pribadi" ? "Uang Pribadi" : "Limit Pay Later"}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-col items-center gap-1">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                {userEmail.charAt(0).toUpperCase()}
              </button>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {userEmail}
              </p>
            </div>

            {loading ? (
              isOnline ? (
                <LoadingTable />
              ) : (
                <p className="text-red-500 italic">Tidak ada koneksi internet.</p>
              )
            ) : filteredPiutang.length === 0 ? (
              <p className="text-gray-500 italic">
                Belum ada data piutang untuk kategori ini.
              </p>
            ) : (
              <div className="space-y-4">
                {filteredPiutang.map((piutang) => {
                  const isDana = piutang.jenisPiutang === "Dana Pribadi";
                  const platform = isDana
                    ? piutang.asalDana === "Lainnya"
                      ? piutang.customDana
                      : piutang.asalDana
                    : piutang.asalLimit === "Lainnya"
                    ? piutang.customLimit
                    : piutang.asalLimit;
                  const totalNominal = isDana
                    ? piutang.itemsDana.reduce((sum, item) => sum + item.nominalPinjam, 0)
                    : piutang.itemsLimit.reduce((sum, item) => sum + item.nominalLimit, 0);

                  return (
                    <div
                      key={piutang.id}
                      className="rounded-2xl border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {piutang.namaDebitur}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {isDana ? "Platform Dana" : "Platform Pay Later"}:{" "}
                            {platform || "-"}
                          </p>
                          {!isDana ? (
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Pembukuan: Tanggal {piutang.pembukuan} - Jatuh
                              Tempo: Tanggal {piutang.jatuhTempo}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="inline-flex rounded-lg bg-yellow-100 p-2 text-yellow-600 transition hover:bg-yellow-200"
                            onClick={() => {
                              setSelectedPiutang(piutang);
                              setOpenDialogPiutang(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            className="inline-flex rounded-lg bg-red-100 p-2 text-red-600 transition hover:bg-red-200"
                            onClick={() => {
                              setSelectedDeletePiutang(piutang);
                              setShowConfirmPiutang(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        {isDana ? (
                          <table className="w-full border text-sm dark:border-gray-800">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-white/5">
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Keterangan
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Tanggal Pinjam
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Tanggal Kembali
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Bunga
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Nominal
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {piutang.itemsDana.map((item, index) => (
                                <tr key={index}>
                                  <td className="border px-2 py-1 dark:border-gray-800">
                                    {item.keteranganPinjam}
                                  </td>
                                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                                    {formatDateLong(item.tglPinjam)}
                                  </td>
                                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                                    {formatDateLong(item.tglKembali)}
                                  </td>
                                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                                    {item.bungaPinjam ? `${item.bungaPinjam}%` : "-"}
                                  </td>
                                  <td className="border px-2 py-1 text-right dark:border-gray-800">
                                    Rp {formatRupiah(item.nominalPinjam)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-100 font-semibold dark:bg-white/5">
                                <td
                                  colSpan={4}
                                  className="border px-2 py-1 text-right dark:border-gray-800"
                                >
                                  Total Pokok
                                </td>
                                <td className="border px-2 py-1 text-right dark:border-gray-800">
                                  Rp {formatRupiah(totalNominal)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        ) : (
                          <table className="w-full border text-sm dark:border-gray-800">
                            <thead>
                              <tr className="bg-gray-100 dark:bg-white/5">
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Keterangan
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Awal Transaksi
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Tenor
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Rentang Tagihan
                                </th>
                                <th className="border px-2 py-1 dark:border-gray-800">
                                  Nominal
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {piutang.itemsLimit.map((item, index) => (
                                <tr key={index}>
                                  <td className="border px-2 py-1 dark:border-gray-800">
                                    {item.keteranganLimit}
                                  </td>
                                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                                    {formatDateLong(item.tanggalAwal)}
                                  </td>
                                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                                    {item.tenor} bulan
                                  </td>
                                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                                    {formatDateLong(item.tanggalMulai)} -{" "}
                                    {formatDateLong(item.tanggalSelesai)}
                                  </td>
                                  <td className="border px-2 py-1 text-right dark:border-gray-800">
                                    Rp {formatRupiah(item.nominalLimit)}
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-gray-100 font-semibold dark:bg-white/5">
                                <td
                                  colSpan={4}
                                  className="border px-2 py-1 text-right dark:border-gray-800"
                                >
                                  Total Nominal
                                </td>
                                <td className="border px-2 py-1 text-right dark:border-gray-800">
                                  Rp {formatRupiah(totalNominal)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <BaseModal
        open={openDialogHutang}
        onClose={() => {
          setOpenDialogHutang(false);
          setSelectedHutang(null);
        }}
        title={selectedHutang ? "Edit Data Hutang" : "Tambah Data Hutang"}
      >
        <HutangForm
          onSubmit={handleSubmitHutang}
          isEditMode={Boolean(selectedHutang)}
          editData={selectedHutang ?? undefined}
        />
      </BaseModal>

      <BaseModal
        open={openDialogPiutang}
        onClose={() => {
          setOpenDialogPiutang(false);
          setSelectedPiutang(null);
        }}
        title={selectedPiutang ? "Edit Data Piutang" : "Tambah Data Piutang"}
        maxWidthClassName="max-w-4xl"
      >
        <PiutangForm
          onSubmit={handleSubmitPiutang}
          isEditMode={Boolean(selectedPiutang)}
          editData={selectedPiutang ?? undefined}
          usedDanaPribadiList={usedDanaPribadiList}
          usedLimitList={usedLimitList}
        />
      </BaseModal>

      <ConfirmModal
        show={showConfirmHutang}
        message="Apakah Anda yakin ingin menghapus data hutang ini?"
        onClose={() => {
          setShowConfirmHutang(false);
          setSelectedDeleteHutang(null);
        }}
        onConfirm={handleDeleteHutang}
      />

      <ConfirmModal
        show={showConfirmPiutang}
        message="Apakah Anda yakin ingin menghapus data piutang ini?"
        onClose={() => {
          setShowConfirmPiutang(false);
          setSelectedDeletePiutang(null);
        }}
        onConfirm={handleDeletePiutang}
      />
    </>
  );
}
