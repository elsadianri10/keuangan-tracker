import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { mysqlPool } from "@/lib/mysql";
import {
  TagihanAkun,
  TagihanInstallment,
  TagihanItem,
} from "@/types/tagihan";

type TagihanInput = Omit<TagihanAkun, "id" | "createdAt"> & {
  createdAt?: Date | string;
};

type UserRow = RowDataPacket & {
  id: number;
  email: string;
};

type TagihanRow = RowDataPacket & {
  id: number;
  nama_akun: string;
  custom_akun: string | null;
  pembukuan: number;
  jatuh_tempo: number;
  biaya_admin: number | null;
  created_at: Date | string;
};

type TagihanItemRow = RowDataPacket & {
  id: number;
  tagihan_id: number;
  keterangan: string;
  tenor: number;
  bulan_cicilan_pertama: Date | string;
  bulan_cicilan_terakhir: Date | string;
  nominal: number;
};

type TagihanInstallmentRow = RowDataPacket & {
  id: number;
  tagihan_item_id: number;
  installment_number: number;
  nominal: number;
  is_paid: number;
  paid_at: Date | string | null;
};

let tagihanInstallmentsTableReady: Promise<void> | null = null;

const normalizeDate = (value: Date | string) =>
  value instanceof Date ? value : new Date(value);

const toNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const buildDefaultInstallments = (item: Pick<TagihanItem, "tenor" | "nominal">) => {
  const tenor = Number.parseInt(item.tenor, 10);

  return Array.from({ length: tenor }, (_, index) => ({
    cicilanKe: index + 1,
    nominal: item.nominal,
    isPaid: false,
    paidAt: null,
  })) satisfies Omit<TagihanInstallment, "id">[];
};

const ensureTagihanInstallmentsTable = () => {
  if (!tagihanInstallmentsTableReady) {
    tagihanInstallmentsTableReady = mysqlPool
      .execute(
        `CREATE TABLE IF NOT EXISTS tagihan_item_installments (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          tagihan_item_id BIGINT UNSIGNED NOT NULL,
          installment_number INT UNSIGNED NOT NULL,
          nominal DECIMAL(15,2) NOT NULL,
          is_paid TINYINT(1) NOT NULL DEFAULT 0,
          paid_at DATETIME DEFAULT NULL,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_tagihan_installment_item_number (tagihan_item_id, installment_number),
          CONSTRAINT fk_tagihan_installments_item
            FOREIGN KEY (tagihan_item_id) REFERENCES tagihan_items(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      )
      .then(() =>
        mysqlPool.execute(
          "CREATE INDEX idx_tagihan_installment_item_paid ON tagihan_item_installments (tagihan_item_id, is_paid)"
        )
      )
      .then(() => undefined)
      .catch((error) => {
        if (
          error instanceof Error &&
          "code" in error &&
          error.code === "ER_DUP_KEYNAME"
        ) {
          return;
        }
        throw error;
      });
  }

  return tagihanInstallmentsTableReady;
};

const mapInstallments = (
  tagihanItemId: number,
  rows: TagihanInstallmentRow[]
): TagihanInstallment[] =>
  rows
    .filter((item) => item.tagihan_item_id === tagihanItemId)
    .sort((a, b) => a.installment_number - b.installment_number)
    .map((item) => ({
      id: String(item.id),
      cicilanKe: item.installment_number,
      nominal: Number(item.nominal),
      isPaid: Boolean(item.is_paid),
      paidAt: item.paid_at ? normalizeDate(item.paid_at) : null,
    }));

const mapTagihanItems = (
  tagihanId: number,
  itemRows: TagihanItemRow[],
  installmentRows: TagihanInstallmentRow[]
): TagihanItem[] =>
  itemRows
    .filter((item) => item.tagihan_id === tagihanId)
    .map((item) => ({
      id: String(item.id),
      keterangan: item.keterangan,
      tenor: String(item.tenor),
      bulanCicilanPertama: normalizeDate(item.bulan_cicilan_pertama),
      bulanCicilanTerakhir: normalizeDate(item.bulan_cicilan_terakhir),
      nominal: Number(item.nominal),
      installments: mapInstallments(item.id, installmentRows),
    }));

const mapTagihan = (
  row: TagihanRow,
  itemRows: TagihanItemRow[],
  installmentRows: TagihanInstallmentRow[]
): TagihanAkun => ({
  id: String(row.id),
  namaAkun: row.nama_akun,
  customAkun: row.custom_akun ?? "",
  pembukuan: row.pembukuan,
  jatuhTempo: row.jatuh_tempo,
  biayaAdmin: row.biaya_admin ?? undefined,
  createdAt: normalizeDate(row.created_at),
  items: mapTagihanItems(row.id, itemRows, installmentRows),
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

const insertTagihanItems = async (
  connection: PoolConnection,
  tagihanId: number,
  items: TagihanItem[]
) => {
  for (const item of items) {
    const [result] = await connection.execute<ResultSetHeader>(
      `INSERT INTO tagihan_items (
        tagihan_id,
        keterangan,
        tenor,
        bulan_cicilan_pertama,
        bulan_cicilan_terakhir,
        nominal
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        tagihanId,
        item.keterangan,
        Number.parseInt(item.tenor, 10),
        item.bulanCicilanPertama,
        item.bulanCicilanTerakhir,
        item.nominal,
      ]
    );

    await insertTagihanInstallments(
      connection,
      result.insertId,
      item.installments?.length ? item.installments : buildDefaultInstallments(item)
    );
  }
};

const insertTagihanInstallments = async (
  connection: PoolConnection,
  tagihanItemId: number,
  installments: Array<Omit<TagihanInstallment, "id"> | TagihanInstallment>
) => {
  for (const installment of installments) {
    await connection.execute(
      `INSERT INTO tagihan_item_installments (
        tagihan_item_id,
        installment_number,
        nominal,
        is_paid,
        paid_at
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        tagihanItemId,
        installment.cicilanKe,
        installment.nominal,
        installment.isPaid ? 1 : 0,
        installment.isPaid
          ? installment.paidAt ?? new Date()
          : installment.paidAt ?? null,
      ]
    );
  }
};

const ensureInstallmentsForItems = async (
  connection: PoolConnection,
  items: TagihanItemRow[]
) => {
  if (items.length === 0) return;

  await ensureTagihanInstallmentsTable();

  const placeholders = items.map(() => "?").join(", ");
  const [existingRows] = await connection.execute<TagihanInstallmentRow[]>(
    `SELECT id, tagihan_item_id, installment_number, nominal, is_paid, paid_at
     FROM tagihan_item_installments
     WHERE tagihan_item_id IN (${placeholders})`,
    items.map((item) => item.id)
  );

  for (const item of items) {
    const existingInstallments = existingRows.filter(
      (installment) => installment.tagihan_item_id === item.id
    );
    const existingNumbers = new Set(
      existingInstallments.map((installment) => installment.installment_number)
    );

    for (let cicilanKe = 1; cicilanKe <= item.tenor; cicilanKe += 1) {
      if (existingNumbers.has(cicilanKe)) continue;

      await connection.execute(
        `INSERT INTO tagihan_item_installments (
          tagihan_item_id,
          installment_number,
          nominal,
          is_paid,
          paid_at
        ) VALUES (?, ?, ?, 0, NULL)`,
        [item.id, cicilanKe, item.nominal]
      );
    }
  }
};

const normalizeInstallmentsPayload = (
  installments: TagihanInstallment[]
) =>
  installments
    .map((installment) => ({
      ...installment,
      nominal: Number(installment.nominal),
      paidAt: installment.paidAt ? normalizeDate(installment.paidAt) : null,
    }))
    .sort((a, b) => a.cicilanKe - b.cicilanKe);

const validateInstallmentsSequence = (
  installments: TagihanInstallment[],
  tenor: number,
  existingInstallments?: TagihanInstallment[]
) => {
  if (installments.length !== tenor) {
    throw new Error("Jumlah cicilan tidak sesuai tenor.");
  }

  for (let index = 0; index < installments.length; index += 1) {
    const installment = installments[index];

    if (installment.cicilanKe !== index + 1) {
      throw new Error("Urutan cicilan tidak valid.");
    }

    if (installment.nominal <= 0) {
      throw new Error("Nominal cicilan harus lebih besar dari 0.");
    }

    if (installment.isPaid && index > 0 && !installments[index - 1].isPaid) {
      throw new Error(
        `Cicilan ke-${index} harus dibayar lebih dulu sebelum mencentang cicilan berikutnya.`
      );
    }

    if (existingInstallments?.[index]?.isPaid && !installment.isPaid) {
      throw new Error("Cicilan yang sudah dicentang tidak dapat dibatalkan.");
    }

    if (
      existingInstallments?.[index]?.isPaid &&
      existingInstallments[index].nominal !== installment.nominal
    ) {
      throw new Error(
        `Nominal cicilan ke-${installment.cicilanKe} yang sudah dibayar tidak dapat diubah.`
      );
    }
  }
};

const getTagihanItemById = async (
  connection: PoolConnection,
  userId: number,
  itemId: number
) => {
  const [itemRows] = await connection.execute<TagihanItemRow[]>(
    `SELECT ti.id, ti.tagihan_id, ti.keterangan, ti.tenor, ti.bulan_cicilan_pertama, ti.bulan_cicilan_terakhir, ti.nominal
     FROM tagihan_items ti
     INNER JOIN tagihan t ON t.id = ti.tagihan_id
     WHERE ti.id = ? AND t.user_id = ?
     LIMIT 1`,
    [itemId, userId]
  );

  if (itemRows.length === 0) {
    throw new Error("Detail tagihan tidak ditemukan.");
  }

  await ensureInstallmentsForItems(connection, itemRows);
  const [installmentRows] = await connection.execute<TagihanInstallmentRow[]>(
    `SELECT id, tagihan_item_id, installment_number, nominal, is_paid, paid_at
     FROM tagihan_item_installments
     WHERE tagihan_item_id = ?
     ORDER BY installment_number ASC`,
    [itemId]
  );

  return mapTagihanItems(itemRows[0].tagihan_id, itemRows, installmentRows)[0];
};

export const getTagihanByFirebaseUid = async (
  firebaseUid: string,
  email?: string | null
) => {
  await ensureTagihanInstallmentsTable();
  const userId = await ensureUser(firebaseUid, email);
  const [tagihanRows] = await mysqlPool.execute<TagihanRow[]>(
    `SELECT id, nama_akun, custom_akun, pembukuan, jatuh_tempo, biaya_admin, created_at
     FROM tagihan
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId]
  );

  if (tagihanRows.length === 0) {
    return [];
  }

  const connection = await mysqlPool.getConnection();
  try {
    await ensureInstallmentsForItems(connection, tagihanRows.length ? await (async () => {
      const placeholders = tagihanRows.map(() => "?").join(", ");
      const [rows] = await connection.execute<TagihanItemRow[]>(
        `SELECT id, tagihan_id, keterangan, tenor, bulan_cicilan_pertama, bulan_cicilan_terakhir, nominal
         FROM tagihan_items
         WHERE tagihan_id IN (${placeholders})
         ORDER BY id ASC`,
        tagihanRows.map((row) => row.id)
      );
      return rows;
    })() : []);
  } finally {
    connection.release();
  }

  const placeholders = tagihanRows.map(() => "?").join(", ");
  const [itemRows] = await mysqlPool.execute<TagihanItemRow[]>(
    `SELECT id, tagihan_id, keterangan, tenor, bulan_cicilan_pertama, bulan_cicilan_terakhir, nominal
     FROM tagihan_items
     WHERE tagihan_id IN (${placeholders})
     ORDER BY id ASC`,
    tagihanRows.map((row) => row.id)
  );
  const installmentRows =
    itemRows.length === 0
      ? []
      : (
          await mysqlPool.execute<TagihanInstallmentRow[]>(
            `SELECT id, tagihan_item_id, installment_number, nominal, is_paid, paid_at
             FROM tagihan_item_installments
             WHERE tagihan_item_id IN (${itemRows.map(() => "?").join(", ")})
             ORDER BY installment_number ASC`,
            itemRows.map((row) => row.id)
          )
        )[0];

  return tagihanRows.map((row) => mapTagihan(row, itemRows, installmentRows));
};

export const createTagihanForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  payload: TagihanInput
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await ensureTagihanInstallmentsTable();
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);

    const [tagihanResult] = await connection.execute<ResultSetHeader>(
      `INSERT INTO tagihan (
        user_id,
        nama_akun,
        custom_akun,
        pembukuan,
        jatuh_tempo,
        biaya_admin,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        payload.namaAkun,
        toNullableString(payload.customAkun),
        payload.pembukuan,
        payload.jatuhTempo,
        payload.biayaAdmin ?? null,
        payload.createdAt ? normalizeDate(payload.createdAt) : new Date(),
      ]
    );

    await insertTagihanItems(connection, tagihanResult.insertId, payload.items);
    await connection.commit();

    return {
      id: String(tagihanResult.insertId),
      ...payload,
      biayaAdmin: payload.biayaAdmin ?? undefined,
      customAkun: payload.customAkun ?? "",
      createdAt: payload.createdAt ? normalizeDate(payload.createdAt) : new Date(),
    } satisfies TagihanAkun;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateTagihanForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  tagihanId: number,
  data: Partial<Omit<TagihanAkun, "id" | "items">>,
  items?: TagihanItem[]
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await ensureTagihanInstallmentsTable();
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    const [rows] = await connection.execute<RowDataPacket[]>(
      "SELECT id FROM tagihan WHERE id = ? AND user_id = ? LIMIT 1",
      [tagihanId, userId]
    );

    if (rows.length === 0) {
      throw new Error("Data tagihan tidak ditemukan.");
    }

    if (
      !data.namaAkun ||
      typeof data.pembukuan !== "number" ||
      typeof data.jatuhTempo !== "number"
    ) {
      throw new Error("Data update tagihan tidak lengkap.");
    }

    await connection.execute(
      `UPDATE tagihan
       SET nama_akun = ?, custom_akun = ?, pembukuan = ?, jatuh_tempo = ?, biaya_admin = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        data.namaAkun,
        toNullableString(data.customAkun),
        data.pembukuan,
        data.jatuhTempo,
        data.biayaAdmin ?? null,
        tagihanId,
        userId,
      ]
    );

    if (items) {
      await connection.execute("DELETE FROM tagihan_items WHERE tagihan_id = ?", [
        tagihanId,
      ]);
      await insertTagihanItems(connection, tagihanId, items);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteTagihanForFirebaseUser = async (
  firebaseUid: string,
  tagihanId: number
) => {
  const userId = await ensureUser(firebaseUid);
  const [result] = await mysqlPool.execute<ResultSetHeader>(
    "DELETE FROM tagihan WHERE id = ? AND user_id = ?",
    [tagihanId, userId]
  );

  if (result.affectedRows === 0) {
    throw new Error("Data tagihan tidak ditemukan.");
  }
};

export const updateTagihanItemInstallmentsForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  tagihanItemId: number,
  installments: TagihanInstallment[]
) => {
  const connection = await mysqlPool.getConnection();

  try {
    await ensureTagihanInstallmentsTable();
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    const item = await getTagihanItemById(connection, userId, tagihanItemId);
    const normalizedInstallments = normalizeInstallmentsPayload(installments);

    validateInstallmentsSequence(
      normalizedInstallments,
      Number.parseInt(item.tenor, 10),
      item.installments
    );

    for (const installment of normalizedInstallments) {
      await connection.execute(
        `UPDATE tagihan_item_installments
         SET nominal = ?, is_paid = ?, paid_at = ?, updated_at = CURRENT_TIMESTAMP
         WHERE tagihan_item_id = ? AND installment_number = ?`,
        [
          installment.nominal,
          installment.isPaid ? 1 : 0,
          installment.isPaid
            ? installment.paidAt ?? item.installments[installment.cicilanKe - 1]?.paidAt ?? new Date()
            : null,
          tagihanItemId,
          installment.cicilanKe,
        ]
      );
    }

    await connection.execute(
      `UPDATE tagihan_items
       SET nominal = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [normalizedInstallments[0]?.nominal ?? item.nominal, tagihanItemId]
    );

    await connection.commit();

    return await getTagihanItemById(connection, userId, tagihanItemId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
