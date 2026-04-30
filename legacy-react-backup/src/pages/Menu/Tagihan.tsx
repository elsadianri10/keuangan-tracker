import { useEffect , useState } from "react";
import {  } from "lucide-react";
import { Eye , Funnel , Pencil , Plus , RefreshCcw , Search , Trash } from "lucide-react";
import Layout from "../../components/Layout";
import TagihanForm from "../../components/Menu_Tagihan/TagihanForm";
import DialogDetailTagihan from "../../components/Menu_Tagihan/DetailTagihan";
import { TagihanAkun, TagihanItem } from "../../models/tagihan";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../services/firebase";
import {
  deleteTagihan, updateTagihan
} from "../../services/tagihanService";

import {
  collection,
  getDocs,
} from "firebase/firestore";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../assets/components/ui/dialog";
import {
  SkeletonLib,
 } from "../../assets/loading";
import { ConfirmModal } from "../../utils/ModalDialog";
import {
  formatDateLong
} from "../../utils/formatUniversal";
import useOnlineStatus from "../../utils/useOnlineStatus";

const Tagihan = () => {
  const isOnline = useOnlineStatus();
  const [dataTagihan, setDataTagihan] = useState<TagihanAkun[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAkun, setSelectedAkun] = useState<TagihanAkun | null>(null);
  const [selectedItem, setSelectedItem] = useState<TagihanItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [filterAkun, setFilterAkun] = useState("");
  const [filterCustom, setFilterCustom] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);

  const usedAkunList = dataTagihan.map((item) => item.namaAkun);

  // Load saat login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await loadDataTagihan(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadDataTagihan = async (userId: string) => {
    try {
      setLoading(true);
      const tagihanRef = collection(db, "users", userId, "tagihan");
      const snapshot = await getDocs(tagihanRef);

      const fetchedData: TagihanAkun[] = [];

      for (const docSnap of snapshot.docs) {
        const akunData = docSnap.data() as Omit<TagihanAkun, "items">;
        const itemsRef = collection(
          db,
          "users",
          userId,
          "tagihan",
          docSnap.id,
          "items"
        );
        const itemsSnap = await getDocs(itemsRef);
        const items: TagihanItem[] = itemsSnap.docs.map((itemDoc) => {
          const itemData = itemDoc.data();

          // Konversi timestamp Firestore ke Date
          const parseDate = (dateValue: any) => {
            if (!dateValue) return null;
            if (dateValue instanceof Date) return dateValue;
            if (dateValue.seconds) return new Date(dateValue.seconds * 1000); // Firestore Timestamp
            return new Date(dateValue); // String atau number timestamp
          };

          return {
            ...itemData,
            bulanCicilanPertama: parseDate(itemData.bulanCicilanPertama),
            bulanCicilanTerakhir: parseDate(itemData.bulanCicilanTerakhir),
          } as TagihanItem;
        });

        fetchedData.push({ id: docSnap.id, ...akunData, items });
      }

      setDataTagihan(fetchedData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTagihan = async (data: TagihanAkun) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const { id, items, ...updateData } = data;

      if (id) {
        // 🔹 Mode Edit
        await updateTagihan(user.uid, id, updateData, items);
      } else {
        // 🔹 Mode Tambah (Buat ID baru)
        // await addTagihan(user.uid, data);
      }

      await loadDataTagihan(user.uid);
    } catch (error) {
    }

    setEditIndex(null);
    setOpenDialog(false);
  };


  const handleEdit = (index: number) => {
    setEditIndex(index);
    setSelectedAkun(dataTagihan[index]);
    setOpenDialog(true);
  };

  const handleDelete = async () => {
    if (selectedIndex === null) return;

    const user = auth.currentUser;
    if (!user) return;

    const tagihanToDelete = dataTagihan[selectedIndex];
    if (!tagihanToDelete?.id) return;

    try {
      await deleteTagihan(user.uid, tagihanToDelete.id);
      setDataTagihan((prev) => prev.filter((_, i) => i !== selectedIndex));
    } catch (error) {}

    setShowConfirm(false);
    setSelectedIndex(null);
  };


  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Daftar Tagihan</h2>
      </div>

      {/* Baris tombol filter + tambah tagihan */}
      <div className="flex items-center justify-between mb-4">
        {/* Filter Section */}
        <div className="flex items-center gap-3">
          <select
            className="border px-2 py-2 rounded flex flex-row items-center"
            value={filterAkun}
            onChange={(e) => {
              setFilterAkun(e.target.value);
              setFilterCustom("");
            }}
          >
            <Funnel className="w-4 h-4 mr-1" />
            <option value="">Semua Akun</option>
            {Array.from(new Set(dataTagihan.map((d) => d.namaAkun))).map(
              (akun, i) => (
                <option key={i} value={akun}>
                  {akun}
                </option>
              )
            )}
          </select>

          {filterAkun === "Lainnya" && (
            <div className="relative">
              {/* Ikon Search */}
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

              {/* Input Field */}
              <input
                type="text"
                placeholder="Cari Custom Akun"
                className="border pl-10 pr-2 py-2 rounded w-full"
                value={filterCustom}
                onChange={(e) => setFilterCustom(e.target.value)}
              />
            </div>
          )}

          <button
            className="border px-3 py-2 rounded flex flex-row items-center hover:bg-gray-100 transition-colors duration-200"
            onClick={() => {
              const user = auth.currentUser;
              if (!user) return;
              loadDataTagihan(user.uid);
            }}
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh Data
          </button>
        </div>

        {/* Tambah Tagihan Button */}
        <Dialog
          open={openDialog}
          onOpenChange={(val) => {
            setOpenDialog(val);
            if (!val) setEditIndex(null);
          }}
        >
          <DialogTrigger asChild>
            <button
              className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
              onClick={() => {
                setEditIndex(null);
                setOpenDialog(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tambah Tagihan
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editIndex !== null
                  ? "Edit Akun Tagihan"
                  : "Tambah Akun Tagihan"}
              </DialogTitle>
            </DialogHeader>
            <TagihanForm
              onSubmit={handleSubmitTagihan}
              isEditMode={editIndex !== null}
              editData={editIndex !== null ? dataTagihan[editIndex] : undefined}
              usedAkunList={usedAkunList}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <>
          {isOnline ? (
            <SkeletonLib />
          ) : (
            <p className="text-red-500 italic">Tidak ada koneksi internet.</p>
          )}
        </>
      ) : dataTagihan.length === 0 ? (
        <p className="text-gray-500 italic">
          Belum ada data tagihan yang ditampilkan.
        </p>
      ) : (
        dataTagihan
          .filter((akun) => {
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
          })
          .map((akun, index) => {
            const totalNominal = akun.items.reduce(
              (sum, item) => sum + item.nominal,
              0
            );
            const totalAkhir = totalNominal + (akun.biayaAdmin || 0);

            return (
              <div key={index} className="mb-6 border rounded p-4 shadow">
                <div className="flex items-center justify-between mb-2">
                  {/* Title - Nama Akun */}
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{akun.namaAkun}</h3>
                    {akun.namaAkun === "Lainnya" && (
                      <h2 className="text-lg font-semibold text-gray-600">
                        ({akun.customAkun})
                      </h2>
                    )}
                  </div>

                  {/* Button - Edit & Delete */}
                  <div className="flex gap-2 mt-3">
                    <button
                      className="bg-yellow-500 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-yellow-600 transition"
                      onClick={() => handleEdit(index)}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      className="bg-red-600 text-white text-xs px-3 py-2 rounded flex flex-row items-center hover:bg-red-700 transition"
                      onClick={() => {
                        setSelectedIndex(index);
                        setShowConfirm(true);
                      }}
                    >
                      <Trash className="w-4 h-4 mr-1" />
                      Delete
                    </button>
                    {/* Modal Konfirmasi */}
                    {showConfirm && selectedIndex !== null && (
                      <ConfirmModal
                        show={showConfirm}
                        message="Apakah Anda yakin ingin menghapus tagihan ini?"
                        onClose={() => {
                          setShowConfirm(false);
                          setSelectedIndex(null);
                        }}
                        onConfirm={handleDelete}
                      />
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  Pembukuan: Setiap Tanggal {akun.pembukuan} - Jatuh Tempo:
                  Setiap Tanggal {akun.jatuhTempo}
                </p>
                {akun.biayaAdmin && (
                  <p className="text-sm text-gray-600">
                    Biaya Admin: Rp {akun.biayaAdmin.toLocaleString()}
                  </p>
                )}

                {/* TABLE - TAGIHAN */}
                <table className="w-full mt-3 text-sm border table-fixed">
                  {/* Table Head - Tagihan */}
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 w-[160px]">
                        Keterangan Tagihan
                      </th>
                      <th className="border px-2 py-1 w-[80px]">Tenor</th>
                      <th className="border px-2 py-1 w-[140px]">
                        Bulan Cicilan Pertama
                      </th>
                      <th className="border px-2 py-1 w-[140px]">
                        Bulan Cicilan Terakhir
                      </th>
                      <th className="border px-2 py-1 w-[120px]">
                        Nominal Cicilan
                      </th>
                      <th className="border px-2 py-1 w-[40px] text-center"></th>
                    </tr>
                  </thead>

                  {/* Table Body - Tagihan */}
                  <tbody>
                    {akun.items.map((item, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1 truncate">
                          {item.keterangan}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {item.tenor} Bulan
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {formatDateLong(item.bulanCicilanPertama)}
                        </td>
                        <td className="border px-2 py-1 text-center">
                          {formatDateLong(item.bulanCicilanTerakhir)}
                        </td>
                        <td className="border px-2 py-1">
                          <div className="flex justify-between w-full">
                            <span>Rp</span>
                            <span className="text-right w-full">
                              {item.nominal.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="border px-2 py-1 text-center">
                          <button
                            onClick={() => {
                              setSelectedAkun(akun);
                              setSelectedItem(item);
                              setOpenDetailDialog(true);
                            }}
                            className="bg-blue-100 text-blue-600 hover:bg-blue-200 p-1 rounded-md inline-flex items-center justify-center shadow"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={4} className="text-right px-2 py-1 border">
                        Total Akhir
                      </td>
                      <td className="border px-2 py-1">
                        <div className="flex justify-between w-full">
                          <span>Rp</span>
                          <span className="text-right w-full">
                            {totalAkhir.toLocaleString()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
      )}
      {selectedAkun && selectedItem && (
        <DialogDetailTagihan
          open={openDetailDialog}
          onClose={() => setOpenDetailDialog(false)}
          akun={selectedAkun}
          item={selectedItem}
        />
      )}
    </Layout>
  );
};

export default Tagihan;