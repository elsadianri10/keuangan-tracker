import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { mysqlPool } from "@/lib/mysql";
import { DanaItems, Hutang, LimitItems, Piutang } from "@/types/hutangPiutang";

type HutangInput = Omit<Hutang, "id"> & {
  createdAt?: Date | string;
};

type PiutangInput = Omit<Piutang, "id"> & {
  createdAt?: Date | string;
};

type UserRow = RowDataPacket & {
  id: number;
  email: string;
};

type HutangRow = RowDataPacket & {
  id: number;
  nama_kreditur: string;
  keterangan_pinjam: string;
  tgl_pinjam: Date | string;
  tgl_kembali: Date | string;
  nominal_pinjam: number;
  created_at: Date | string;
};

type PiutangRow = RowDataPacket & {
  id: number;
  nama_debitur: string;
  jenis_piutang: "DANA_PRIBADI" | "LIMIT_PAY_LATER";
  asal_dana: string | null;
  custom_dana: string | null;
  asal_limit: string | null;
  custom_limit: string | null;
  pembukuan: number | null;
  jatuh_tempo: number | null;
  created_at: Date | string;
};

type DanaItemRow = RowDataPacket & {
  id: number;
  piutang_id: number;
  keterangan_pinjam: string;
  tgl_pinjam: Date | string;
  tgl_kembali: Date | string;
  nominal_pinjam: number;
  bunga_pinjam: number | null;
};

type LimitItemRow = RowDataPacket & {
  id: number;
  piutang_id: number;
  keterangan_limit: string;
  tanggal_awal: Date | string;
  tenor: number;
  tanggal_mulai: Date | string;
  tanggal_selesai: Date | string;
  nominal_limit: number;
};

const normalizeDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const toNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const toDbJenisPiutang = (value: Piutang["jenisPiutang"]) =>
  value === "Limit Pay Later" ? "LIMIT_PAY_LATER" : "DANA_PRIBADI";

const fromDbJenisPiutang = (
  value: PiutangRow["jenis_piutang"]
): Piutang["jenisPiutang"] =>
  value === "LIMIT_PAY_LATER" ? "Limit Pay Later" : "Dana Pribadi";

const mapDanaItems = (piutangId: number, rows: DanaItemRow[]): DanaItems[] =>
  rows
    .filter((item) => item.piutang_id === piutangId)
    .map((item) => ({
      id: String(item.id),
      keteranganPinjam: item.keterangan_pinjam,
      tglPinjam: normalizeDate(item.tgl_pinjam),
      tglKembali: normalizeDate(item.tgl_kembali),
      nominalPinjam: Number(item.nominal_pinjam),
      bungaPinjam: item.bunga_pinjam ?? undefined,
    }));

const mapLimitItems = (
  piutangId: number,
  rows: LimitItemRow[]
): LimitItems[] =>
  rows
    .filter((item) => item.piutang_id === piutangId)
    .map((item) => ({
      id: String(item.id),
      keteranganLimit: item.keterangan_limit,
      tanggalAwal: normalizeDate(item.tanggal_awal),
      tenor: String(item.tenor),
      tanggalMulai: normalizeDate(item.tanggal_mulai),
      tanggalSelesai: normalizeDate(item.tanggal_selesai),
      nominalLimit: Number(item.nominal_limit),
    }));

const mapHutang = (row: HutangRow): Hutang => ({
  id: String(row.id),
  namaKreditur: row.nama_kreditur,
  keteranganPinjam: row.keterangan_pinjam,
  tglPinjam: normalizeDate(row.tgl_pinjam),
  tglKembali: normalizeDate(row.tgl_kembali),
  nominalPinjam: Number(row.nominal_pinjam),
  createdAt: normalizeDate(row.created_at),
});

const mapPiutang = (
  row: PiutangRow,
  danaRows: DanaItemRow[],
  limitRows: LimitItemRow[]
): Piutang => ({
  id: String(row.id),
  namaDebitur: row.nama_debitur,
  jenisPiutang: fromDbJenisPiutang(row.jenis_piutang),
  asalDana: row.asal_dana ?? "",
  customDana: row.custom_dana ?? "",
  asalLimit: row.asal_limit ?? "",
  customLimit: row.custom_limit ?? "",
  pembukuan: row.pembukuan ?? 0,
  jatuhTempo: row.jatuh_tempo ?? 0,
  createdAt: normalizeDate(row.created_at),
  itemsDana: mapDanaItems(row.id, danaRows),
  itemsLimit: mapLimitItems(row.id, limitRows),
});

const ensureUser = async (
  firebaseUid: string,
  email?: string | null,
  connection?: PoolConnection
) => {
  const executor = connection ?? mysqlPool;
  const [userRows] = await executor.execute<UserRow[]>(
    "SELECT id, email FROM users WHERE firebase_uid = ? LIMIT 1",
    [firebaseUid]
  );

  if (userRows.length > 0) {
    const user = userRows[0];

    if (email && user.email !== email) {
      await executor.execute(
        "UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [email, user.id]
      );
    }

    return user.id;
  }

  if (!email) {
    throw new Error("Email user dibutuhkan untuk membuat data pengguna MySQL.");
  }

  const displayName = email.split("@")[0] || "Finance Tracker User";
  const [result] = await executor.execute<ResultSetHeader>(
    `INSERT INTO users (firebase_uid, email, display_name)
     VALUES (?, ?, ?)`,
    [firebaseUid, email, displayName]
  );

  return result.insertId;
};

const insertPiutangDanaItems = async (
  connection: PoolConnection,
  piutangId: number,
  items: DanaItems[]
) => {
  for (const item of items) {
    await connection.execute(
      `INSERT INTO piutang_dana_items (
        piutang_id,
        keterangan_pinjam,
        tgl_pinjam,
        tgl_kembali,
        nominal_pinjam,
        bunga_pinjam
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        piutangId,
        item.keteranganPinjam,
        item.tglPinjam,
        item.tglKembali,
        item.nominalPinjam,
        item.bungaPinjam ?? null,
      ]
    );
  }
};

const insertPiutangLimitItems = async (
  connection: PoolConnection,
  piutangId: number,
  items: LimitItems[]
) => {
  for (const item of items) {
    await connection.execute(
      `INSERT INTO piutang_limit_items (
        piutang_id,
        keterangan_limit,
        tanggal_awal,
        tenor,
        tanggal_mulai,
        tanggal_selesai,
        nominal_limit
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        piutangId,
        item.keteranganLimit,
        item.tanggalAwal,
        Number.parseInt(item.tenor, 10),
        item.tanggalMulai,
        item.tanggalSelesai,
        item.nominalLimit,
      ]
    );
  }
};

export const getHutangByFirebaseUid = async (
  firebaseUid: string,
  email?: string | null
) => {
  const userId = await ensureUser(firebaseUid, email);
  const [rows] = await mysqlPool.execute<HutangRow[]>(
    `SELECT id, nama_kreditur, keterangan_pinjam, tgl_pinjam, tgl_kembali, nominal_pinjam, created_at
     FROM hutang
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );

  return rows.map(mapHutang);
};

export const createHutangForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  payload: HutangInput
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    const createdAt = payload.createdAt
      ? normalizeDate(payload.createdAt)
      : new Date();

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO hutang (
        user_id,
        nama_kreditur,
        keterangan_pinjam,
        tgl_pinjam,
        tgl_kembali,
        nominal_pinjam,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        payload.namaKreditur,
        payload.keteranganPinjam,
        payload.tglPinjam,
        payload.tglKembali,
        payload.nominalPinjam,
        createdAt,
      ]
    );

    await connection.commit();

    return {
      id: String(result.insertId),
      ...payload,
      createdAt,
    } satisfies Hutang;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateHutangForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  hutangId: number,
  data: Partial<Omit<Hutang, "id">>
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM hutang WHERE id = ? AND user_id = ? LIMIT 1",
      [hutangId, userId]
    );

    if (rows.length === 0) {
      throw new Error("Data hutang tidak ditemukan.");
    }

    if (
      !data.namaKreditur ||
      !data.keteranganPinjam ||
      !data.tglPinjam ||
      !data.tglKembali ||
      typeof data.nominalPinjam !== "number"
    ) {
      throw new Error("Data update hutang tidak lengkap.");
    }

    await connection.execute(
      `UPDATE hutang
       SET nama_kreditur = ?, keterangan_pinjam = ?, tgl_pinjam = ?, tgl_kembali = ?, nominal_pinjam = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        data.namaKreditur,
        data.keteranganPinjam,
        normalizeDate(data.tglPinjam),
        normalizeDate(data.tglKembali),
        data.nominalPinjam,
        hutangId,
        userId,
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteHutangForFirebaseUser = async (
  firebaseUid: string,
  hutangId: number
) => {
  const userId = await ensureUser(firebaseUid);
  const [result] = await mysqlPool.execute<ResultSetHeader>(
    "DELETE FROM hutang WHERE id = ? AND user_id = ?",
    [hutangId, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data hutang tidak ditemukan.");
  }
};

export const getPiutangByFirebaseUid = async (
  firebaseUid: string,
  email?: string | null
) => {
  const userId = await ensureUser(firebaseUid, email);
  const [piutangRows] = await mysqlPool.execute<PiutangRow[]>(
    `SELECT id, nama_debitur, jenis_piutang, asal_dana, custom_dana, asal_limit, custom_limit, pembukuan, jatuh_tempo, created_at
     FROM piutang
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );

  if (piutangRows.length === 0) {
    return [];
  }

  const placeholders = piutangRows.map(() => "?").join(", ");
  const ids = piutangRows.map((row) => row.id);
  const [danaRows] = await mysqlPool.execute<DanaItemRow[]>(
    `SELECT id, piutang_id, keterangan_pinjam, tgl_pinjam, tgl_kembali, nominal_pinjam, bunga_pinjam
     FROM piutang_dana_items
     WHERE piutang_id IN (${placeholders})
     ORDER BY id ASC`,
    ids
  );
  const [limitRows] = await mysqlPool.execute<LimitItemRow[]>(
    `SELECT id, piutang_id, keterangan_limit, tanggal_awal, tenor, tanggal_mulai, tanggal_selesai, nominal_limit
     FROM piutang_limit_items
     WHERE piutang_id IN (${placeholders})
     ORDER BY id ASC`,
    ids
  );

  return piutangRows.map((row) => mapPiutang(row, danaRows, limitRows));
};

export const createPiutangForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  payload: PiutangInput
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    const createdAt = payload.createdAt
      ? normalizeDate(payload.createdAt)
      : new Date();

    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO piutang (
        user_id,
        nama_debitur,
        jenis_piutang,
        asal_dana,
        custom_dana,
        asal_limit,
        custom_limit,
        pembukuan,
        jatuh_tempo,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        payload.namaDebitur,
        toDbJenisPiutang(payload.jenisPiutang),
        payload.jenisPiutang === "Dana Pribadi"
          ? toNullableString(payload.asalDana)
          : null,
        payload.jenisPiutang === "Dana Pribadi"
          ? toNullableString(payload.customDana)
          : null,
        payload.jenisPiutang === "Limit Pay Later"
          ? toNullableString(payload.asalLimit)
          : null,
        payload.jenisPiutang === "Limit Pay Later"
          ? toNullableString(payload.customLimit)
          : null,
        payload.jenisPiutang === "Limit Pay Later" ? payload.pembukuan : null,
        payload.jenisPiutang === "Limit Pay Later" ? payload.jatuhTempo : null,
        createdAt,
      ]
    );

    if (payload.jenisPiutang === "Dana Pribadi") {
      await insertPiutangDanaItems(connection, result.insertId, payload.itemsDana);
    } else {
      await insertPiutangLimitItems(
        connection,
        result.insertId,
        payload.itemsLimit
      );
    }

    await connection.commit();

    return {
      id: String(result.insertId),
      ...payload,
      createdAt,
    } satisfies Piutang;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updatePiutangForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  piutangId: number,
  data: Partial<Omit<Piutang, "id">>
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM piutang WHERE id = ? AND user_id = ? LIMIT 1",
      [piutangId, userId]
    );

    if (rows.length === 0) {
      throw new Error("Data piutang tidak ditemukan.");
    }

    if (!data.namaDebitur || !data.jenisPiutang) {
      throw new Error("Data update piutang tidak lengkap.");
    }

    await connection.execute(
      `UPDATE piutang
       SET nama_debitur = ?, jenis_piutang = ?, asal_dana = ?, custom_dana = ?, asal_limit = ?, custom_limit = ?, pembukuan = ?, jatuh_tempo = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        data.namaDebitur,
        toDbJenisPiutang(data.jenisPiutang),
        data.jenisPiutang === "Dana Pribadi"
          ? toNullableString(data.asalDana)
          : null,
        data.jenisPiutang === "Dana Pribadi"
          ? toNullableString(data.customDana)
          : null,
        data.jenisPiutang === "Limit Pay Later"
          ? toNullableString(data.asalLimit)
          : null,
        data.jenisPiutang === "Limit Pay Later"
          ? toNullableString(data.customLimit)
          : null,
        data.jenisPiutang === "Limit Pay Later" ? data.pembukuan ?? null : null,
        data.jenisPiutang === "Limit Pay Later" ? data.jatuhTempo ?? null : null,
        piutangId,
        userId,
      ]
    );

    await connection.execute("DELETE FROM piutang_dana_items WHERE piutang_id = ?", [
      piutangId,
    ]);
    await connection.execute(
      "DELETE FROM piutang_limit_items WHERE piutang_id = ?",
      [piutangId]
    );

    if (data.jenisPiutang === "Dana Pribadi") {
      await insertPiutangDanaItems(
        connection,
        piutangId,
        data.itemsDana ?? []
      );
    } else {
      await insertPiutangLimitItems(
        connection,
        piutangId,
        data.itemsLimit ?? []
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deletePiutangForFirebaseUser = async (
  firebaseUid: string,
  piutangId: number
) => {
  const userId = await ensureUser(firebaseUid);
  const [result] = await mysqlPool.execute<ResultSetHeader>(
    "DELETE FROM piutang WHERE id = ? AND user_id = ?",
    [piutangId, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data piutang tidak ditemukan.");
  }
};
