import mysql from "mysql2/promise";

export const databaseName = process.env.DB_NAME || "grating_sejahterah";
export const connectionOptions = {
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  timezone: "Z",
  dateStrings: ["DATE"],
};

function createPool() {
  const pool = mysql.createPool({ ...connectionOptions, database: databaseName, connectionLimit: 10 });
  pool.on("connection", (connection) => {
    connection.query("SET time_zone = '+00:00'");
  });
  return pool;
}

export const db = globalThis.gratingPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.gratingPool = db;

export async function rows(sql, args = [], connection = db) {
  const [results] = await connection.execute(sql, args);
  return results;
}

export async function one(sql, args = [], connection = db) {
  return (await rows(sql, args, connection))[0];
}

export async function transaction(operation) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await operation(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
