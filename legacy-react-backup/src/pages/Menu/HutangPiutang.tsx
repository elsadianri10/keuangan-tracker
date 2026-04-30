import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  RefreshCcw,
  Trash,
} from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { SkeletonLib } from "../../assets/loading";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../assets/components/ui/dialog";
import HutangForm from "../../components/Menu_HutangPiutang/HutangForm";
import PiutangForm from "../../components/Menu_HutangPiutang/PiutangForm";
import Layout from "../../components/Layout";
import { Hutang, Piutang } from "../../models/hutangPiutang";
import { auth } from "../../services/firebase";
import {
  deleteHutang,
  deletePiutang,
  fetchHutang,
  fetchPiutang,
} from "../../services/hutangPiutangService";
import { formatDateLong, formatRupiah } from "../../utils/formatUniversal";
import { ConfirmModal } from "../../utils/ModalDialog";
import useOnlineStatus from "../../utils/useOnlineStatus";

const HutangPiutang = () => {
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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
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
    } catch (error) {
      console.error("Gagal mengambil data hutang & piutang:", error);
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
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Daftar Hutang & Piutang</h2>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            className="border px-3 py-2 rounded flex flex-row items-center hover:bg-gray-100 transition-colors duration-200"
            onClick={handleRefresh}
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowHutang((prev) => !prev)}
          className="w-full bg-gray-100 px-4 py-2 rounded flex justify-between items-center text-left font-semibold mb-4"
        >
          <span>Hutang Saya</span>
          {showHutang ? <ChevronUp /> : <ChevronDown />}
        </button>

        <div className="flex items-center justify-between">
          <div />
          <Dialog
            open={openDialogHutang}
            onOpenChange={(value) => {
              setOpenDialogHutang(value);
              if (!value) {
                setSelectedHutang(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <button
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
                onClick={() => setSelectedHutang(null)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Data Hutang
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedHutang ? "Edit Data Hutang" : "Tambah Data Hutang"}
                </DialogTitle>
              </DialogHeader>

              <HutangForm
                onSubmit={handleSubmitHutang}
                isEditMode={Boolean(selectedHutang)}
                editData={selectedHutang ?? undefined}
              />
            </DialogContent>
          </Dialog>
        </div>

        {showHutang && (
          <div className="mt-2 p-4 border rounded bg-white">
            {loading ? (
              isOnline ? (
                <SkeletonLib />
              ) : (
                <p className="text-red-500 italic">Tidak ada koneksi internet.</p>
              )
            ) : dataHutang.length === 0 ? (
              <p className="text-gray-500 italic">Belum ada data hutang.</p>
            ) : (
              <table className="w-full mt-3 text-sm border table-fixed">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 w-[120px]">Nama Kreditur</th>
                    <th className="border px-2 py-1 w-[160px]">Keterangan</th>
                    <th className="border px-2 py-1 w-[140px]">Tanggal Pinjam</th>
                    <th className="border px-2 py-1 w-[140px]">Tanggal Kembali</th>
                    <th className="border px-2 py-1 w-[120px]">Nominal</th>
                    <th className="border px-2 py-1 w-[80px] text-center"></th>
                  </tr>
                </thead>

                <tbody>
                  {dataHutang.map((hutang) => (
                    <tr key={hutang.id}>
                      <td className="border px-2 py-1 truncate">
                        {hutang.namaKreditur}
                      </td>
                      <td className="border px-2 py-1 truncate">
                        {hutang.keteranganPinjam}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {formatDateLong(hutang.tglPinjam)}
                      </td>
                      <td className="border px-2 py-1 text-center">
                        {formatDateLong(hutang.tglKembali)}
                      </td>
                      <td className="border px-2 py-1">
                        <div className="flex justify-between w-full">
                          <span>Rp</span>
                          <span className="text-right w-full">
                            {hutang.nominalPinjam.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </td>
                      <td className="border px-2 py-1 text-center space-x-1">
                        <button
                          className="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 p-1 rounded-md inline-flex items-center justify-center shadow"
                          title="Edit Hutang"
                          onClick={() => {
                            setSelectedHutang(hutang);
                            setOpenDialogHutang(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          className="bg-red-100 text-red-600 hover:bg-red-200 p-1 rounded-md inline-flex items-center justify-center shadow"
                          title="Hapus Hutang"
                          onClick={() => {
                            setSelectedDeleteHutang(hutang);
                            setShowConfirmHutang(true);
                          }}
                        >
                          <Trash className="w-4 h-4" />
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
                          {dataHutang
                            .reduce((acc, item) => acc + item.nominalPinjam, 0)
                            .toLocaleString("id-ID")}
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <button
          onClick={() => setShowPiutang((prev) => !prev)}
          className="w-full bg-gray-100 px-4 py-2 rounded flex justify-between items-center text-left font-semibold mb-4"
        >
          <span>Piutang</span>
          {showPiutang ? <ChevronUp /> : <ChevronDown />}
        </button>

        <div className="flex items-center justify-between">
          <div />
          <Dialog
            open={openDialogPiutang}
            onOpenChange={(value) => {
              setOpenDialogPiutang(value);
              if (!value) {
                setSelectedPiutang(null);
              }
            }}
          >
            <DialogTrigger asChild>
              <button
                className="bg-blue-600 text-white text-sm px-4 py-2 rounded flex flex-row items-center hover:bg-blue-700 transition"
                onClick={() => setSelectedPiutang(null)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Tambah Data Piutang
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedPiutang ? "Edit Data Piutang" : "Tambah Data Piutang"}
                </DialogTitle>
              </DialogHeader>

              <PiutangForm
                onSubmit={handleSubmitPiutang}
                isEditMode={Boolean(selectedPiutang)}
                editData={selectedPiutang ?? undefined}
                usedDanaPribadiList={usedDanaPribadiList}
                usedLimitList={usedLimitList}
              />
            </DialogContent>
          </Dialog>
        </div>

        {showPiutang && (
          <div className="mt-2 p-4 border rounded bg-white">
            <div className="flex mb-4">
              {(["uang_pribadi", "limit_paylater"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setPiutangTab(tab)}
                  className={`px-4 py-2 border ${
                    tab === "uang_pribadi" ? "rounded-l" : "rounded-r"
                  } ${
                    piutangTab === tab
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tab === "uang_pribadi" ? "Uang Pribadi" : "Limit Pay Later"}
                </button>
              ))}
            </div>

            <div className="flex flex-col items-center gap-1 mb-4">
              <button className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {userEmail.charAt(0).toUpperCase()}
              </button>
              <p className="text-sm font-medium text-gray-800">{userEmail}</p>
            </div>

            {loading ? (
              isOnline ? (
                <SkeletonLib />
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
                    ? piutang.itemsDana.reduce(
                        (sum, item) => sum + item.nominalPinjam,
                        0
                      )
                    : piutang.itemsLimit.reduce(
                        (sum, item) => sum + item.nominalLimit,
                        0
                      );

                  return (
                    <div key={piutang.id} className="border rounded p-4 shadow">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {piutang.namaDebitur}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {isDana ? "Platform Dana" : "Platform Pay Later"}:{" "}
                            {platform || "-"}
                          </p>
                          {!isDana ? (
                            <p className="text-sm text-gray-600">
                              Pembukuan: Tanggal {piutang.pembukuan} - Jatuh
                              Tempo: Tanggal {piutang.jatuhTempo}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex gap-2">
                          <button
                            className="bg-yellow-100 text-yellow-600 hover:bg-yellow-200 p-1 rounded-md inline-flex items-center justify-center shadow"
                            title="Edit Piutang"
                            onClick={() => {
                              setSelectedPiutang(piutang);
                              setOpenDialogPiutang(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            className="bg-red-100 text-red-600 hover:bg-red-200 p-1 rounded-md inline-flex items-center justify-center shadow"
                            title="Hapus Piutang"
                            onClick={() => {
                              setSelectedDeletePiutang(piutang);
                              setShowConfirmPiutang(true);
                            }}
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {isDana ? (
                        <table className="w-full text-sm border table-fixed">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border px-2 py-1 w-[180px]">
                                Keterangan
                              </th>
                              <th className="border px-2 py-1 w-[140px]">
                                Tanggal Pinjam
                              </th>
                              <th className="border px-2 py-1 w-[140px]">
                                Tanggal Kembali
                              </th>
                              <th className="border px-2 py-1 w-[100px]">
                                Bunga
                              </th>
                              <th className="border px-2 py-1 w-[140px]">
                                Nominal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {piutang.itemsDana.map((item, index) => (
                              <tr key={index}>
                                <td className="border px-2 py-1">
                                  {item.keteranganPinjam}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {formatDateLong(item.tglPinjam)}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {formatDateLong(item.tglKembali)}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {item.bungaPinjam ? `${item.bungaPinjam}%` : "-"}
                                </td>
                                <td className="border px-2 py-1 text-right">
                                  Rp {formatRupiah(item.nominalPinjam)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 font-semibold">
                              <td colSpan={4} className="text-right px-2 py-1 border">
                                Total Pokok
                              </td>
                              <td className="border px-2 py-1 text-right">
                                Rp {formatRupiah(totalNominal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <table className="w-full text-sm border table-fixed">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="border px-2 py-1 w-[180px]">
                                Keterangan
                              </th>
                              <th className="border px-2 py-1 w-[140px]">
                                Awal Transaksi
                              </th>
                              <th className="border px-2 py-1 w-[100px]">
                                Tenor
                              </th>
                              <th className="border px-2 py-1 w-[180px]">
                                Rentang Tagihan
                              </th>
                              <th className="border px-2 py-1 w-[140px]">
                                Nominal
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {piutang.itemsLimit.map((item, index) => (
                              <tr key={index}>
                                <td className="border px-2 py-1">
                                  {item.keteranganLimit}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {formatDateLong(item.tanggalAwal)}
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {item.tenor} bulan
                                </td>
                                <td className="border px-2 py-1 text-center">
                                  {formatDateLong(item.tanggalMulai)} -{" "}
                                  {formatDateLong(item.tanggalSelesai)}
                                </td>
                                <td className="border px-2 py-1 text-right">
                                  Rp {formatRupiah(item.nominalLimit)}
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-gray-100 font-semibold">
                              <td colSpan={4} className="text-right px-2 py-1 border">
                                Total Nominal
                              </td>
                              <td className="border px-2 py-1 text-right">
                                Rp {formatRupiah(totalNominal)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

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
    </Layout>
  );
};

export default HutangPiutang;
