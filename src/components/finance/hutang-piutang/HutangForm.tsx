"use client";

import { CalendarDays, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { formatRupiah, parseRupiah } from "@/lib/formatUniversal";
import { addHutang, updateHutang } from "@/services/hutangPiutangService";
import { Hutang } from "@/types/hutangPiutang";
import { ConfirmModal } from "../shared/ModalDialog";

interface HutangFormProps {
  onSubmit: (data: Hutang) => void;
  isEditMode?: boolean;
  editData?: Hutang;
}

export default function HutangForm({
  onSubmit,
  isEditMode = false,
  editData,
}: HutangFormProps) {
  const tanggalPinjamRef = useRef<HTMLInputElement | null>(null);
  const tanggalPengembalianRef = useRef<HTMLInputElement | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [namaKreditur, setNamaKreditur] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggalPinjam, setTanggalPinjam] = useState<Date | null>(null);
  const [tanggalPengembalian, setTanggalPengembalian] = useState<Date | null>(
    null
  );
  const [nominal, setNominal] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      setNamaKreditur(editData.namaKreditur);
      setKeterangan(editData.keteranganPinjam);
      setTanggalPinjam(editData.tglPinjam);
      setTanggalPengembalian(editData.tglKembali);
      setNominal(editData.nominalPinjam);
    }
  }, [editData, isEditMode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!namaKreditur) newErrors.namaKreditur = "Nama Kreditur harus diisi";
    if (!keterangan) newErrors.keterangan = "Keterangan harus diisi";
    if (!tanggalPinjam) newErrors.tanggalPinjam = "Tanggal Pinjam harus diisi";
    if (!tanggalPengembalian) {
      newErrors.tanggalPengembalian = "Tanggal Pengembalian harus diisi";
    }
    if (!nominal) newErrors.nominal = "Nominal harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    if (!validateForm()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const hutangData: Omit<Hutang, "id"> = {
        namaKreditur,
        keteranganPinjam: keterangan,
        tglPinjam: tanggalPinjam!,
        tglKembali: tanggalPengembalian!,
        nominalPinjam: nominal,
        createdAt: editData?.createdAt ?? new Date(),
      };

      if (isEditMode && editData?.id) {
        await updateHutang(user.uid, editData.id, hutangData);
        onSubmit({ ...hutangData, id: editData.id });
      } else {
        const newId = await addHutang(user.uid, hutangData);
        onSubmit({ ...hutangData, id: newId });
        resetForm();
      }
    } catch (error) {
      console.error("Gagal menyimpan data hutang:", error);
    } finally {
      setShowConfirm(false);
    }
  };

  const resetForm = () => {
    setNamaKreditur("");
    setKeterangan("");
    setTanggalPinjam(null);
    setTanggalPengembalian(null);
    setNominal(0);
    setErrors({});
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Nama Kreditur</label>
        <input
          type="text"
          placeholder="Kamu pinjam ke siapa?"
          value={namaKreditur}
          onChange={(e) => setNamaKreditur(e.target.value)}
          disabled={isEditMode}
          className={`w-full rounded-lg border px-3 py-2 ${
            errors.namaKreditur ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.namaKreditur ? (
          <p className="mt-1 text-sm text-red-500">{errors.namaKreditur}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-medium">Keterangan Peminjaman</label>
        <input
          type="text"
          placeholder="Kamu mau pakai buat apa?"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 ${
            errors.keterangan ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.keterangan ? (
          <p className="mt-1 text-sm text-red-500">{errors.keterangan}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium">Tanggal Pinjam</label>
          <div className="relative">
            <input
              ref={tanggalPinjamRef}
              type="date"
              value={formatDateInputValue(tanggalPinjam)}
              onChange={(e) => setTanggalPinjam(new Date(e.target.value))}
              className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                errors.tanggalPinjam ? "border-red-500" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => openDatePicker(tanggalPinjamRef.current)}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
              aria-label="Pilih tanggal pinjam"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          {errors.tanggalPinjam ? (
            <p className="mt-1 text-sm text-red-500">{errors.tanggalPinjam}</p>
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
              value={formatDateInputValue(tanggalPengembalian)}
              onChange={(e) => setTanggalPengembalian(new Date(e.target.value))}
              className={`w-full rounded-lg border px-3 py-2 pr-11 ${
                errors.tanggalPengembalian ? "border-red-500" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => openDatePicker(tanggalPengembalianRef.current)}
              className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-gray-500 transition hover:text-gray-700"
              aria-label="Pilih tanggal pengembalian"
            >
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
          {errors.tanggalPengembalian ? (
            <p className="mt-1 text-sm text-red-500">
              {errors.tanggalPengembalian}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Nominal</label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-sm text-gray-500">Rp</span>
          <input
            type="text"
            placeholder="Kamu pinjam berapa?"
            value={nominal ? formatRupiah(nominal) : ""}
            onChange={(e) => setNominal(parseRupiah(e.target.value))}
            className={`w-full rounded-lg border py-2 pl-9 pr-3 ${
              errors.nominal ? "border-red-500" : "border-gray-300"
            }`}
          />
        </div>
        {errors.nominal ? (
          <p className="mt-1 text-sm text-red-500">{errors.nominal}</p>
        ) : null}
      </div>

      <div className="pt-2">
        <button
          onClick={handleSubmit}
          className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700"
        >
          <Save className="mr-2 h-4 w-4" />
          {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
        </button>
      </div>

      <ConfirmModal
        show={showConfirm}
        message="Apakah Anda yakin ingin menyimpan data ini?"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
}
