export interface Hutang {
  id?: string;
  namaKreditur: string;
  keteranganPinjam: string;
  tglPinjam: Date;
  tglKembali: Date;
  nominalPinjam: number;
  createdAt: Date;
}

export interface Piutang {
  id?: string;
  namaDebitur: string;
  jenisPiutang: "Dana Pribadi" | "Limit Pay Later" ;
  asalDana: string;
  customDana?: string;
  asalLimit: string;
  customLimit?: string;
  pembukuan: number;
  jatuhTempo: number;
  createdAt: Date;
  itemsDana: DanaItems[];
  itemsLimit: LimitItems[];
}

export interface DanaItems {
  id?: string;
  keteranganPinjam: string;
  tglPinjam: Date;
  tglKembali: Date;
  nominalPinjam: number;
  bungaPinjam?: number;
}

export interface LimitItems {
  id?: string;
  keteranganLimit: string;
  tanggalAwal : Date;
  tenor: string;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  nominalLimit: number;
}