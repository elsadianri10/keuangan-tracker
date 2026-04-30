import React, { useState, useEffect } from "react";
import { TagihanAkun, TagihanItem } from "../../models/tagihan";
import {
  Dialog,
  // DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../assets/components/ui/dialog";
import { ConfirmModal , WarningModal } from "../../utils/ModalDialog";

type DialogDetailTagihanProps = {
  open: boolean;
  onClose: (val: boolean) => void;
  akun: TagihanAkun;
  item: TagihanItem;
};

export default function DialogDetailTagihan({
  open,
  onClose,
  akun,
  item,
}: DialogDetailTagihanProps) {
  // const [editCounts, setEditCounts] = useState<Record<number, number>>({});
  const [nominals, setNominals] = useState<number[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const totalAkhir = nominals.reduce((sum, val) => sum + val, 0);
  const sisaCicilan = nominals.reduce(
    (sum, val, i) => sum + (!checked[i] ? val : 0),
    0
  );

  useEffect(() => {
    if (item) {
      const initialNominal = item.nominal;
      const tenor = parseInt(item.tenor);
      setNominals(Array(tenor).fill(initialNominal));
      setChecked(Array(tenor).fill(false));
      // setEditCounts({});
    }
  }, [item]);

  const handleNominalChange = (index: number, value: string) => {
    const newVal = parseInt(value.replace(/[^0-9]/g, "")) || 0;
    // if ((editCounts[index] || 0) >= 3) {
    //   alert("Maksimal edit hanya 3x untuk tiap cicilan!");
    //   return;
    // }
    const updatedNominals = [...nominals];
    updatedNominals[index] = newVal;
    setNominals(updatedNominals);

    // setEditCounts((prev) => ({
    //   ...prev,
    //   [index]: (prev[index] || 0) + 1,
    // }));
  };

  const handleCheck = (index: number) => {
    if (checked[index]) {
      setShowWarning(true);
      return;
    }
    setSelectedIndex(index);
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    if (selectedIndex === null) return;

    setChecked((prev) => {
      const newChecked = [...prev];
      newChecked[selectedIndex] = true;
      return newChecked;
    });

    setShowConfirm(false);
    setSelectedIndex(null); // ✅ Reset setelah submit
  };

  if (!akun || !item) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-screen overflow-y-auto">
        <DialogHeader>

          {/* TITLE */}
          <DialogTitle>Detail Tagihan</DialogTitle>
          <div className="mt-2 space-y-1 text-sm text-gray-700">
            <div className="font-semibold text-lg">
              {akun.namaAkun === "Lainnya" ? akun.customAkun : akun.namaAkun}
            </div>

            {/* Sub Title - Tanggal Pembukuan & Jatuh Tempo */}
            <div>
              Pembukuan: Setiap Tanggal {akun.pembukuan} - Jatuh Tempo: Setiap
              Tanggal {akun.jatuhTempo}
            </div>

            {/* Sub Title - Keterangan Tagihan */}
            <div className="italic text-gray-600">{item.keterangan}</div>

            {/* Sub Title - Rentang Cicilan */}
            <div>
              Rentang Cicilan:{" "}
              {new Date(item.bulanCicilanPertama).toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}{" "}
              -{" "}
              {new Date(item.bulanCicilanTerakhir).toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
        </DialogHeader>

        {/* TABLE STARTS HERE */}
        <div className="mt-4">
          <table className="w-full border text-sm">
            {/* Column Head */}
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1 w-[120px]">Tenor</th>
                <th className="border px-2 py-1 w-[80px]">Nominal</th>
                <th className="border px-2 py-1 w-[60px] text-center">Check</th>
              </tr>
            </thead>

            <tbody>
              {nominals.map((nominal, i) => (
                <tr key={i}>
                  {/* Column Isi - Isi Tahap Cicilan */}
                  <td className="border px-2 py-1 text-center">
                    Cicilan ke-{i + 1}
                  </td>
                  {/* Column Isi - Nominal Cicilan */}
                  <td className="border px-2 py-1 text-right">
                    <input
                      type="text"
                      value={"Rp " + nominal.toLocaleString("id-ID")}
                      onChange={(e) => handleNominalChange(i, e.target.value)}
                      className="border px-2 py-1 rounded w-full text-right"
                    />
                  </td>

                  {/* Column Isi, Checkbox - Status */}
                  <td className="border px-2 py-1 text-center">
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => handleCheck(i)}
                    />
                    {/* Modal Konfirmasi */}
                    {showConfirm && selectedIndex !== null && (
                      <ConfirmModal
                        show={showConfirm}
                        message="Apakah Anda yakin ingin menceklis ini?"
                        subMessage="Sekali ceklis, tidak dapat diubah kembali"
                        onClose={() => setShowConfirm(false)}
                        onConfirm={handleConfirmSubmit}
                      />
                    )}

                    {/* Modal Peringatan */}
                    <WarningModal
                      show={showWarning}
                      message="Ceklis tidak dapat diubah!"
                      onClose={() => setShowWarning(false)}
                    />
                  </td>
                </tr>
              ))}

              {/* Row untuk Label Total Akhir & Sisa Cicilan */}
              {/* Row - Total Akhir */}
              <tr className="bg-gray-100 font-semibold">
                <td className="border px-2 py-1 text-center">Total Akhir</td>
                <td className="border px-2 py-1 text-right">
                  Rp {totalAkhir.toLocaleString("id-ID")}
                </td>
                <td className="border px-2 py-1 text-center">-</td>
              </tr>

              {/* Row - Sisa Cicilan */}
              <tr className="bg-gray-100 font-semibold">
                <td className="border px-2 py-1 text-center">Sisa Cicilan</td>
                <td className="border px-2 py-1 text-right">-</td>
                <td className="border px-2 py-1 text-center">
                  Rp {sisaCicilan.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}