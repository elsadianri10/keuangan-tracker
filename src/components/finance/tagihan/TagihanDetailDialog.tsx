"use client";

import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { formatDateLong, formatRupiah, parseRupiah } from "@/lib/formatUniversal";
import { updateTagihanItemInstallments } from "@/services/tagihanService";
import { TagihanAkun, TagihanInstallment, TagihanItem } from "@/types/tagihan";
import BaseModal from "../shared/BaseModal";
import { ConfirmModal, WarningModal } from "../shared/ModalDialog";

type TagihanDetailDialogProps = {
  open: boolean;
  onClose: () => void;
  akun: TagihanAkun;
  item: TagihanItem;
  onSaved?: (item: TagihanItem) => void;
};

export default function TagihanDetailDialog(props: TagihanDetailDialogProps) {
  const itemKey = `${props.item.id ?? props.item.keterangan}-${props.item.tenor}-${props.item.nominal}`;

  return <TagihanDetailDialogBody key={itemKey} {...props} />;
}

function TagihanDetailDialogBody({
  open,
  onClose,
  akun,
  item,
  onSaved,
}: TagihanDetailDialogProps) {
  const tenor = useMemo(() => parseInt(item.tenor, 10), [item.tenor]);
  const [installments, setInstallments] = useState<TagihanInstallment[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("Ceklis tidak dapat diubah!");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInstallments(
      item.installments.length > 0
        ? item.installments
        : Array.from({ length: tenor }, (_, index) => ({
            cicilanKe: index + 1,
            nominal: item.nominal,
            isPaid: false,
            paidAt: null,
          }))
    );
  }, [item.installments, item.nominal, tenor]);

  const totalAkhir = installments.reduce((sum, installment) => sum + installment.nominal, 0);
  const sisaCicilan = installments.reduce(
    (sum, installment) => sum + (!installment.isPaid ? installment.nominal : 0),
    0
  );

  const handleNominalChange = (index: number, value: string) => {
    const newVal = parseRupiah(value);
    setInstallments((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        nominal: newVal,
      };
      return updated;
    });
  };

  const handleCheck = (index: number) => {
    if (installments[index]?.isPaid) {
      setWarningMessage("Cicilan yang sudah dicentang tidak dapat dibatalkan.");
      setShowWarning(true);
      return;
    }

    if (index > 0 && !installments[index - 1]?.isPaid) {
      setWarningMessage(
        `Cicilan ke-${index} harus dibayar lebih dulu sebelum mencentang cicilan ke-${
          index + 1
        }.`
      );
      setShowWarning(true);
      return;
    }

    setSelectedIndex(index);
    setShowConfirm(true);
  };

  const persistInstallments = async (nextInstallments: TagihanInstallment[]) => {
    const user = auth.currentUser;
    if (!user || !item.id) return;

    setSaving(true);
    try {
      const updated = await updateTagihanItemInstallments(
        user.uid,
        item.id,
        nextInstallments,
        user.email
      );
      setInstallments(updated.installments);
      onSaved?.(updated);
    } catch (error) {
      console.error("Gagal menyimpan detail cicilan:", error);
      setWarningMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan perubahan detail cicilan."
      );
      setShowWarning(true);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (selectedIndex === null) return;

    const nextInstallments = installments.map((installment, index) =>
      index === selectedIndex
        ? {
            ...installment,
            isPaid: true,
            paidAt: installment.paidAt ?? new Date(),
          }
        : installment
    );

    await persistInstallments(nextInstallments);
    setShowConfirm(false);
    setSelectedIndex(null);
  };

  const handleSave = async () => {
    if (installments.some((installment) => installment.nominal <= 0)) {
      setWarningMessage("Semua nominal cicilan harus lebih besar dari 0.");
      setShowWarning(true);
      return;
    }

    await persistInstallments(installments);
  };

  return (
    <>
      <BaseModal
        open={open}
        onClose={onClose}
        title="Detail Tagihan"
        maxWidthClassName="max-w-4xl"
      >
        <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {akun.namaAkun === "Lainnya" ? akun.customAkun : akun.namaAkun}
          </div>
          <div>
            Pembukuan: Setiap Tanggal {akun.pembukuan} - Jatuh Tempo: Setiap
            Tanggal {akun.jatuhTempo}
          </div>
          <div className="italic text-gray-600 dark:text-gray-400">
            {item.keterangan}
          </div>
          <div>
            Rentang Cicilan: {formatDateLong(item.bulanCicilanPertama)} -{" "}
            {formatDateLong(item.bulanCicilanTerakhir)}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border text-sm dark:border-gray-800">
            <thead>
              <tr className="bg-gray-100 dark:bg-white/5">
                <th className="border px-2 py-1 dark:border-gray-800">Tenor</th>
                <th className="border px-2 py-1 dark:border-gray-800">Nominal</th>
                <th className="border px-2 py-1 text-center dark:border-gray-800">
                  Check
                </th>
              </tr>
            </thead>

            <tbody>
              {installments.map((installment, index) => (
                <tr key={index}>
                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                    Cicilan ke-{index + 1}
                  </td>
                  <td className="border px-2 py-1 dark:border-gray-800">
                    <input
                      type="text"
                      value={installment.nominal ? `Rp ${formatRupiah(installment.nominal)}` : ""}
                      onChange={(e) => handleNominalChange(index, e.target.value)}
                      disabled={saving || installment.isPaid}
                      className="w-full rounded-lg border px-2 py-1 text-right disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:disabled:bg-gray-900/60 dark:disabled:text-gray-400"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center dark:border-gray-800">
                    <input
                      type="checkbox"
                      checked={installment.isPaid}
                      disabled={saving || (index > 0 && !installments[index - 1]?.isPaid)}
                      onChange={() => handleCheck(index)}
                    />
                  </td>
                </tr>
              ))}

              <tr className="bg-gray-100 font-semibold dark:bg-white/5">
                <td className="border px-2 py-1 text-center dark:border-gray-800">
                  Total Akhir
                </td>
                <td className="border px-2 py-1 text-right dark:border-gray-800">
                  Rp {totalAkhir.toLocaleString("id-ID")}
                </td>
                <td className="border px-2 py-1 text-center dark:border-gray-800">
                  -
                </td>
              </tr>
              <tr className="bg-gray-100 font-semibold dark:bg-white/5">
                <td className="border px-2 py-1 text-center dark:border-gray-800">
                  Sisa Cicilan
                </td>
                <td className="border px-2 py-1 text-center dark:border-gray-800">
                  -
                </td>
                <td className="border px-2 py-1 text-center dark:border-gray-800">
                  Rp {sisaCicilan.toLocaleString("id-ID")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </BaseModal>

      <ConfirmModal
        show={showConfirm}
        message="Apakah Anda yakin ingin menceklis ini?"
        subMessage="Sekali ceklis, tidak dapat diubah kembali"
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <WarningModal
        show={showWarning}
        message={warningMessage}
        onClose={() => setShowWarning(false)}
      />
    </>
  );
}
