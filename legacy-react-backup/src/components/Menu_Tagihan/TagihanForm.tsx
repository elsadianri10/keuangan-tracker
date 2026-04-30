import { useEffect, useState } from "react";
import { Plus , Pencil , Save , Trash } from "lucide-react";
// import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/solid";
import { TagihanAkun, TagihanItem } from "../../models/tagihan";
import { formatDate, formatRupiah, parseRupiah } from "../../utils/formatUniversal";
import { auth } from "../../services/firebase";
import { deleteField } from "firebase/firestore";
import { addTagihan, addTagihanItem, updateTagihan } from "../../services/tagihanService";
import { WarningModal, ConfirmModal } from "../../utils/ModalDialog";
import { akunOptions } from "../../constants/dropdownMenuItems";


interface TagihanFormProps {
  onSubmit: (data: TagihanAkun) => void;
  isEditMode?: boolean;
  editData?: TagihanAkun;
  usedAkunList: string[];
}

export default function TagihanForm({ onSubmit, isEditMode = false, editData, usedAkunList }: TagihanFormProps) {
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
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showWarning, setShowWarning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isEditMode && editData) {
      setNamaAkun(editData.namaAkun);
      setPembukuan(editData.pembukuan);
      setJatuhTempo(editData.jatuhTempo);
      setBiayaAdmin(editData.biayaAdmin || null);
      setIncludeAdmin(!!editData.biayaAdmin);
      setCustomAkun(editData.customAkun || "");
      setItems(editData.items);
    }
  }, [isEditMode, editData]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [errors]);


  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!namaAkun) newErrors.namaAkun = "Nama akun harus dipilih";
    if (namaAkun === "Lainnya" && !customAkun)
      newErrors.customAkun = "Nama akun lainnya harus diisi";
    if (!pembukuan) newErrors.pembukuan = "Tanggal pembukuan harus diisi";
    if (!jatuhTempo) newErrors.jatuhTempo = "Tanggal jatuh tempo harus diisi";
    if (includeAdmin && !biayaAdmin)
      newErrors.biayaAdmin = "Biaya admin harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateFormItem = () => {
    const newErrors: { [key: string]: string } = {};

    if (!newKeterangan) newErrors.newKeterangan = "Keterangan harus diisi";
    if (!newTenor) newErrors.newTenor = "Tenor harus diisi";
    if (!newBulanPertama)
      newErrors.newBulanPertama = "Bulan pertama harus dipilih";
    if (!newBulanTerakhir)
      newErrors.newBulanTerakhir = "Bulan terakhir harus dipilih";
    if (!newNominal) newErrors.newNominal = "Nominal harus diisi";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddItem = () => {
    if (!validateFormItem()) return;

    if (!newKeterangan.trim()) return;
    if (newNominal <= 0) return;
    if (!newTenor.trim()) return;
    if (!newBulanPertama || !newBulanTerakhir) return;

    const newItem: TagihanItem = {
      keterangan: newKeterangan,
      nominal: newNominal,
      tenor: newTenor,
      bulanCicilanPertama: newBulanPertama,
      bulanCicilanTerakhir: newBulanTerakhir,
    };

    setItems([...items, newItem]);

    setNewKeterangan("");
    setNewTenor("");
    setNewBulanPertama(null);
    setNewBulanTerakhir(null);
    setNewNominal(0);
    console.log("Kenapa tidak bisa?");
  };


  const handleEditItem = (index: number) => {
    const item = items[index];
    setNewKeterangan(item.keterangan);
    setNewNominal(item.nominal);
    setNewTenor(item.tenor);
    setNewBulanPertama(item.bulanCicilanPertama);
    setNewBulanTerakhir(item.bulanCicilanTerakhir);
    setItems(items.filter((_, i) => i !== index));
  };

  const handleDeleteItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

const handleSubmit = async () => {
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
  if (includeAdmin && (typeof biayaAdmin !== "number" || biayaAdmin <= 0))
    return;
  

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
       ...(biayaAdminValue !== undefined
         ? { biayaAdmin: biayaAdminValue }
         : {}),
       createdAt: new Date(),
     };

     if (isEditMode && editData) {
       const updateData: Partial<TagihanAkun> = {
         pembukuan,
         jatuhTempo,
         ...(includeAdmin
           ? { biayaAdmin: biayaAdmin ?? undefined }
           : { biayaAdmin: deleteField() as unknown as number | undefined }),
       };

       if (!editData.id) return;

       await updateTagihan(user.uid, editData.id, updateData);
       onSubmit({ ...editData, ...updateData, items });
     } else {
       const tagihanAkunId = await addTagihan(user.uid, tagihanAkunData);
       for (const item of items) {
         await addTagihanItem(user.uid, tagihanAkunId, item);
       }
       onSubmit({ ...tagihanAkunData, items });
     }

     if (!isEditMode) resetForm();
   } catch (error) {}
  setShowConfirm(false);
};

const resetForm = () => {
  setNamaAkun("");
  setCustomAkun("");
  setPembukuan(NaN);
  setJatuhTempo(NaN);
  setIncludeAdmin(false);
  setBiayaAdmin(null);
  setItems([]);
  setNewKeterangan("");
  setNewTenor("");
  setNewBulanPertama(null);
  setNewBulanTerakhir(null);
  setNewNominal(0);
};

  return (
    <div className="space-y-4">
      {/* INPUT FORM STARTS HERE */}
      {/* Dropdown & Text Field - Nama Akun */}
      <div>
        <label className="block text-sm font-medium mb-1">Nama Akun</label>
        <select
          value={namaAkun}
          onChange={(e) => {
            setNamaAkun(e.target.value);
            if (e.target.value !== "Lainnya") {
              setCustomAkun("");
            }
          }}
          disabled={isEditMode}
          className={`border rounded w-full px-2 py-1" ${
            errors.namaAkun ? "border-red-500" : ""
          }`}
        >
          <option value="">-- Pilih Akun --</option>
          {akunOptions
            .filter(
              (akun) =>
                isEditMode || akun === "Lainnya" || !usedAkunList.includes(akun)
            )
            .map((akun, i) => (
              <option key={i} value={akun}>
                {akun}
              </option>
            ))}
        </select>
        {errors.namaAkun && (
          <p className="text-red-500 text-sm">{errors.namaAkun}</p>
        )}

        {/* MASIH */}
        {/* Dropdown & Text Field - Nama Akun */}
        {/* Jika user memilih 'Lainnya', tampilkan input tambahan */}
        {namaAkun === "Lainnya" && (
          <div className="mt-2">
            <label className="block text-sm font-medium mb-1">
              Nama Akun (Lainnya)
            </label>
            <input
              type="text"
              placeholder="Isi nama akun lainnya"
              value={customAkun}
              onChange={(e) => setCustomAkun(e.target.value)}
              disabled={isEditMode}
              className={`border rounded w-full px-2 py-1 ${
                errors.customAkun ? "border-red-500" : ""
              }`}
            />
            {errors.customAkun && (
              <p className="text-red-500 text-sm">{errors.customAkun}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4">
        {/* Text Field - Tanggal Pembukuan */}
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

        {/* Text Field - Tanggal Jatuh Tempo */}
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

      {/* Checkbox & Text Field - Tambahan Biaya Admin */}
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeAdmin}
            onChange={(e) => setIncludeAdmin(e.target.checked)}
          />
          Tambahan Biaya Admin?
        </label>
        {includeAdmin && (
          <div className="relative">
            <span className="absolute left-2 top-1.5 text-sm text-gray-500">
              Rp
            </span>
            <input
              type="text"
              placeholder="Biaya Admin"
              value={biayaAdmin ? formatRupiah(biayaAdmin) : ""}
              onChange={(e) => setBiayaAdmin(parseRupiah(e.target.value))}
              className={`border rounded w-full pl-8 py-1 mt-1 ${
                errors.biayaAdmin ? "border-red-500" : ""
              }`}
            />
            {errors.biayaAdmin && (
              <p className="text-red-500 text-sm">{errors.biayaAdmin}</p>
            )}
          </div>
        )}
      </div>

      {/*INPUT ITEM TAGIHAN */}
      <div className="border-t pt-4">
        <h4 className="font-semibold mb-2">Tambah Item Tagihan</h4>

        {/* Text Field - Keterangan Tagihan */}
        <label className="block text-sm font-medium">Keterangan Tagihan</label>
        <input
          type="text"
          placeholder="Keterangan Tagihan"
          value={newKeterangan}
          onChange={(e) => setNewKeterangan(e.target.value)}
          className={`border rounded w-full px-2 py-1 mb-2 ${
            errors.newKeterangan ? "border-red-500" : ""
          }`}
        />
        {errors.newKeterangan && (
          <p className="text-red-500 text-sm">{errors.newKeterangan}</p>
        )}

        {/* Text Field - Tenor */}
        <label className="block text-sm font-medium">Tenor</label>
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="Tenor (Misal: 12)"
            value={newTenor}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setNewTenor(value);
            }}
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

        {/* Pick Date - Bulan Cicilan Pertama */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">
              Bulan Cicilan Pertama
            </label>
            <input
              type="date"
              value={
                newBulanPertama
                  ? newBulanPertama.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => setNewBulanPertama(new Date(e.target.value))}
              className={`border rounded w-full px-2 py-1 ${
                errors.newBulanPertama ? "border-red-500" : ""
              }`}
            />
            {errors.newBulanPertama && (
              <p className="text-red-500 text-sm">{errors.newBulanPertama}</p>
            )}
          </div>

          {/* Pick Date - Bulan Cicilan Terakhir */}
          <div className="flex-1">
            <label className="block text-sm font-medium">
              Bulan Cicilan Terakhir
            </label>
            <input
              type="date"
              value={
                newBulanTerakhir
                  ? newBulanTerakhir.toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) => setNewBulanTerakhir(new Date(e.target.value))}
              className={`border rounded w-full px-2 py-1 ${
                errors.newBulanTerakhir ? "border-red-500" : ""
              }`}
            />
            {errors.newBulanTerakhir && (
              <p className="text-red-500 text-sm">{errors.newBulanTerakhir}</p>
            )}
          </div>
        </div>

        {/* Text Field - Nominal Cicilan */}
        <label className="block text-sm font-medium">Nominal Cicilan</label>
        <div className="relative mb-2">
          <span className="absolute left-2 top-1.5 text-sm text-gray-500">
            Rp
          </span>
          <input
            type="text"
            placeholder="Nominal"
            value={newNominal ? formatRupiah(newNominal) : ""}
            onChange={(e) => setNewNominal(parseRupiah(e.target.value))}
            className={`border rounded w-full pl-8 py-1 ${
              errors.newNominal ? "border-red-500" : ""
            }`}
          />
          {errors.newNominal && (
            <p className="text-red-500 text-sm">{errors.newNominal}</p>
          )}
        </div>

        {/* Button - Tambah Item Tagihan */}
        <button
          onClick={handleAddItem}
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tambah Item Tagihan
        </button>
      </div>

      {/* LIST - ITEM TAGIHAN */}
      {items.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Daftar Item Tagihan</h4>
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={index} className="border px-3 py-2 rounded text-sm">
                <div className="flex justify-between items-center">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {/* List Item - Keterangan Tagihan */}
                    <div className="font-medium col-span-2">
                      {item.keterangan}
                    </div>

                    {/* List Item - Nominal Cicilan */}
                    <div className="text-xs text-gray-500">Nominal Cicilan</div>
                    <div className="text-xs text-gray-500 text-left">
                      : Rp {item.nominal.toLocaleString()}
                    </div>

                    {/* List Item - Tenor */}
                    <div className="text-xs text-gray-500">Tenor</div>
                    <div className="text-xs text-gray-500 text-left">
                      : {item.tenor} bulan
                    </div>

                    {/* List Item - Rentang Tanggal */}
                    <div className="text-xs text-gray-500">Rentang Tanggal</div>
                    <div className="text-xs text-gray-500 text-left">
                      : {formatDate(item.bulanCicilanPertama)} -{" "}
                      {formatDate(item.bulanCicilanTerakhir)}
                    </div>
                  </div>

                  {/* Button - Edit & Delete Item */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditItem(index)}
                      className="bg-yellow-500 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-yellow-600 transition"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(index)}
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

      {/* BUTTON - SUBMIT */}
      <div className="pt-4 flex justify-center">
        <button
          onClick={handleSubmit}
          className="bg-green-600 text-white px-4 py-2 rounded flex flex-row items-center hover:bg-green-700 transition"
        >
          <Save className="w-4 h-4 mr-2" />
          {isEditMode ? "Simpan Perubahan Tagihan" : "Simpan Tagihan"}
        </button>

        {/* Modal Peringatan */}
        <WarningModal
          show={showWarning}
          message="Tambah Item Tagihan"
          subMessage="Minimal 1 (satu)"
          onClose={() => setShowWarning(false)}
        />

        {/* Modal Konfirmasi */}
        <ConfirmModal
          show={showConfirm}
          message="Apakah Anda yakin ingin menyimpan tagihan ini?"
          onClose={() => setShowConfirm(false)}
          onConfirm={handleConfirmSubmit}
        />
      </div>
    </div>
  );
}
