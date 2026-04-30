import mysql, { Pool } from "mysql2/promise";

declare global {
  var __mysqlPool__: Pool | undefined;
}

const createPool = () => {
  const connectionUri = process.env.DATABASE_URL;

  if (!connectionUri) {
    throw new Error("DATABASE_URL belum dikonfigurasi.");
  }

  const url = new URL(connectionUri);

  if (url.protocol !== "mysql:") {
    throw new Error("DATABASE_URL harus memakai skema mysql://");
  }

  return mysql.createPool({
    host: url.hostname,
    port: url.port ? Number.parseInt(url.port, 10) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
  });
};

export const mysqlPool = global.__mysqlPool__ ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__mysqlPool__ = mysqlPool;
}
