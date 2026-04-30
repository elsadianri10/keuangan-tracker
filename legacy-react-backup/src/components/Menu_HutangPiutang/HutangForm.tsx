import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "../../assets/components/ui/button";
import {
  formatDateLong,
  formatRupiah,
  parseRupiah,
} from "../../utils/formatUniversal";
import { auth } from "../../services/firebase";
import { WarningModal, ConfirmModal } from "../../utils/ModalDialog";
import { Hutang } from "../../models/hutangPiutang";

import {
  addHutang,
  updateHutang,
} from "../../services/hutangPiutangService";

interface HutangFormProps {
  onSubmit: (data: Hutang) => void;
  isEditMode?: boolean;
  editData?: Hutang;
};

export default function HutangForm({ onSubmit, isEditMode = false, editData }: HutangFormProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [namaKreditur, setNamaKreditur] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [tanggalPinjam, setTanggalPinjam] = useState<Date | null>(null);
  const [tanggalPengembalian, setTanggalPengembalian] = useState<Date | null>(
    null
  );
  const [nominal, setNominal] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isEditMode && editData) {
      setNamaKreditur(editData.namaKreditur);
      setKeterangan(editData.keteranganPinjam);
      setTanggalPinjam(editData.tglPinjam);
      setTanggalPengembalian(editData.tglKembali);
      setNominal(editData.nominalPinjam);
    }
  }, [isEditMode, editData]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!namaKreditur) newErrors.namaKreditur = "Nama Kreditur harus diisi";
    if (!keterangan) newErrors.keterangan = "Keterangan harus diisi";
    if (!tanggalPinjam) newErrors.tanggalPinjam = "Tanggal Pinjam harus diisi";
    if (!tanggalPengembalian)
      newErrors.tanggalPengembalian = "Tanggal Pengembalian harus diisi";
    if (!nominal) newErrors.nominal = "Nominal harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async () => {
  if (!validateForm()) return;

  if (!namaKreditur) return;
  setShowConfirm(true);
};

  const handleConfirmSubmit = async () => {
    if (!validateForm()) return;

    try {
      const user = auth.currentUser;
      if (!user) return;

      const hutangData: Omit<Hutang, "id"> = {
        namaKreditur: namaKreditur,
        keteranganPinjam: keterangan,
        tglPinjam: tanggalPinjam!,
        tglKembali: tanggalPengembalian!,
        nominalPinjam: nominal,
        createdAt: new Date(),
      };

      if (isEditMode && editData?.id) {
        const updateData: Partial<Hutang> = {
          namaKreditur: namaKreditur,
          keteranganPinjam: keterangan,
          tglPinjam: tanggalPinjam!,
          tglKembali: tanggalPengembalian!,
          nominalPinjam: nominal,
        };

        await updateHutang(user.uid, editData.id, updateData);
        onSubmit({ ...editData, ...updateData });
      } else {
        const newId = await addHutang(user.uid, hutangData);
        onSubmit({ ...hutangData, id: newId });
      }

      if (!isEditMode) {
        resetForm();
      }
    } catch (error) {
      console.error("Gagal menyimpan data hutang:", error);
    }

    setShowConfirm(false);
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
    <div>
      <div className="space-y-4">
        {/* Text Field - Nama Kreditur */}
        <label className="block text-sm font-medium">Nama Kreditur</label>
        <input
          type="text"
          placeholder="Kamu pinjam ke siapa?"
          value={namaKreditur}
          onChange={(e) => setNamaKreditur(e.target.value)}
          className={`border rounded w-full px-2 py-1 mb-2 ${
            errors.namaKreditur ? "border-red-500" : ""
          }`}
          disabled={isEditMode}
        />

        {errors.namaKreditur && (
          <p className="text-red-500 text-sm">{errors.namaKreditur}</p>
        )}
        {/* Text Field - Keterangan Peminjaman */}
        <label className="block text-sm font-medium">
          Keterangan Peminjaman
        </label>
        <input
          type="text"
          placeholder="Kamu mau pakai buat apa?"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
          className={`border rounded w-full px-2 py-1 mb-2 ${
            errors.newKeterangan ? "border-red-500" : ""
          }`}
        />
        {errors.keterangan && (
          <p className="text-red-500 text-sm">{errors.keterangan}</p>
        )}
        {/* Pick Date - Tanggal Pinjam */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">Tanggal Pinjam</label>
            <input
              type="date"
              value={
                tanggalPinjam ? tanggalPinjam.toISOString().split("T")[0] : ""
              }
              onChange={(e) => setTanggalPinjam(new Date(e.target.value))}
              className={`border rounded w-full px-2 py-1 ${
                errors?.tanggalPinjam ? "border-red-500" : ""
              }`}
            />
            {errors?.tanggalPinjam && (
              <p className="text-red-500 text-sm">{errors.tanggalPinjam}</p>
            )}
          </div>

          {/* Pick Date - Tanggal Pengembalian */}
          <div className="flex-1">
            <label className="block text-sm font-medium">
              Tanggal Pengembalian
            </label>
            <input
              type="date"
              value={
                tanggalPengembalian
                  ? tanggalPengembalian.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => setTanggalPengembalian(new Date(e.target.value))}
              className={`border rounded w-full px-2 py-1 ${
                errors?.tanggalPengembalian ? "border-red-500" : ""
              }`}
            />
            {errors?.tanggalPengembalian && (
              <p className="text-red-500 text-sm">
                {errors.tanggalPengembalian}
              </p>
            )}
          </div>
        </div>
        {/* Text Field - Nominal */}
        <label className="block text-sm font-medium">Nominal</label>
        <div className="relative mb-2">
          <span className="absolute left-2 top-1.5 text-sm text-gray-500">
            Rp
          </span>
          <input
            type="text"
            placeholder="Kamu pinjam berapa?"
            value={nominal ? formatRupiah(nominal) : ""}
            onChange={(e) => setNominal(parseRupiah(e.target.value))}
            className={`border rounded w-full pl-8 py-1 ${
              errors?.nominal ? "border-red-500" : ""
            }`}
          />
          {errors?.nominal && (
            <p className="text-red-500 text-sm">{errors.nominal}</p>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded flex flex-row items-center hover:bg-green-700 transition"
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
        </Button>

        {/* Modal Peringatan */}
        <WarningModal
          show={showWarning}
          message="Tambah Item"
          subMessage="Minimal 1 (satu)"
          onClose={() => setShowWarning(false)}
        />

        {/* Modal Konfirmasi */}
        <ConfirmModal
          show={showConfirm}
          message="Apakah Anda yakin ingin menyimpan data ini?"
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSubmit}
        />
      </div>
    </div>
  );
};

