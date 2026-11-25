import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

try { process.loadEnvFile(".env.local"); } catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const { databaseName, connectionOptions } = await import("../lib/db.mjs");
const demo = process.env.DEMO_MODE === "1";
if (!/^[a-zA-Z0-9_]+$/.test(databaseName)) throw new Error("DB_NAME hanya menerima huruf, angka, dan garis bawah.");
const username = process.env.ADMIN_USERNAME || "admin";
const password = process.env.ADMIN_PASSWORD;
if (password && (password.length < 12 || Buffer.byteLength(password) > 72)) {
  throw new Error("ADMIN_PASSWORD harus minimal 12 karakter dan maksimal 72 byte.");
}

let connection;
try {
  connection = await mysql.createConnection({ ...connectionOptions, database: databaseName });
} catch (error) {
  if (error.code !== "ER_BAD_DB_ERROR") throw error;
  const server = await mysql.createConnection(connectionOptions);
  try {
    await server.query("CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci", [databaseName]);
  } finally {
    await server.end();
  }
  connection = await mysql.createConnection({ ...connectionOptions, database: databaseName });
}
try {
  const schema = await readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");
  for (const statement of schema.split(";").filter((entry) => entry.trim())) {
    await connection.query(statement);
  }
  const [[existing]] = await connection.execute("SELECT id FROM users WHERE username = ?", [username]);
  if (!existing) {
    const initialPassword = password || (demo ? randomBytes(18).toString("base64url") : "");
    if (!initialPassword) throw new Error("Isi ADMIN_PASSWORD untuk membuat akun awal.");
    if (!password) {
      await writeFile(".env.local", "\nADMIN_PASSWORD=" + initialPassword + "\n", { flag: "a" });
      console.log("Kata sandi admin lokal dibuat dan disimpan ke .env.local.");
    }
    await connection.execute("INSERT INTO users (username, name, password_hash) VALUES (?, ?, ?)", [
      username, "Admin Bengkel", await bcrypt.hash(initialPassword, 12),
    ]);
  }
  await connection.execute(
    "INSERT IGNORE INTO company_profiles VALUES (1, ?, ?, ?, '', '', '', '', '')",
    ["UD Grating Sejahterah", "Bengkel steel grating dan fabrikasi besi untuk kebutuhan proyek.", "Sidoarjo, Jawa Timur"],
  );
  if (demo) {
    const [[existingCategory]] = await connection.query("SELECT COUNT(*) AS total FROM categories");
    if (!existingCategory.total) {
      await connection.beginTransaction();
      try {
        const samples = [
          ["Drainase", "Grating Polos", "PLAIN", "Panel kisi dengan permukaan polos untuk penutup saluran.", "1.000 × 1.000 mm", "25 × 3 mm", "30 × 100 mm", "TETAP", 425000, "TERSEDIA", "/images/plain.webp"],
          ["Platform", "Grating Bergerigi", "SERRATED", "Panel bergigi untuk area kerja dan jalur pejalan kaki.", "Menyesuaikan gambar kerja", "32 × 5 mm", "30 × 100 mm", "CUSTOM", null, "PRE_ORDER", "/images/serrated.webp"],
          ["Tangga", "Anak Tangga Grating", "SERRATED", "Anak tangga kisi baja dengan pelat samping untuk pemasangan.", "750 × 250 mm", "25 × 3 mm", "30 × 100 mm", "TETAP", 285000, "TERSEDIA", "/images/stair.webp"],
        ];
        for (const [category, name, surface, description, dimensions, bearing, pitch, priceType, price, stock, image] of samples) {
          const [row] = await connection.execute("INSERT INTO categories (name) VALUES (?)", [category]);
          await connection.execute(
            "INSERT INTO products (category_id, name, surface, description, dimensions, bearing_bar, pitch, finishing, unit, price_type, base_price, stock_status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [row.insertId, name, surface, description, dimensions, bearing, pitch, "Galvanis celup panas", category === "Tangga" ? "unit" : "lembar", priceType, price, stock, image],
          );
        }
        await connection.execute(
          "INSERT INTO portfolios (project_title, description, image_url, is_published) VALUES (?, ?, ?, TRUE)",
          ["Penerapan grating untuk platform", "Ilustrasi penggunaan kisi baja sebagai lantai platform dan akses pemeliharaan.", "/images/platform-walkway.webp"],
        );
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      }
    }
  }
  console.log("Basis data siap digunakan.");
} finally {
  await connection.end();
}
