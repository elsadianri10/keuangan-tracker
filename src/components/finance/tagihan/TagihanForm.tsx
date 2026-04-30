"use client";

import { CalendarDays, Pencil, Plus, Save, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { akunOptions } from "@/constants/dropdownMenuItems";
import { auth } from "@/lib/firebase";
import {
  formatDate,
  formatRupiah,
  parseRupiah,
} from "@/lib/formatUniversal";
import { addTagihan, updateTagihan } from "@/services/tagihanService";
import { TagihanAkun, TagihanItem } from "@/types/tagihan";
import { ConfirmModal, WarningModal } from "../shared/ModalDialog";

interface TagihanFormProps {
  onSubmit: (data: TagihanAkun) => void;
  isEditMode?: boolean;
  editData?: TagihanAkun;
  usedAkunList: string[];
}

export default function TagihanForm({
  onSubmit,
  isEditMode = false,
  editData,
  usedAkunList,
}: TagihanFormProps) {
  const tenorOptions = ["3", "6", "9", "12", "18", "24"];
  const bulanPertamaRef = useRef<HTMLInputElement | null>(null);
  const bulanTerakhirRef = useRef<HTMLInputElement | null>(null);

  const [namaAkun, setNamaAkun] = useState("");
  const [customAkun, setCustomAkun] = useState("");
  const [pembukuan, setPembukuan] = useState(1);
  const [jatuhTempo, setJatuhTempo] = useState(1);
  const [biayaAdmin, setBiayaAdmin] = useState<number | null>(null);
  const [includeAdmin, setIncludeAdmin] = useState(false);
  const [items, setItems] = useState<TagihanItem[]>([]);

  const [newKeterangan, setNewKeterangan] = useState("");
  const [newNominal, setNewNominal] = useState(0);
  const [newTenor, setNewTenor] = useState("");
  const [newBulanPertama, setNewBulanPertama] = useState<Date | null>(null);
  const [newBulanTerakhir, setNewBulanTerakhir] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  useEffect(() => {
    if (isEditMode && editData) {
      setNamaAkun(editData.namaAkun);
      setPembukuan(editData.pembukuan);
      setJatuhTempo(editData.jatuhTempo);
      setBiayaAdmin(editData.biayaAdmin || null);
      setIncludeAdmin(Boolean(editData.biayaAdmin));
      setCustomAkun(editData.customAkun || "");
      setItems(editData.items);
    }
  }, [editData, isEditMode]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [errors]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!namaAkun) newErrors.namaAkun = "Nama akun harus dipilih";
    if (namaAkun === "Lainnya" && !customAkun) {
      newErrors.customAkun = "Nama akun lainnya harus diisi";
    }
    if (!pembukuan) newErrors.pembukuan = "Tanggal pembukuan harus diisi";
    if (!jatuhTempo) newErrors.jatuhTempo = "Tanggal jatuh tempo harus diisi";
    if (includeAdmin && !biayaAdmin) {
      newErrors.biayaAdmin = "Biaya admin harus diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFormItem = () => {
    const newErrors: Record<string, string> = {};

    if (!newKeterangan) newErrors.newKeterangan = "Keterangan harus diisi";
    if (!newTenor) newErrors.newTenor = "Tenor harus diisi";
    if (!newBulanPertama) {
      newErrors.newBulanPertama = "Bulan pertama harus dipilih";
    }
    if (!newBulanTerakhir) {
      newErrors.newBulanTerakhir = "Bulan terakhir harus dipilih";
    }
    if (!newNominal) newErrors.newNominal = "Nominal harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItem = () => {
    if (!validateFormItem()) return;

    const newItem: TagihanItem = {
      keterangan: newKeterangan,
      nominal: newNominal,
      tenor: newTenor,
      bulanCicilanPertama: newBulanPertama!,
      bulanCicilanTerakhir: newBulanTerakhir!,
      installments: [],
    };

    setItems((prev) => [...prev, newItem]);
    setNewKeterangan("");
    setNewTenor("");
    setNewBulanPertama(null);
    setNewBulanTerakhir(null);
    setNewNominal(0);
    setErrors({});
  };

  const handleEditItem = (index: number) => {
    const item = items[index];
    setNewKeterangan(item.keterangan);
    setNewNominal(item.nominal);
    setNewTenor(item.tenor);
    setNewBulanPertama(item.bulanCicilanPertama);
    setNewBulanTerakhir(item.bulanCicilanTerakhir);
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    if (!namaAkun) return;
    if (namaAkun === "Lainnya" && !customAkun.trim()) return;
    if (pembukuan < 1 || jatuhTempo < 1) return;
    if (items.length === 0) {
      setShowWarning(true);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (includeAdmin && (typeof biayaAdmin !== "number" || biayaAdmin <= 0)) {
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) return;

      const biayaAdminValue =
        includeAdmin && typeof biayaAdmin === "number" ? biayaAdmin : undefined;

      const tagihanAkunData: Omit<TagihanAkun, "id" | "items"> = {
        namaAkun,
        customAkun: namaAkun === "Lainnya" ? customAkun : "",
        pembukuan,
        jatuhTempo,
        ...(biayaAdminValue !== undefined ? { biayaAdmin: biayaAdminValue } : {}),
        createdAt: new Date(),
      };

      if (isEditMode && editData) {
        if (!editData.id) return;

        const updateData: Partial<Omit<TagihanAkun, "id" | "items">> = {
          namaAkun: editData.namaAkun,
          customAkun: editData.customAkun || "",
          pembukuan,
          jatuhTempo,
          biayaAdmin: includeAdmin ? biayaAdmin ?? undefined : undefined,
        };

        await updateTagihan(user.uid, editData.id, updateData, items, user.email);
        onSubmit({ ...editData, ...updateData, items });
      } else {
        await addTagihan(user.uid, tagihanAkunData, items, user.email);
        onSubmit({ ...tagihanAkunData, items });
        resetForm();
      }
    } catch (error) {
      console.error("Gagal menyimpan tagihan:", error);
    } finally {
      setShowConfirm(false);
    }
  };

  const resetForm = () => {
    setNamaAkun("");
    setCustomAkun("");
    setPembukuan(1);
    setJatuhTempo(1);
    setIncludeAdmin(false);
    setBiayaAdmin(null);
    setItems([]);
    setNewKeterangan("");
    setNewTenor("");
    setNewBulanPertama(null);
    setNewBulanTerakhir(null);
    setNewNominal(0);
    setErrors({});
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Nama Akun</label>
        <select
          value={namaAkun}
          onChange={(e) => {
            setNamaAkun(e.target.value);
            if (e.target.value !== "Lainnya") {
              setCustomAkun("");
            }
          }}
          disabled={isEditMode}
          className={`w-full rounded-lg border px-3 py-2 ${
            errors.namaAkun ? "border-red-500" : "border-gray-300"
          }`}
        >
          <option value="">-- Pilih Akun --</option>
          {akunOptions
            .filter(
              (akun) =>
                isEditMode || akun === "Lainnya" || !usedAkunList.includes(akun)
            )
            .map((akun) => (
              <option key={akun} value={akun}>
                {akun}
              </option>
            ))}
        </select>
        {errors.namaAkun ? (
          <p className="mt-1 text-sm text-red-500">{errors.namaAkun}</p>
        ) : null}

        {namaAkun === "Lainnya" ? (
          <div className="mt-2">
            <label className="mb-1 block text-sm font-medium">
              Nama Akun (Lainnya)
            </label>
            <input
              type="text"
              placeholder="Isi nama akun lainnya"
              value={customAkun}
              onChange={(e) => setCustomAkun(e.target.value)}
              disabled={isEditMode}
              className={`w-full rounded-lg border px-3 py-2 ${
                errors.customAkun ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.customAkun ? (
              <p className="mt-1 text-sm text-red-500">{errors.customAkun}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Pembukuan (Tanggal)</label>
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
          <label className="block text-sm font-medium">Jatuh Tempo (Tanggal)</label>
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

      <div>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={includeAdmin}
            onChange={(e) => setIncludeAdmin(e.target.checked)}
          />
          Tambahan Biaya Admin?
        </label>
        {includeAdmin ? (
          <div className="relative mt-2">
            <span className="absolute left-3 top-2.5 text-sm text-gray-500">Rp</span>
            <input
              type="text"
              placeholder="Biaya Admin"
              value={biayaAdmin ? formatRupiah(biayaAdmin) : ""}
              onChange={(e) => setBiayaAdmin(parseRupiah(e.target.value))}
              className={`w-full rounded-lg border py-2 pl-9 pr-3 ${
                errors.biayaAdmin ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.biayaAdmin ? (
              <p className="mt-1 text-sm text-red-500">{errors.biayaAdmin}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="border-t border-gray-200 pt-4 dark:border-gray-800">
        <h4 className="mb-2 font-semibold">Tambah Item Tagihan</h4>

        <label className="block text-sm font-medium">Keterangan Tagihan</label>
        <input
          type="text"
          placeholder="Keterangan Tagihan"
          value={newKeterangan}
          onChange={(e) => setNewKeterangan(e.target.value)}
          className={`mb-2 w-full rounded-lg border px-3 py-2 ${
            errors.newKeterangan ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.newKeterangan ? (
          <p className="mb-2 text-sm text-red-500">{errors.newKeterangan}</p>
        ) : null}

        <label className="block text-sm font-medium">Tenor</label>
        <select
          value={newTenor}
          onChange={(e) => setNewTenor(e.target.value)}
          className={`mb-2 w-full rounded-lg border px-3 py-2 ${
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

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">
              Bulan Cicilan Pertama
            </label>
            <div className="relative">
              <input
                ref={bulanPertamaRef}
                type="date"
                value={formatDateInputValue(newBulanPertama)}
                onChange={(e) => setNewBulanPertama(new Date(e.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                  errors.newBulanPertama ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => openDatePicker(bulanPertamaRef.current)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                aria-label="Pilih bulan cicilan pertama"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            {errors.newBulanPertama ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.newBulanPertama}
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-sm font-medium">
              Bulan Cicilan Terakhir
            </label>
            <div className="relative">
              <input
                ref={bulanTerakhirRef}
                type="date"
                value={formatDateInputValue(newBulanTerakhir)}
                onChange={(e) => setNewBulanTerakhir(new Date(e.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                  errors.newBulanTerakhir ? "border-red-500" : "border-gray-300"
                }`}
              />
              <button
                type="button"
                onClick={() => openDatePicker(bulanTerakhirRef.current)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
                aria-label="Pilih bulan cicilan terakhir"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
            {errors.newBulanTerakhir ? (
              <p className="mt-1 text-sm text-red-500">
                {errors.newBulanTerakhir}
              </p>
            ) : null}
          </div>
        </div>

        <label className="mt-2 block text-sm font-medium">Nominal Cicilan</label>
        <div className="relative mb-2">
          <span className="absolute left-3 top-2.5 text-sm text-gray-500">Rp</span>
          <input
            type="text"
            placeholder="Nominal"
            value={newNominal ? formatRupiah(newNominal) : ""}
            onChange={(e) => setNewNominal(parseRupiah(e.target.value))}
            className={`w-full rounded-lg border py-2 pl-9 pr-3 ${
              errors.newNominal ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.newNominal ? (
            <p className="mt-1 text-sm text-red-500">{errors.newNominal}</p>
          ) : null}
        </div>

        <button
          onClick={handleAddItem}
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          <Plus className="mr-1 h-4 w-4" />
          Tambah Item Tagihan
        </button>
      </div>

      {items.length > 0 ? (
        <div className="mt-4">
          <h4 className="mb-2 font-semibold">Daftar Item Tagihan</h4>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={index}
                className="rounded-2xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-800"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="col-span-2 font-medium">{item.keterangan}</div>
                    <div className="text-xs text-gray-500">Nominal Cicilan</div>
                    <div className="text-xs text-gray-500">
                      : Rp {item.nominal.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Tenor</div>
                    <div className="text-xs text-gray-500">: {item.tenor} bulan</div>
                    <div className="text-xs text-gray-500">Rentang Tanggal</div>
                    <div className="text-xs text-gray-500">
                      : {formatDate(item.bulanCicilanPertama)} -{" "}
                      {formatDate(item.bulanCicilanTerakhir)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditItem(index)}
                      className="inline-flex items-center rounded-lg bg-yellow-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-yellow-600"
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(index)}
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

      <div className="pt-4">
        <button
          onClick={handleSubmit}
          className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Simpan Perubahan Tagihan" : "Simpan Tagihan"}
        </button>
      </div>

      <WarningModal
        show={showWarning}
        message="Tambah Item Tagihan"
        subMessage="Minimal 1 (satu)"
        onClose={() => setShowWarning(false)}
      />

      <ConfirmModal
        show={showConfirm}
        message="Apakah Anda yakin ingin menyimpan tagihan ini?"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
