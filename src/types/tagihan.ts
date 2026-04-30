export interface TagihanInstallment {
  id?: string;
  cicilanKe: number;
  nominal: number;
  isPaid: boolean;
  paidAt?: Date | null;
}

export interface TagihanAkun {
  id?: string;
  namaAkun: string;
  customAkun?: string;
  pembukuan: number;
  jatuhTempo: number;
  biayaAdmin?: number;
  createdAt: Date;
  items: TagihanItem[];
}

export interface TagihanItem {
  id?: string;
  keterangan: string;
  tenor: string;
  bulanCicilanPertama: Date;
  bulanCicilanTerakhir: Date;
  nominal: number;
  installments: TagihanInstallment[];
}
