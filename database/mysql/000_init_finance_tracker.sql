-- DROP DATABASE IF EXISTS finance_tracker_db;

CREATE DATABASE IF NOT EXISTS finance_tracker_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finance_tracker_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  firebase_uid VARCHAR(128) NOT NULL,
  email VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_firebase_uid (firebase_uid),
  UNIQUE KEY uq_users_email (email)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tagihan (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  nama_akun VARCHAR(100) NOT NULL,
  custom_akun VARCHAR(255) DEFAULT NULL,
  pembukuan TINYINT UNSIGNED NOT NULL,
  jatuh_tempo TINYINT UNSIGNED NOT NULL,
  biaya_admin DECIMAL(15,2) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tagihan_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tagihan_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tagihan_id BIGINT UNSIGNED NOT NULL,
  keterangan VARCHAR(255) NOT NULL,
  tenor INT UNSIGNED NOT NULL,
  bulan_cicilan_pertama DATE NOT NULL,
  bulan_cicilan_terakhir DATE NOT NULL,
  nominal DECIMAL(15,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_tagihan_items_tagihan
    FOREIGN KEY (tagihan_id) REFERENCES tagihan(id)
    ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tagihan_item_installments (
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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hutang (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  nama_kreditur VARCHAR(255) NOT NULL,
  keterangan_pinjam TEXT NOT NULL,
  tgl_pinjam DATE NOT NULL,
  tgl_kembali DATE NOT NULL,
  nominal_pinjam DECIMAL(15,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_hutang_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS piutang (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  nama_debitur VARCHAR(255) NOT NULL,
  jenis_piutang ENUM('DANA_PRIBADI', 'LIMIT_PAY_LATER') NOT NULL,
  asal_dana VARCHAR(100) DEFAULT NULL,
  custom_dana VARCHAR(255) DEFAULT NULL,
  asal_limit VARCHAR(100) DEFAULT NULL,
  custom_limit VARCHAR(255) DEFAULT NULL,
  pembukuan TINYINT UNSIGNED DEFAULT NULL,
  jatuh_tempo TINYINT UNSIGNED DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_piutang_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS piutang_dana_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  piutang_id BIGINT UNSIGNED NOT NULL,
  keterangan_pinjam VARCHAR(255) NOT NULL,
  tgl_pinjam DATE NOT NULL,
  tgl_kembali DATE NOT NULL,
  nominal_pinjam DECIMAL(15,2) NOT NULL,
  bunga_pinjam DECIMAL(5,2) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_piutang_dana_items_piutang
    FOREIGN KEY (piutang_id) REFERENCES piutang(id)
    ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS piutang_limit_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  piutang_id BIGINT UNSIGNED NOT NULL,
  keterangan_limit VARCHAR(255) NOT NULL,
  tanggal_awal DATE NOT NULL,
  tenor INT UNSIGNED NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  nominal_limit DECIMAL(15,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_piutang_limit_items_piutang
    FOREIGN KEY (piutang_id) REFERENCES piutang(id)
    ON DELETE CASCADE
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_watchlist_items (
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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS market_preferences (
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
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_tagihan_user_nama
  ON tagihan (user_id, nama_akun);

CREATE INDEX idx_tagihan_items_tagihan_tanggal
  ON tagihan_items (tagihan_id, bulan_cicilan_pertama);

CREATE INDEX idx_tagihan_installment_item_paid
  ON tagihan_item_installments (tagihan_item_id, is_paid);

CREATE INDEX idx_hutang_user_tanggal
  ON hutang (user_id, tgl_pinjam);

CREATE INDEX idx_piutang_user_jenis
  ON piutang (user_id, jenis_piutang);

CREATE INDEX idx_piutang_dana_piutang_tanggal
  ON piutang_dana_items (piutang_id, tgl_pinjam);

CREATE INDEX idx_piutang_limit_piutang_tanggal
  ON piutang_limit_items (piutang_id, tanggal_awal);

CREATE INDEX idx_stock_watchlist_user_order
  ON stock_watchlist_items (user_id, sort_order);
