"use client";

import { Eye, Pencil, Plus, RefreshCcw, Search, Trash } from "lucide-react";
import { useEffect, useState } from "react";
import TagihanForm from "@/components/finance/tagihan/TagihanForm";
import TagihanDetailDialog from "@/components/finance/tagihan/TagihanDetailDialog";
import { LoadingTable } from "@/components/finance/shared/LoadingState";
import BaseModal from "@/components/finance/shared/BaseModal";
import { ConfirmModal } from "@/components/finance/shared/ModalDialog";
import useOnlineStatus from "@/hooks/useOnlineStatus";
import { auth } from "@/lib/firebase";
import { formatDateLong } from "@/lib/formatUniversal";
import {
  deleteTagihan,
  fetchTagihanWithItems,
} from "@/services/tagihanService";
import { TagihanAkun, TagihanItem } from "@/types/tagihan";

export default function TagihanPage() {
  const isOnline = useOnlineStatus();
  const [dataTagihan, setDataTagihan] = useState<TagihanAkun[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAkun, setSelectedAkun] = useState<TagihanAkun | null>(null);
  const [selectedItem, setSelectedItem] = useState<TagihanItem | null>(null);
  const [selectedDelete, setSelectedDelete] = useState<TagihanAkun | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [filterAkun, setFilterAkun] = useState("");
  const [filterCustom, setFilterCustom] = useState("");

  const usedAkunList = dataTagihan.map((item) => item.namaAkun);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      await loadDataTagihan(user.uid, user.email);
    });

    return () => unsubscribe();
  }, []);

  const loadDataTagihan = async (userId: string, email?: string | null) => {
    try {
      setLoading(true);
      const result = await fetchTagihanWithItems(userId, email);
      setDataTagihan(result);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTagihan = async () => {
    const user = auth.currentUser;
    if (!user) return;

    await loadDataTagihan(user.uid, user.email);
    setSelectedAkun(null);
    setOpenDialog(false);
  };

  const handleDelete = async () => {
    const user = auth.currentUser;
    if (!user || !selectedDelete?.id) return;

    try {
      await deleteTagihan(user.uid, selectedDelete.id);
      setDataTagihan((prev) => prev.filter((item) => item.id !== selectedDelete.id));
    } catch (error) {
      console.error("Gagal menghapus tagihan:", error);
    } finally {
      setShowConfirm(false);
      setSelectedDelete(null);
    }
  };

  const filteredTagihan = dataTagihan.filter((akun) => {
    if (!filterAkun) return true;
    if (filterAkun === "Lainnya") {
      return (
        akun.namaAkun === "Lainnya" &&
        (akun.customAkun ?? "")
          .toLowerCase()
          .includes(filterCustom.toLowerCase())
      );
    }
    return akun.namaAkun === filterAkun;
  });

  const getItemRemainingTotal = (item: TagihanItem) =>
    item.installments.length > 0
      ? item.installments.reduce(
          (sum, installment) =>
            sum + (installment.isPaid ? 0 : installment.nominal),
          0
        )
      : item.nominal;

  const getNominalSummary = (item: TagihanItem) => {
    if (item.installments.length === 0) {
      return `Rp ${item.nominal.toLocaleString("id-ID")}`;
    }

    const nominals = item.installments.map((installment) => installment.nominal);
    const minimum = Math.min(...nominals);
    const maximum = Math.max(...nominals);

    if (minimum === maximum) {
      return `Rp ${minimum.toLocaleString("id-ID")}`;
    }

    return `Rp ${minimum.toLocaleString("id-ID")} - Rp ${maximum.toLocaleString("id-ID")}`;
  };

  const handleDetailItemSaved = (updatedItem: TagihanItem) => {
    if (!selectedAkun?.id) return;

    setDataTagihan((prev) =>
      prev.map((akun) =>
        akun.id !== selectedAkun.id
          ? akun
          : {
              ...akun,
              items: akun.items.map((item) =>
                item.id === updatedItem.id ? updatedItem : item
              ),
            }
      )
    );

    setSelectedAkun((prev) =>
      prev
        ? {
            ...prev,
            items: prev.items.map((item) =>
              item.id === updatedItem.id ? updatedItem : item
            ),
          }
        : prev
    );
    setSelectedItem(updatedItem);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Daftar Tagihan
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Kelola akun tagihan dan detail cicilan Anda dengan lebih rapi.
        </p>
      </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <select
            className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
            value={filterAkun}
            onChange={(e) => {
              setFilterAkun(e.target.value);
              setFilterCustom("");
            }}
          >
            <option value="">Semua Akun</option>
            {Array.from(new Set(dataTagihan.map((d) => d.namaAkun))).map((akun) => (
              <option key={akun} value={akun}>
                {akun}
              </option>
            ))}
          </select>

          {filterAkun === "Lainnya" ? (
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cari Custom Akun"
                className="rounded-lg border border-gray-300 py-2 pl-10 pr-3 dark:border-gray-700 dark:bg-gray-900"
                value={filterCustom}
                onChange={(e) => setFilterCustom(e.target.value)}
              />
            </div>
          ) : null}

          <button
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            onClick={() => {
              const user = auth.currentUser;
              if (!user) return;
              loadDataTagihan(user.uid, user.email);
            }}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Data
          </button>
        </div>

        <button
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
          onClick={() => {
            setSelectedAkun(null);
            setOpenDialog(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tagihan
        </button>
      </div>

      {loading ? (
        isOnline ? (
          <LoadingTable />
        ) : (
          <p className="text-red-500 italic">Tidak ada koneksi internet.</p>
        )
      ) : filteredTagihan.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
          Belum ada data tagihan yang ditampilkan.
        </p>
      ) : (
        <div className="space-y-4">
          {filteredTagihan.map((akun) => {
            const totalNominal = akun.items.reduce(
              (sum, item) => sum + getItemRemainingTotal(item),
              0
            );
            const totalAkhir = totalNominal + (akun.biayaAdmin || 0);

            return (
              <div
                key={akun.id ?? akun.namaAkun}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/5"
              >
                <div className="mb-3 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {akun.namaAkun}
                      </h3>
                      {akun.namaAkun === "Lainnya" ? (
                        <span className="text-gray-500">({akun.customAkun})</span>
                      ) : null}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Pembukuan: Setiap Tanggal {akun.pembukuan} - Jatuh Tempo:
                      Setiap Tanggal {akun.jatuhTempo}
                    </p>
                    {akun.biayaAdmin ? (
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Biaya Admin: Rp {akun.biayaAdmin.toLocaleString("id-ID")}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="inline-flex items-center rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
                      onClick={() => {
                        setSelectedAkun(akun);
                        setOpenDialog(true);
                      }}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      onClick={() => {
                        setSelectedDelete(akun);
                        setShowConfirm(true);
                      }}
                    >
                      <Trash className="mr-1 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border text-sm dark:border-gray-800">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-white/5">
                        <th className="border px-2 py-1 text-left dark:border-gray-800">
                          Keterangan Tagihan
                        </th>
                        <th className="border px-2 py-1 text-center dark:border-gray-800">
                          Tenor
                        </th>
                        <th className="border px-2 py-1 text-center dark:border-gray-800">
                          Bulan Cicilan Pertama
                        </th>
                        <th className="border px-2 py-1 text-center dark:border-gray-800">
                          Bulan Cicilan Terakhir
                        </th>
                        <th className="border px-2 py-1 text-right dark:border-gray-800">
                          Nominal Cicilan
                        </th>
                        <th className="border px-2 py-1 text-center dark:border-gray-800">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {akun.items.map((item, index) => (
                        <tr key={index}>
                          <td className="border px-2 py-1 dark:border-gray-800">
                            {item.keterangan}
                          </td>
                          <td className="border px-2 py-1 text-center dark:border-gray-800">
                            {item.tenor} Bulan
                          </td>
                          <td className="border px-2 py-1 text-center dark:border-gray-800">
                            {formatDateLong(item.bulanCicilanPertama)}
                          </td>
                          <td className="border px-2 py-1 text-center dark:border-gray-800">
                            {formatDateLong(item.bulanCicilanTerakhir)}
                          </td>
                          <td className="border px-2 py-1 text-right dark:border-gray-800">
                            {getNominalSummary(item)}
                          </td>
                          <td className="border px-2 py-1 text-center dark:border-gray-800">
                            <button
                              onClick={() => {
                                setSelectedAkun(akun);
                                setSelectedItem(item);
                                setOpenDetailDialog(true);
                              }}
                              className="inline-flex rounded-lg bg-blue-100 p-2 text-blue-600 transition hover:bg-blue-200"
                              title="Lihat Detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
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
                          Rp {totalAkhir.toLocaleString("id-ID")}
                        </td>
                        <td className="border px-2 py-1 dark:border-gray-800" />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BaseModal
        open={openDialog}
        onClose={() => {
          setOpenDialog(false);
          setSelectedAkun(null);
        }}
        title={selectedAkun ? "Edit Akun Tagihan" : "Tambah Akun Tagihan"}
        maxWidthClassName="max-w-4xl"
      >
        <TagihanForm
          onSubmit={handleSubmitTagihan}
          isEditMode={Boolean(selectedAkun)}
          editData={selectedAkun ?? undefined}
          usedAkunList={usedAkunList}
        />
      </BaseModal>

      {selectedAkun && selectedItem ? (
        <TagihanDetailDialog
          open={openDetailDialog}
          onClose={() => setOpenDetailDialog(false)}
          akun={selectedAkun}
          item={selectedItem}
          onSaved={handleDetailItemSaved}
        />
      ) : null}

      <ConfirmModal
        show={showConfirm}
        message="Apakah Anda yakin ingin menghapus tagihan ini?"
        onClose={() => {
          setShowConfirm(false);
          setSelectedDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
}
