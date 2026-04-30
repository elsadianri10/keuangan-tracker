import { useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash } from "lucide-react";
import { Button } from "../../assets/components/ui/button";
import {
  formatDate,
  formatRupiah,
  parseRupiah,
} from "../../utils/formatUniversal";
import { auth } from "../../services/firebase";
import { ConfirmModal, WarningModal } from "../../utils/ModalDialog";
import {
  akunDanaPribadiOptions,
  akunLimitPayLaterOptions,
  jenisPiutangOptions,
} from "../../constants/dropdownMenuItems";
import { DanaItems, LimitItems, Piutang } from "../../models/hutangPiutang";
import { addPiutang, updatePiutang } from "../../services/hutangPiutangService";

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
  }, [editData, isEditMode]);

  const resetDanaItemForm = () => {
    setNewKeteranganPinjam("");
    setNewTanggalPinjam(null);
    setNewTanggalPengembalian(null);
    setNewNominalPinjam(0);
    setIncludeBunga(false);
    setNewBungaPinjaman(null);
  };

  const resetLimitItemForm = () => {
    setNewKeteranganLimit("");
    setNewTglAwalTransaksi(null);
    setNewTenor("");
    setNewTglMulai(null);
    setNewTglSelesai(null);
    setNewNominalLimit(0);
  };

  const resetForm = () => {
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
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!namaDebitur.trim()) {
      newErrors.namaDebitur = "Nama debitur harus diisi";
    }

    if (!jenisPiutang) {
      newErrors.jenisPiutang = "Jenis piutang harus dipilih";
    }

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
    if (!newTanggalPinjam) {
      newErrors.newTanggalPinjam = "Tanggal pinjam harus diisi";
    }
    if (!newTanggalPengembalian) {
      newErrors.newTanggalPengembalian = "Tanggal pengembalian harus diisi";
    }
    if (!newNominalPinjam) {
      newErrors.newNominalPinjam = "Nominal harus diisi";
    }
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
    if (!newTenor) {
      newErrors.newTenor = "Tenor harus diisi";
    }
    if (!newTglMulai) {
      newErrors.newTglMulai = "Tanggal mulai harus diisi";
    }
    if (!newTglSelesai) {
      newErrors.newTglSelesai = "Tanggal selesai harus diisi";
    }
    if (!newNominalLimit) {
      newErrors.newNominalLimit = "Nominal harus diisi";
    }

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
    <div>
      <div className="space-y-4">
        <label className="block text-sm font-medium">Nama Debitur</label>
        <input
          type="text"
          placeholder="Siapa yang pinjam?"
          value={namaDebitur}
          onChange={(e) => setNamaDebitur(e.target.value)}
          className={`border rounded w-full px-2 py-1 mb-2 ${
            errors.namaDebitur ? "border-red-500" : ""
          }`}
        />
        {errors.namaDebitur && (
          <p className="text-red-500 text-sm">{errors.namaDebitur}</p>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Jenis Piutang</label>
          <select
            value={jenisPiutang}
            onChange={(e) =>
              setJenisPiutang(e.target.value as "" | Piutang["jenisPiutang"])
            }
            disabled={isEditMode}
            className={`border rounded w-full px-2 py-1 ${
              errors.jenisPiutang ? "border-red-500" : ""
            }`}
          >
            <option value="">-- Pilih Jenis Piutang --</option>
            {jenisPiutangOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.jenisPiutang && (
            <p className="text-red-500 text-sm">{errors.jenisPiutang}</p>
          )}
        </div>

        {jenisPiutang === "Dana Pribadi" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Platform Dana
              </label>
              <select
                value={asalDana}
                onChange={(e) => {
                  setAsalDana(e.target.value);
                  if (e.target.value !== "Lainnya") {
                    setAsalDanaCustom("");
                  }
                }}
                disabled={isEditMode}
                className={`border rounded w-full px-2 py-1 ${
                  errors.asalDana ? "border-red-500" : ""
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
              {errors.asalDana && (
                <p className="text-red-500 text-sm">{errors.asalDana}</p>
              )}

              {asalDana === "Lainnya" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">
                    Platform Dana (Lainnya)
                  </label>
                  <input
                    type="text"
                    placeholder="Isi platform dana lainnya"
                    value={asalDanaCustom}
                    onChange={(e) => setAsalDanaCustom(e.target.value)}
                    disabled={isEditMode}
                    className={`border rounded w-full px-2 py-1 ${
                      errors.asalDanaCustom ? "border-red-500" : ""
                    }`}
                  />
                  {errors.asalDanaCustom && (
                    <p className="text-red-500 text-sm">{errors.asalDanaCustom}</p>
                  )}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Tambah Item Dana</h4>
              <label className="block text-sm font-medium">
                Keterangan Peminjaman
              </label>
              <input
                type="text"
                placeholder="Dipinjam untuk apa?"
                value={newKeteranganPinjam}
                onChange={(e) => setNewKeteranganPinjam(e.target.value)}
                className={`border rounded w-full px-2 py-1 mb-2 ${
                  errors.newKeteranganPinjam ? "border-red-500" : ""
                }`}
              />
              {errors.newKeteranganPinjam && (
                <p className="text-red-500 text-sm">
                  {errors.newKeteranganPinjam}
                </p>
              )}

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium">Tanggal Pinjam</label>
                  <input
                    type="date"
                    value={
                      newTanggalPinjam
                        ? newTanggalPinjam.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) => setNewTanggalPinjam(new Date(e.target.value))}
                    className={`border rounded w-full px-2 py-1 ${
                      errors.newTanggalPinjam ? "border-red-500" : ""
                    }`}
                  />
                  {errors.newTanggalPinjam && (
                    <p className="text-red-500 text-sm">
                      {errors.newTanggalPinjam}
                    </p>
                  )}
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium">
                    Tanggal Pengembalian
                  </label>
                  <input
                    type="date"
                    value={
                      newTanggalPengembalian
                        ? newTanggalPengembalian.toISOString().split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      setNewTanggalPengembalian(new Date(e.target.value))
                    }
                    className={`border rounded w-full px-2 py-1 ${
                      errors.newTanggalPengembalian ? "border-red-500" : ""
                    }`}
                  />
                  {errors.newTanggalPengembalian && (
                    <p className="text-red-500 text-sm">
                      {errors.newTanggalPengembalian}
                    </p>
                  )}
                </div>
              </div>

              <label className="block text-sm font-medium mt-2">Nominal</label>
              <div className="relative mb-2">
                <span className="absolute left-2 top-1.5 text-sm text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="Berapa yang dipinjam?"
                  value={newNominalPinjam ? formatRupiah(newNominalPinjam) : ""}
                  onChange={(e) =>
                    setNewNominalPinjam(parseRupiah(e.target.value))
                  }
                  className={`border rounded w-full pl-8 py-1 ${
                    errors.newNominalPinjam ? "border-red-500" : ""
                  }`}
                />
                {errors.newNominalPinjam && (
                  <p className="text-red-500 text-sm">
                    {errors.newNominalPinjam}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={includeBunga}
                    onChange={(e) => setIncludeBunga(e.target.checked)}
                  />
                  Tambah Bunga Pinjaman?
                </label>
                {includeBunga && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Mau kasih berapa (%) bunganya?"
                      value={
                        newBungaPinjaman ? formatRupiah(newBungaPinjaman) : ""
                      }
                      onChange={(e) =>
                        setNewBungaPinjaman(parseRupiah(e.target.value))
                      }
                      className={`border rounded w-full pl-8 py-1 mt-1 ${
                        errors.newBungaPinjaman ? "border-red-500" : ""
                      }`}
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      %
                    </span>
                    {errors.newBungaPinjaman && (
                      <p className="text-red-500 text-sm">
                        {errors.newBungaPinjaman}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleAddItemDana}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition mt-2"
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Item Dana
              </button>
            </div>

            {itemsDana.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Daftar Item Dana</h4>
                <ul className="space-y-1">
                  {itemsDana.map((item, index) => (
                    <li key={index} className="border px-3 py-2 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="font-medium col-span-2">
                            {item.keteranganPinjam}
                          </div>
                          <div className="text-xs text-gray-500">
                            Nominal Peminjaman
                          </div>
                          <div className="text-xs text-gray-500 text-left">
                            : Rp {item.nominalPinjam.toLocaleString()}
                          </div>
                          {item.bungaPinjam ? (
                            <>
                              <div className="text-xs text-gray-500">Bunga</div>
                              <div className="text-xs text-gray-500 text-left">
                                : {item.bungaPinjam}%
                              </div>
                            </>
                          ) : null}
                          <div className="text-xs text-gray-500">
                            Rentang Tanggal
                          </div>
                          <div className="text-xs text-gray-500 text-left">
                            : {formatDate(item.tglPinjam)} -{" "}
                            {formatDate(item.tglKembali)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItemDana(index)}
                            className="bg-yellow-500 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-yellow-600 transition"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItemDana(index)}
                            className="bg-red-600 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-red-700 transition"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {jenisPiutang === "Limit Pay Later" && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Platform Pay Later
              </label>
              <select
                value={asalLimit}
                onChange={(e) => {
                  setAsalLimit(e.target.value);
                  if (e.target.value !== "Lainnya") {
                    setAsalLimitCustom("");
                  }
                }}
                disabled={isEditMode}
                className={`border rounded w-full px-2 py-1 ${
                  errors.asalLimit ? "border-red-500" : ""
                }`}
              >
                <option value="">-- Pilih Platform --</option>
                {akunLimitPayLaterOptions
                  .filter(
                    (akun) =>
                      isEditMode ||
                      akun === "Lainnya" ||
                      !usedLimitList.includes(akun)
                  )
                  .map((akun) => (
                    <option key={akun} value={akun}>
                      {akun}
                    </option>
                  ))}
              </select>
              {errors.asalLimit && (
                <p className="text-red-500 text-sm">{errors.asalLimit}</p>
              )}

              {asalLimit === "Lainnya" && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">
                    Platform Pay Later (Lainnya)
                  </label>
                  <input
                    type="text"
                    placeholder="Isi platform pay later lainnya"
                    value={asalLimitCustom}
                    onChange={(e) => setAsalLimitCustom(e.target.value)}
                    disabled={isEditMode}
                    className={`border rounded w-full px-2 py-1 ${
                      errors.asalLimitCustom ? "border-red-500" : ""
                    }`}
                  />
                  {errors.asalLimitCustom && (
                    <p className="text-red-500 text-sm">
                      {errors.asalLimitCustom}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium">
                  Pembukuan (Tanggal)
                </label>
                <input
                  type="number"
                  value={pembukuan}
                  onChange={(e) => setPembukuan(+e.target.value)}
                  className={`border rounded w-full px-2 py-1 ${
                    errors.pembukuan ? "border-red-500" : ""
                  }`}
                />
                {errors.pembukuan && (
                  <p className="text-red-500 text-sm">{errors.pembukuan}</p>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-medium">
                  Jatuh Tempo (Tanggal)
                </label>
                <input
                  type="number"
                  value={jatuhTempo}
                  onChange={(e) => setJatuhTempo(+e.target.value)}
                  className={`border rounded w-full px-2 py-1 ${
                    errors.jatuhTempo ? "border-red-500" : ""
                  }`}
                />
                {errors.jatuhTempo && (
                  <p className="text-red-500 text-sm">{errors.jatuhTempo}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Tambah Item Limit</h4>
              <label className="block text-sm font-medium">
                Keterangan Peminjaman
              </label>
              <input
                type="text"
                placeholder="Dipinjam untuk apa?"
                value={newKeteranganLimit}
                onChange={(e) => setNewKeteranganLimit(e.target.value)}
                className={`border rounded w-full px-2 py-1 mb-2 ${
                  errors.newKeteranganLimit ? "border-red-500" : ""
                }`}
              />
              {errors.newKeteranganLimit && (
                <p className="text-red-500 text-sm">
                  {errors.newKeteranganLimit}
                </p>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium">
                  Tanggal Awal Transaksi
                </label>
                <input
                  type="date"
                  value={
                    newTglAwalTransaksi
                      ? newTglAwalTransaksi.toISOString().split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setNewTglAwalTransaksi(new Date(e.target.value))
                  }
                  className={`border rounded w-full px-2 py-1 ${
                    errors.newTglAwalTransaksi ? "border-red-500" : ""
                  }`}
                />
                {errors.newTglAwalTransaksi && (
                  <p className="text-red-500 text-sm">
                    {errors.newTglAwalTransaksi}
                  </p>
                )}
              </div>

              <label className="block text-sm font-medium">Tenor</label>
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Tenor (Misal: 12)"
                  value={newTenor}
                  onChange={(e) => setNewTenor(e.target.value.replace(/\D/g, ""))}
                  className={`border rounded w-full px-2 py-1 pr-16 ${
                    errors.newTenor ? "border-red-500" : ""
                  }`}
                />
                <span className="absolute right-3 top-1.5 text-sm text-gray-500">
                  Bulan
                </span>
                {errors.newTenor && (
                  <p className="text-red-500 text-sm">{errors.newTenor}</p>
                )}
              </div>

              <label className="block text-sm font-medium">
                Rentang Tanggal Tagihan Berakhir
              </label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="date"
                    value={newTglMulai ? newTglMulai.toISOString().split("T")[0] : ""}
                    onChange={(e) => setNewTglMulai(new Date(e.target.value))}
                    className={`border rounded w-full px-2 py-1 ${
                      errors.newTglMulai ? "border-red-500" : ""
                    }`}
                  />
                  {errors.newTglMulai && (
                    <p className="text-red-500 text-sm">{errors.newTglMulai}</p>
                  )}
                </div>

                <div className="flex-1">
                  <input
                    type="date"
                    value={
                      newTglSelesai ? newTglSelesai.toISOString().split("T")[0] : ""
                    }
                    onChange={(e) => setNewTglSelesai(new Date(e.target.value))}
                    className={`border rounded w-full px-2 py-1 ${
                      errors.newTglSelesai ? "border-red-500" : ""
                    }`}
                  />
                  {errors.newTglSelesai && (
                    <p className="text-red-500 text-sm">{errors.newTglSelesai}</p>
                  )}
                </div>
              </div>

              <label className="block text-sm font-medium mt-2">Nominal</label>
              <div className="relative mb-2">
                <span className="absolute left-2 top-1.5 text-sm text-gray-500">
                  Rp
                </span>
                <input
                  type="text"
                  placeholder="Berapa yang dipinjam?"
                  value={newNominalLimit ? formatRupiah(newNominalLimit) : ""}
                  onChange={(e) =>
                    setNewNominalLimit(parseRupiah(e.target.value))
                  }
                  className={`border rounded w-full pl-8 py-1 ${
                    errors.newNominalLimit ? "border-red-500" : ""
                  }`}
                />
                {errors.newNominalLimit && (
                  <p className="text-red-500 text-sm">
                    {errors.newNominalLimit}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddItemLimit}
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Item Limit
              </button>
            </div>

            {itemsLimit.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Daftar Item Limit</h4>
                <ul className="space-y-1">
                  {itemsLimit.map((item, index) => (
                    <li key={index} className="border px-3 py-2 rounded text-sm">
                      <div className="flex justify-between items-center">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="font-medium col-span-2">
                            {item.keteranganLimit}
                          </div>
                          <div className="text-xs text-gray-500">
                            Nominal Cicilan
                          </div>
                          <div className="text-xs text-gray-500 text-left">
                            : Rp {item.nominalLimit.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Tanggal Awal Transaksi
                          </div>
                          <div className="text-xs text-gray-500 text-left">
                            : {formatDate(item.tanggalAwal)}
                          </div>
                          <div className="text-xs text-gray-500">Tenor</div>
                          <div className="text-xs text-gray-500 text-left">
                            : {item.tenor} bulan
                          </div>
                          <div className="text-xs text-gray-500">
                            Rentang Tanggal
                          </div>
                          <div className="text-xs text-gray-500 text-left">
                            : {formatDate(item.tanggalMulai)} -{" "}
                            {formatDate(item.tanggalSelesai)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItemLimit(index)}
                            className="bg-yellow-500 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-yellow-600 transition"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItemLimit(index)}
                            className="bg-red-600 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-red-700 transition"
                          >
                            <Trash className="w-4 h-4 mr-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded flex flex-row items-center hover:bg-green-700 transition"
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditMode ? "Simpan Perubahan" : "Tambah Data"}
        </Button>
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
