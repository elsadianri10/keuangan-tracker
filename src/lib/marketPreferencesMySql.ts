import {
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";
import { mysqlPool } from "@/lib/mysql";
import { MarketCurrency, MarketPreferences } from "@/types/market";

type UserRow = RowDataPacket & {
  id: number;
  email: string;
};

type MarketPreferenceRow = RowDataPacket & {
  id: number;
  forex_from: MarketCurrency;
  forex_to: MarketCurrency;
  metals_currency: MarketCurrency;
};

let marketPreferencesTableReady: Promise<void> | null = null;

const defaultPreferences: MarketPreferences = {
  forexFrom: "USD",
  forexTo: "IDR",
  metalsCurrency: "IDR",
};

const ensureMarketPreferencesTable = () => {
  if (!marketPreferencesTableReady) {
    marketPreferencesTableReady = mysqlPool
      .execute(
        `CREATE TABLE IF NOT EXISTS market_preferences (
          id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
          user_id BIGINT UNSIGNED NOT NULL,
          forex_from ENUM('USD', 'IDR', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD') NOT NULL DEFAULT 'USD',
          forex_to ENUM('USD', 'IDR', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD') NOT NULL DEFAULT 'IDR',
          metals_currency ENUM('USD', 'IDR', 'EUR', 'SGD', 'JPY', 'GBP', 'AUD') NOT NULL DEFAULT 'IDR',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_market_preferences_user (user_id),
          CONSTRAINT fk_market_preferences_user
            FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      )
      .then(() => undefined);
  }

  return marketPreferencesTableReady;
};

const mapPreferences = (row: MarketPreferenceRow): MarketPreferences => ({
  forexFrom: row.forex_from,
  forexTo: row.forex_to,
  metalsCurrency: row.metals_currency,
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

export const getMarketPreferencesByFirebaseUid = async (
  firebaseUid: string,
  email?: string | null
) => {
  await ensureMarketPreferencesTable();
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    let [rows] = await connection.execute<MarketPreferenceRow[]>(
      `SELECT id, forex_from, forex_to, metals_currency
       FROM market_preferences
       WHERE user_id = ?
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      await connection.execute(
        `INSERT INTO market_preferences (user_id, forex_from, forex_to, metals_currency)
         VALUES (?, ?, ?, ?)`,
        [
          userId,
          defaultPreferences.forexFrom,
          defaultPreferences.forexTo,
          defaultPreferences.metalsCurrency,
        ]
      );

      [rows] = await connection.execute<MarketPreferenceRow[]>(
        `SELECT id, forex_from, forex_to, metals_currency
         FROM market_preferences
         WHERE user_id = ?
         LIMIT 1`,
        [userId]
      );
    }

    await connection.commit();
    return mapPreferences(rows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateMarketPreferencesForFirebaseUser = async (
  firebaseUid: string,
  email: string | null | undefined,
  preferences: MarketPreferences
) => {
  await ensureMarketPreferencesTable();
  const connection = await mysqlPool.getConnection();

  try {
    await connection.beginTransaction();
    const userId = await ensureUser(firebaseUid, email, connection);
    await connection.execute(
      `INSERT INTO market_preferences (user_id, forex_from, forex_to, metals_currency)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         forex_from = VALUES(forex_from),
         forex_to = VALUES(forex_to),
         metals_currency = VALUES(metals_currency),
         updated_at = CURRENT_TIMESTAMP`,
      [
        userId,
        preferences.forexFrom,
        preferences.forexTo,
        preferences.metalsCurrency,
      ]
    );

    await connection.commit();
    return preferences;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
