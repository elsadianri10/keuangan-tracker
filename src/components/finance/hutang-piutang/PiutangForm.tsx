"use client";

import { CalendarDays, Pencil, Plus, Save, Trash } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  akunDanaPribadiOptions,
  akunLimitPayLaterOptions,
  jenisPiutangOptions,
} from "@/constants/dropdownMenuItems";
import { auth } from "@/lib/firebase";
import { formatDate, formatRupiah, parseRupiah } from "@/lib/formatUniversal";
import { addPiutang, updatePiutang } from "@/services/hutangPiutangService";
import { DanaItems, LimitItems, Piutang } from "@/types/hutangPiutang";
import { ConfirmModal, WarningModal } from "../shared/ModalDialog";

interface PiutangFormProps {
  onSubmit: (data: Piutang) => void;
  isEditMode?: boolean;
  editData?: Piutang;
  usedDanaPribadiList: string[];
  usedLimitList: string[];
}

export default function PiutangForm({
  onSubmit,
  isEditMode = false,
  editData,
  usedDanaPribadiList,
  usedLimitList,
}: PiutangFormProps) {
  const tenorOptions = ["3", "6", "9", "12", "18", "24"];
  const tanggalPinjamRef = useRef<HTMLInputElement | null>(null);
  const tanggalPengembalianRef = useRef<HTMLInputElement | null>(null);
  const tglAwalTransaksiRef = useRef<HTMLInputElement | null>(null);
  const tglMulaiRef = useRef<HTMLInputElement | null>(null);
  const tglSelesaiRef = useRef<HTMLInputElement | null>(null);

  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [warningMessage, setWarningMessage] = useState("Tambah Item");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [namaDebitur, setNamaDebitur] = useState("");
  const [jenisPiutang, setJenisPiutang] = useState<"" | Piutang["jenisPiutang"]>(
    ""
  );

  const [asalDana, setAsalDana] = useState("");
  const [asalDanaCustom, setAsalDanaCustom] = useState("");
  const [asalLimit, setAsalLimit] = useState("");
  const [asalLimitCustom, setAsalLimitCustom] = useState("");
  const [pembukuan, setPembukuan] = useState(1);
  const [jatuhTempo, setJatuhTempo] = useState(1);

  const [newKeteranganPinjam, setNewKeteranganPinjam] = useState("");
  const [newTanggalPinjam, setNewTanggalPinjam] = useState<Date | null>(null);
  const [newTanggalPengembalian, setNewTanggalPengembalian] =
    useState<Date | null>(null);
  const [newNominalPinjam, setNewNominalPinjam] = useState(0);
  const [includeBunga, setIncludeBunga] = useState(false);
  const [newBungaPinjaman, setNewBungaPinjaman] = useState<number | null>(null);
  const [itemsDana, setItemsDana] = useState<DanaItems[]>([]);

  const [newKeteranganLimit, setNewKeteranganLimit] = useState("");
  const [newTglAwalTransaksi, setNewTglAwalTransaksi] = useState<Date | null>(
    null
  );
  const [newTenor, setNewTenor] = useState("");
  const [newTglMulai, setNewTglMulai] = useState<Date | null>(null);
  const [newTglSelesai, setNewTglSelesai] = useState<Date | null>(null);
  const [newNominalLimit, setNewNominalLimit] = useState(0);
  const [itemsLimit, setItemsLimit] = useState<LimitItems[]>([]);

  const formatDateInputValue = (value: Date | null) =>
    value ? value.toISOString().split("T")[0] : "";

  const openDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;

    const inputWithPicker = input as HTMLInputElement & {
      showPicker?: () => void;
    };

    inputWithPicker.showPicker?.();
    input.focus();
  };

  const resetDanaItemForm = useCallback(() => {
    setNewKeteranganPinjam("");
    setNewTanggalPinjam(null);
    setNewTanggalPengembalian(null);
    setNewNominalPinjam(0);
    setIncludeBunga(false);
    setNewBungaPinjaman(null);
  }, []);

  const resetLimitItemForm = useCallback(() => {
    setNewKeteranganLimit("");
    setNewTglAwalTransaksi(null);
    setNewTenor("");
    setNewTglMulai(null);
    setNewTglSelesai(null);
    setNewNominalLimit(0);
  }, []);

  const resetForm = useCallback(() => {
    setNamaDebitur("");
    setJenisPiutang("");
    setAsalDana("");
    setAsalDanaCustom("");
    setAsalLimit("");
    setAsalLimitCustom("");
    setPembukuan(1);
    setJatuhTempo(1);
    setItemsDana([]);
    setItemsLimit([]);
    setErrors({});
    resetDanaItemForm();
    resetLimitItemForm();
  }, [resetDanaItemForm, resetLimitItemForm]);

  useEffect(() => {
    if (isEditMode && editData) {
      setNamaDebitur(editData.namaDebitur);
      setJenisPiutang(editData.jenisPiutang);
      setAsalDana(editData.asalDana || "");
      setAsalDanaCustom(editData.customDana || "");
      setAsalLimit(editData.asalLimit || "");
      setAsalLimitCustom(editData.customLimit || "");
      setPembukuan(editData.pembukuan || 1);
      setJatuhTempo(editData.jatuhTempo || 1);
      setItemsDana(editData.itemsDana || []);
      setItemsLimit(editData.itemsLimit || []);
      setErrors({});
      setShowWarning(false);
      setShowConfirm(false);
    } else {
      resetForm();
    }
  }, [editData, isEditMode, resetForm]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!namaDebitur.trim()) newErrors.namaDebitur = "Nama debitur harus diisi";
    if (!jenisPiutang) newErrors.jenisPiutang = "Jenis piutang harus dipilih";

    if (jenisPiutang === "Dana Pribadi") {
      if (!asalDana) newErrors.asalDana = "Platform dana harus dipilih";
      if (asalDana === "Lainnya" && !asalDanaCustom.trim()) {
        newErrors.asalDanaCustom = "Platform dana lainnya harus diisi";
      }
    }

    if (jenisPiutang === "Limit Pay Later") {
      if (!asalLimit) newErrors.asalLimit = "Platform pay later harus dipilih";
      if (asalLimit === "Lainnya" && !asalLimitCustom.trim()) {
        newErrors.asalLimitCustom = "Platform pay later lainnya harus diisi";
      }
      if (pembukuan < 1) newErrors.pembukuan = "Tanggal pembukuan harus diisi";
      if (jatuhTempo < 1) newErrors.jatuhTempo = "Tanggal jatuh tempo harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFormItemDana = () => {
    const newErrors: Record<string, string> = {};

    if (!newKeteranganPinjam.trim()) {
      newErrors.newKeteranganPinjam = "Keterangan harus diisi";
    }
    if (!newTanggalPinjam) newErrors.newTanggalPinjam = "Tanggal pinjam harus diisi";
    if (!newTanggalPengembalian) {
      newErrors.newTanggalPengembalian = "Tanggal pengembalian harus diisi";
    }
    if (!newNominalPinjam) newErrors.newNominalPinjam = "Nominal harus diisi";
    if (includeBunga && !newBungaPinjaman) {
      newErrors.newBungaPinjaman = "Bunga pinjaman harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFormItemLimit = () => {
    const newErrors: Record<string, string> = {};

    if (!newKeteranganLimit.trim()) {
      newErrors.newKeteranganLimit = "Keterangan harus diisi";
    }
    if (!newTglAwalTransaksi) {
      newErrors.newTglAwalTransaksi = "Tanggal awal transaksi harus diisi";
    }
    if (!newTenor) newErrors.newTenor = "Tenor harus diisi";
    if (!newTglMulai) newErrors.newTglMulai = "Tanggal mulai harus diisi";
    if (!newTglSelesai) newErrors.newTglSelesai = "Tanggal selesai harus diisi";
    if (!newNominalLimit) newErrors.newNominalLimit = "Nominal harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItemDana = () => {
    if (!validateFormItemDana()) return;

    const newItemDana: DanaItems = {
      keteranganPinjam: newKeteranganPinjam,
      tglPinjam: newTanggalPinjam!,
      tglKembali: newTanggalPengembalian!,
      nominalPinjam: newNominalPinjam,
      ...(includeBunga && newBungaPinjaman
        ? { bungaPinjam: newBungaPinjaman }
        : {}),
    };

    setItemsDana((prev) => [...prev, newItemDana]);
    setErrors({});
    resetDanaItemForm();
  };

  const handleAddItemLimit = () => {
    if (!validateFormItemLimit()) return;

    const newItemLimit: LimitItems = {
      keteranganLimit: newKeteranganLimit,
      tanggalAwal: newTglAwalTransaksi!,
      tenor: newTenor,
      tanggalMulai: newTglMulai!,
      tanggalSelesai: newTglSelesai!,
      nominalLimit: newNominalLimit,
    };

    setItemsLimit((prev) => [...prev, newItemLimit]);
    setErrors({});
    resetLimitItemForm();
  };

  const handleEditItemDana = (index: number) => {
    const item = itemsDana[index];
    setNewKeteranganPinjam(item.keteranganPinjam);
    setNewTanggalPinjam(item.tglPinjam);
    setNewTanggalPengembalian(item.tglKembali);
    setNewNominalPinjam(item.nominalPinjam);
    setIncludeBunga(Boolean(item.bungaPinjam));
    setNewBungaPinjaman(item.bungaPinjam ?? null);
    setItemsDana((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleEditItemLimit = (index: number) => {
    const item = itemsLimit[index];
    setNewKeteranganLimit(item.keteranganLimit);
    setNewTglAwalTransaksi(item.tanggalAwal);
    setNewTenor(item.tenor);
    setNewTglMulai(item.tanggalMulai);
    setNewTglSelesai(item.tanggalSelesai);
    setNewNominalLimit(item.nominalLimit);
    setItemsLimit((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleDeleteItemDana = (index: number) => {
    setItemsDana((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleDeleteItemLimit = (index: number) => {
    setItemsLimit((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (jenisPiutang === "Dana Pribadi" && itemsDana.length === 0) {
      setWarningMessage("Tambah Item Dana");
      setShowWarning(true);
      return;
    }

    if (jenisPiutang === "Limit Pay Later" && itemsLimit.length === 0) {
      setWarningMessage("Tambah Item Limit");
      setShowWarning(true);
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!jenisPiutang) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const piutangData: Omit<Piutang, "id"> = {
        namaDebitur: namaDebitur.trim(),
        jenisPiutang,
        asalDana: jenisPiutang === "Dana Pribadi" ? asalDana : "",
        customDana:
          jenisPiutang === "Dana Pribadi" && asalDana === "Lainnya"
            ? asalDanaCustom.trim()
            : "",
        asalLimit: jenisPiutang === "Limit Pay Later" ? asalLimit : "",
        customLimit:
          jenisPiutang === "Limit Pay Later" && asalLimit === "Lainnya"
            ? asalLimitCustom.trim()
            : "",
        pembukuan: jenisPiutang === "Limit Pay Later" ? pembukuan : 0,
        jatuhTempo: jenisPiutang === "Limit Pay Later" ? jatuhTempo : 0,
        createdAt: editData?.createdAt ?? new Date(),
        itemsDana: jenisPiutang === "Dana Pribadi" ? itemsDana : [],
        itemsLimit: jenisPiutang === "Limit Pay Later" ? itemsLimit : [],
      };

      if (isEditMode && editData?.id) {
        await updatePiutang(user.uid, jenisPiutang, editData.id, piutangData);
        onSubmit({ ...piutangData, id: editData.id });
      } else {
        const newId = await addPiutang(user.uid, jenisPiutang, piutangData);
        onSubmit({ ...piutangData, id: newId });
        resetForm();
      }
    } catch (error) {
      console.error("Gagal submit Piutang:", error);
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nama Debitur</label>
        <input
          type="text"
          placeholder="Siapa yang pinjam?"
          value={namaDebitur}
          onChange={(e) => setNamaDebitur(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 ${
            errors.namaDebitur ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.namaDebitur ? (
          <p className="mt-1 text-sm text-red-500">{errors.namaDebitur}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Jenis Piutang</label>
        <select
          value={jenisPiutang}
          onChange={(e) =>
            setJenisPiutang(e.target.value as "" | Piutang["jenisPiutang"])
          }
          disabled={isEditMode}
          className={`w-full rounded-lg border px-3 py-2 ${
            errors.jenisPiutang ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">-- Pilih Jenis Piutang --</option>
          {jenisPiutangOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {errors.jenisPiutang ? (
          <p className="mt-1 text-sm text-red-500">{errors.jenisPiutang}</p>
        ) : null}
      </div>

      {jenisPiutang === "Dana Pribadi" ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">Platform Dana</label>
            <select
              value={asalDana}
              onChange={(e) => {
                setAsalDana(e.target.value);
                if (e.target.value !== "Lainnya") setAsalDanaCustom("");
              }}
              disabled={isEditMode}
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.asalDana ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Pilih Platform --</option>
              {akunDanaPribadiOptions
                .filter(
                  (akun) =>
                    isEditMode ||
                    akun === "Lainnya" ||
                    !usedDanaPribadiList.includes(akun)
                )
                .map((akun) => (
                  <option key={akun} value={akun}>
                    {akun}
                  </option>
                ))}
            </select>
            {errors.asalDana ? (
              <p className="mt-1 text-sm text-red-500">{errors.asalDana}</p>
            ) : null}

            {asalDana === "Lainnya" ? (
              <div className="mt-2">
                <label className="mb-1 block text-sm font-medium">
                  Platform Dana (Lainnya)
                </label>
                <input
                  type="text"
                  placeholder="Isi platform dana lainnya"
                  value={asalDanaCustom}
                  onChange={(e) => setAsalDanaCustom(e.target.value)}
                  disabled={isEditMode}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    errors.asalDanaCustom ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.asalDanaCustom ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.asalDanaCustom}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <h4 className="mb-2 font-semibold">Tambah Item Dana</h4>
            <label className="block text-sm font-medium">
              Keterangan Peminjaman
            </label>
            <input
              type="text"
              placeholder="Dipinjam untuk apa?"
              value={newKeteranganPinjam}
              onChange={(e) => setNewKeteranganPinjam(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.newKeteranganPinjam ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.newKeteranganPinjam ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.newKeteranganPinjam}
              </p>
            ) : null}

            <div className="mt-2 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium">Tanggal Pinjam</label>
                <div className="relative">
                  <input
                    ref={tanggalPinjamRef}
                    type="date"
                    value={formatDateInputValue(newTanggalPinjam)}
                    onChange={(e) => setNewTanggalPinjam(new Date(e.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                      errors.newTanggalPinjam ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(tanggalPinjamRef.current)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                    aria-label="Pilih tanggal pinjam piutang"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
                {errors.newTanggalPinjam ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.newTanggalPinjam}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Tanggal Pengembalian
                </label>
                <div className="relative">
                  <input
                    ref={tanggalPengembalianRef}
                    type="date"
                    value={formatDateInputValue(newTanggalPengembalian)}
                    onChange={(e) =>
                      setNewTanggalPengembalian(new Date(e.target.value))
                    }
                    className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                      errors.newTanggalPengembalian
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(tanggalPengembalianRef.current)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                    aria-label="Pilih tanggal pengembalian piutang"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
                {errors.newTanggalPengembalian ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.newTanggalPengembalian}
                  </p>
                ) : null}
              </div>
            </div>

            <label className="mt-2 block text-sm font-medium">Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-gray-500">
                Rp
              </span>
              <input
                type="text"
                placeholder="Berapa yang dipinjam?"
                value={newNominalPinjam ? formatRupiah(newNominalPinjam) : ""}
                onChange={(e) => setNewNominalPinjam(parseRupiah(e.target.value))}
                className={`w-full rounded-lg border py-2 pl-9 pr-3 ${
                  errors.newNominalPinjam ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.newNominalPinjam ? (
              <p className="mt-1 text-sm text-red-500">{errors.newNominalPinjam}</p>
            ) : null}

            <div className="mt-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={includeBunga}
                  onChange={(e) => setIncludeBunga(e.target.checked)}
                />
                Tambah Bunga Pinjaman?
              </label>
              {includeBunga ? (
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Mau kasih berapa (%) bunganya?"
                    value={newBungaPinjaman ? formatRupiah(newBungaPinjaman) : ""}
                    onChange={(e) =>
                      setNewBungaPinjaman(parseRupiah(e.target.value))
                    }
                    className={`w-full rounded-lg border px-3 py-2 pr-10 ${
                      errors.newBungaPinjaman ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                    %
                  </span>
                  {errors.newBungaPinjaman ? (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.newBungaPinjaman}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              onClick={handleAddItemDana}
              className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Item Dana
            </button>
          </div>

          {itemsDana.length > 0 ? (
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Daftar Item Dana</h4>
              <ul className="space-y-2">
                {itemsDana.map((item, index) => (
                  <li
                    key={index}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="col-span-2 font-medium">
                          {item.keteranganPinjam}
                        </div>
                        <div className="text-xs text-gray-500">
                          Nominal Peminjaman
                        </div>
                        <div className="text-xs text-gray-500">
                          : Rp {item.nominalPinjam.toLocaleString()}
                        </div>
                        {item.bungaPinjam ? (
                          <>
                            <div className="text-xs text-gray-500">Bunga</div>
                            <div className="text-xs text-gray-500">
                              : {item.bungaPinjam}%
                            </div>
                          </>
                        ) : null}
                        <div className="text-xs text-gray-500">Rentang Tanggal</div>
                        <div className="text-xs text-gray-500">
                          : {formatDate(item.tglPinjam)} - {formatDate(item.tglKembali)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItemDana(index)}
                          className="inline-flex items-center rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-yellow-600"
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItemDana(index)}
                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                        >
                          <Trash className="mr-1 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      {jenisPiutang === "Limit Pay Later" ? (
        <>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Platform Pay Later
            </label>
            <select
              value={asalLimit}
              onChange={(e) => {
                setAsalLimit(e.target.value);
                if (e.target.value !== "Lainnya") setAsalLimitCustom("");
              }}
              disabled={isEditMode}
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.asalLimit ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Pilih Platform --</option>
              {akunLimitPayLaterOptions
                .filter(
                  (akun) =>
                    isEditMode || akun === "Lainnya" || !usedLimitList.includes(akun)
                )
                .map((akun) => (
                  <option key={akun} value={akun}>
                    {akun}
                  </option>
                ))}
            </select>
            {errors.asalLimit ? (
              <p className="mt-1 text-sm text-red-500">{errors.asalLimit}</p>
            ) : null}

            {asalLimit === "Lainnya" ? (
              <div className="mt-2">
                <label className="mb-1 block text-sm font-medium">
                  Platform Pay Later (Lainnya)
                </label>
                <input
                  type="text"
                  placeholder="Isi platform pay later lainnya"
                  value={asalLimitCustom}
                  onChange={(e) => setAsalLimitCustom(e.target.value)}
                  disabled={isEditMode}
                  className={`w-full rounded-lg border px-3 py-2 ${
                    errors.asalLimitCustom ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.asalLimitCustom ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.asalLimitCustom}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">
                Pembukuan (Tanggal)
              </label>
              <input
                type="number"
                value={pembukuan}
                onChange={(e) => setPembukuan(+e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  errors.pembukuan ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.pembukuan ? (
                <p className="mt-1 text-sm text-red-500">{errors.pembukuan}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-sm font-medium">
                Jatuh Tempo (Tanggal)
              </label>
              <input
                type="number"
                value={jatuhTempo}
                onChange={(e) => setJatuhTempo(+e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 ${
                  errors.jatuhTempo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.jatuhTempo ? (
                <p className="mt-1 text-sm text-red-500">{errors.jatuhTempo}</p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
            <h4 className="mb-2 font-semibold">Tambah Item Limit</h4>
            <label className="block text-sm font-medium">
              Keterangan Peminjaman
            </label>
            <input
              type="text"
              placeholder="Dipinjam untuk apa?"
              value={newKeteranganLimit}
              onChange={(e) => setNewKeteranganLimit(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.newKeteranganLimit ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.newKeteranganLimit ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.newKeteranganLimit}
              </p>
            ) : null}

            <div className="mt-2">
              <label className="block text-sm font-medium">
                Tanggal Awal Transaksi
              </label>
              <div className="relative">
                <input
                  ref={tglAwalTransaksiRef}
                  type="date"
                  value={formatDateInputValue(newTglAwalTransaksi)}
                  onChange={(e) => setNewTglAwalTransaksi(new Date(e.target.value))}
                  className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                    errors.newTglAwalTransaksi ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => openDatePicker(tglAwalTransaksiRef.current)}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                  aria-label="Pilih tanggal awal transaksi"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
              {errors.newTglAwalTransaksi ? (
                <p className="mt-1 text-sm text-red-500">
                  {errors.newTglAwalTransaksi}
                </p>
              ) : null}
            </div>

            <label className="mt-2 block text-sm font-medium">Tenor</label>
            <select
              value={newTenor}
              onChange={(e) => setNewTenor(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.newTenor ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">-- Pilih Tenor --</option>
              {tenorOptions.map((option) => (
                <option key={option} value={option}>
                  {option} Bulan
                </option>
              ))}
            </select>
            {errors.newTenor ? (
              <p className="mt-1 text-sm text-red-500">{errors.newTenor}</p>
            ) : null}

            <label className="mt-2 block text-sm font-medium">
              Rentang Tanggal Tagihan Berakhir
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="relative">
                  <input
                    ref={tglMulaiRef}
                    type="date"
                    value={formatDateInputValue(newTglMulai)}
                    onChange={(e) => setNewTglMulai(new Date(e.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                      errors.newTglMulai ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(tglMulaiRef.current)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                    aria-label="Pilih tanggal mulai tagihan"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
                {errors.newTglMulai ? (
                  <p className="mt-1 text-sm text-red-500">{errors.newTglMulai}</p>
                ) : null}
              </div>

              <div>
                <div className="relative">
                  <input
                    ref={tglSelesaiRef}
                    type="date"
                    value={formatDateInputValue(newTglSelesai)}
                    onChange={(e) => setNewTglSelesai(new Date(e.target.value))}
                    className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                      errors.newTglSelesai ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => openDatePicker(tglSelesaiRef.current)}
                    className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                    aria-label="Pilih tanggal selesai tagihan"
                  >
                    <CalendarDays className="h-4 w-4" />
                  </button>
                </div>
                {errors.newTglSelesai ? (
                  <p className="mt-1 text-sm text-red-500">
                    {errors.newTglSelesai}
                  </p>
                ) : null}
              </div>
            </div>

            <label className="mt-2 block text-sm font-medium">Nominal</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm text-gray-500">
                Rp
              </span>
              <input
                type="text"
                placeholder="Berapa yang dipinjam?"
                value={newNominalLimit ? formatRupiah(newNominalLimit) : ""}
                onChange={(e) => setNewNominalLimit(parseRupiah(e.target.value))}
                className={`w-full rounded-lg border py-2 pl-9 pr-3 ${
                  errors.newNominalLimit ? "border-red-500" : "border-gray-300"
                }`}
              />
            </div>
            {errors.newNominalLimit ? (
              <p className="mt-1 text-sm text-red-500">{errors.newNominalLimit}</p>
            ) : null}

            <button
              onClick={handleAddItemLimit}
              className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <Plus className="mr-1 h-4 w-4" />
              Tambah Item Limit
            </button>
          </div>

          {itemsLimit.length > 0 ? (
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Daftar Item Limit</h4>
              <ul className="space-y-2">
                {itemsLimit.map((item, index) => (
                  <li
                    key={index}
                    className="rounded-2xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <div className="col-span-2 font-medium">
                          {item.keteranganLimit}
                        </div>
                        <div className="text-xs text-gray-500">Nominal Cicilan</div>
                        <div className="text-xs text-gray-500">
                          : Rp {item.nominalLimit.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tanggal Awal Transaksi
                        </div>
                        <div className="text-xs text-gray-500">
                          : {formatDate(item.tanggalAwal)}
                        </div>
                        <div className="text-xs text-gray-500">Tenor</div>
                        <div className="text-xs text-gray-500">
                          : {item.tenor} bulan
                        </div>
                        <div className="text-xs text-gray-500">Rentang Tanggal</div>
                        <div className="text-xs text-gray-500">
                          : {formatDate(item.tanggalMulai)} -{" "}
                          {formatDate(item.tanggalSelesai)}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditItemLimit(index)}
                          className="inline-flex items-center rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-yellow-600"
                        >
                          <Pencil className="mr-1 h-4 w-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteItemLimit(index)}
                          className="inline-flex items-center rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-red-700"
                        >
                          <Trash className="mr-1 h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="pt-2">
        <button
          onClick={handleSubmit}
          className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
        </button>
      </div>

      <WarningModal
        show={showWarning}
        message={warningMessage}
        subMessage="Minimal 1 (satu)"
        onClose={() => setShowWarning(false)}
      />

      <ConfirmModal
        show={showConfirm}
        message="Apakah Anda yakin ingin menyimpan data ini?"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
