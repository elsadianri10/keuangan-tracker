import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { mysqlPool } from "@/lib/mysql";
import { StockExchange, StockWatchlistItem } from "@/types/market";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
};

type StockWatchlistRow = RowDataPacket & {
  id: number;
  symbol: string;
  exchange: StockExchange;
  display_name: string | null;
  sort_order: number;
};

let stockWatchlistTableReady: Promise<void> | null = null;

const defaultWatchlist: Omit<StockWatchlistItem, "id">[] = [
  { symbol: "BBCA", exchange: "IDX", displayName: "BBCA", sortOrder: 0 },
  { symbol: "BBRI", exchange: "IDX", displayName: "BBRI", sortOrder: 1 },
  { symbol: "ANTM", exchange: "IDX", displayName: "ANTM", sortOrder: 2 },
  { symbol: "AAPL", exchange: "US", displayName: "AAPL", sortOrder: 3 },
  { symbol: "BBNI", exchange: "IDX", displayName: "BBNI", sortOrder: 4 },
];

const normalizeSymbol = (symbol: string, exchange: StockExchange) => {
  const normalized = symbol.trim().toUpperCase().replace(/\s+/g, "");

  if (exchange === "IDX") {
    return normalized.replace(/\.JK$/, "");
  }

  return normalized;
};

const toNullableString = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
};

const mapWatchlistItem = (row: StockWatchlistRow): StockWatchlistItem => ({
  id: String(row.id),
  symbol: row.symbol,
  exchange: row.exchange,
  displayName: row.display_name ?? row.symbol,
  sortOrder: row.sort_order,
});

const ensureStockWatchlistTable = () => {
  if (!stockWatchlistTableReady) {
    stockWatchlistTableReady = mysqlPool
      .execute(
        `CREATE TABLE IF NOT EXISTS stock_watchlist_items (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          symbol VARCHAR(32) NOT NULL,
          exchange ENUM('IDX', 'US') NOT NULL,
          display_name VARCHAR(100) DEFAULT NULL,
          sort_order INT UNSIGNED NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_stock_watchlist_user_symbol_exchange (user_id, symbol, exchange),
          CONSTRAINT fk_stock_watchlist_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      )
      .then(() =>
        mysqlPool.execute(
          "CREATE INDEX idx_stock_watchlist_user_order ON stock_watchlist_items (user_id, sort_order)"
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

  return stockWatchlistTableReady;
};

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

const insertWatchlistItems = async (
  connection: PoolConnection,
  userId: number,
  items: Omit<StockWatchlistItem, "id">[]
) => {
  for (const [index, item] of items.entries()) {
    await connection.execute(
      `INSERT INTO stock_watchlist_items (
        user_id,
        symbol,
        exchange,
        display_name,
        sort_order
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        normalizeSymbol(item.symbol, item.exchange),
        item.exchange,
        toNullableString(item.displayName) ?? normalizeSymbol(item.symbol, item.exchange),
        index,
      ]
    );
  }
};

export const getStockWatchlistByFirebaseUid = async (
  firebaseUid: string,
  email?: string | null
) => {
  await ensureStockWatchlistTable();
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    let [rows] = await connection.execute<StockWatchlistRow[]>(
      `SELECT id, symbol, exchange, display_name, sort_order
       FROM stock_watchlist_items
       WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [userId]
    );

    if (rows.length === 0) {
      await insertWatchlistItems(connection, userId, defaultWatchlist);
      [rows] = await connection.execute<StockWatchlistRow[]>(
        `SELECT id, symbol, exchange, display_name, sort_order
         FROM stock_watchlist_items
         WHERE user_id = ?
         ORDER BY sort_order ASC, id ASC`,
        [userId]
      );
    }

    await connection.commit();
    return rows.map(mapWatchlistItem);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const replaceStockWatchlistForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  items: StockWatchlistItem[]
) => {
  await ensureStockWatchlistTable();
  const cleanedItems = items
    .map((item, index) => ({
      symbol: normalizeSymbol(item.symbol, item.exchange),
      exchange: item.exchange,
      displayName: item.displayName?.trim() || normalizeSymbol(item.symbol, item.exchange),
      sortOrder: index,
    }))
    .filter((item) => item.symbol);

  if (cleanedItems.length === 0) {
    throw new Error("Minimal 1 saham harus dipilih untuk watchlist.");
  }

  const uniqueKeys = new Set<string>();
  for (const item of cleanedItems) {
    const key = `${item.exchange}:${item.symbol}`;
    if (uniqueKeys.has(key)) {
      throw new Error(`Saham ${item.symbol} pada market ${item.exchange} duplikat.`);
    }
    uniqueKeys.add(key);
  }

  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    await connection.execute("DELETE FROM stock_watchlist_items WHERE user_id = ?", [
      userId,
    ]);
    await insertWatchlistItems(connection, userId, cleanedItems);
    await connection.commit();

    const [rows] = await mysqlPool.execute<StockWatchlistRow[]>(
      `SELECT id, symbol, exchange, display_name, sort_order
       FROM stock_watchlist_items
       WHERE user_id = ?
       ORDER BY sort_order ASC, id ASC`,
      [userId]
    );

    return rows.map(mapWatchlistItem);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
