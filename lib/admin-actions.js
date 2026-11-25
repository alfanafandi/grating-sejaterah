"use server";

import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { one, rows } from "./db.mjs";
import { requireAdmin, sessionCookie, tokenHash } from "./auth";
import { discardPhoto, storePhoto } from "./uploads";
import { setInquiryStatus } from "./inquiries";
import { statuses } from "./format";

const sessionAge = 8 * 60 * 60;
const invalidLogin = { error: "Nama pengguna atau kata sandi tidak cocok." };

export async function signIn(_state, form) {
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");
  if (!username || username.length > 50 || !password || Buffer.byteLength(password) > 72) return invalidLogin;
  const user = await one("SELECT id, password_hash FROM users WHERE username = ?", [username]);
  const fallbackHash = "$2b$12$CcTThTELlfpWjPIhRlyP/OvMkHw5TX/WH7EKrxv6JvWbC4y8MWFGK";
  if (!await bcrypt.compare(password, user?.password_hash || fallbackHash) || !user) return invalidLogin;
  const token = randomBytes(32).toString("hex");
  await rows("DELETE FROM admin_sessions WHERE expires_at <= UTC_TIMESTAMP()");
  await rows("INSERT INTO admin_sessions VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ? SECOND))", [
    tokenHash(token), user.id, sessionAge,
  ]);
  (await cookies()).set(sessionCookie, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "1", path: "/", maxAge: sessionAge,
  });
  redirect("/admin");
}

export async function signOut() {
  const jar = await cookies();
  const token = jar.get(sessionCookie)?.value;
  if (token) await rows("DELETE FROM admin_sessions WHERE token_hash = ?", [tokenHash(token)]);
  jar.delete(sessionCookie);
  redirect("/admin/login");
}

const collections = { produk: "products", kategori: "categories", portofolio: "portfolios" };

function read(form, name, max, label, required = false) {
  const value = String(form.get(name) || "").trim();
  if ((required && !value) || value.length > max) throw new Error(label + " tidak valid.");
  return value;
}

function choice(form, name, values, label) {
  const value = form.get(name);
  if (!values.includes(value)) throw new Error(label + " tidak valid.");
  return value;
}

async function productFields(form) {
  const categoryId = read(form, "category_id", 10, "Kategori", true);
  if (!/^\d+$/.test(categoryId) || !await one("SELECT id FROM categories WHERE id = ?", [categoryId])) {
    throw new Error("Pilih kategori yang tersedia.");
  }
  const type = choice(form, "type", ["PRODUK", "JASA"], "Jenis item");
  const surface = choice(form, "surface", ["", "PLAIN", "SERRATED"], "Permukaan");
  const priceType = choice(form, "price_type", ["TETAP", "CUSTOM"], "Jenis harga");
  const basePrice = read(form, "base_price", 16, "Harga");
  if (priceType === "TETAP" && !/^\d{1,13}(\.\d{1,2})?$/.test(basePrice)) {
    throw new Error("Isi harga tetap dalam Rupiah, misalnya 425000.");
  }
  return {
    category_id: categoryId, type, surface: type === "PRODUK" && surface ? surface : null, price_type: priceType,
    base_price: priceType === "TETAP" ? basePrice : null,
    name: read(form, "name", 150, "Nama produk", true),
    description: read(form, "description", 3000, "Deskripsi", true),
    dimensions: read(form, "dimensions", 100, "Dimensi"),
    bearing_bar: read(form, "bearing_bar", 100, "Bearing bar"),
    pitch: read(form, "pitch", 100, "Pitch"),
    finishing: read(form, "finishing", 100, "Finishing"),
    unit: read(form, "unit", 32, "Satuan", true),
    stock_status: choice(form, "stock_status", ["TERSEDIA", "PRE_ORDER", "HABIS"], "Status ketersediaan"),
    is_active: form.has("is_active"),
  };
}

function projectFields(form) {
  const completion = read(form, "completion_date", 10, "Tanggal selesai");
  if (completion && (!/^\d{4}-\d{2}-\d{2}$/.test(completion) || !Number.isFinite(Date.parse(completion)) ||
    new Date(completion).toISOString().slice(0, 10) !== completion)) throw new Error("Tanggal selesai tidak valid.");
  return {
    project_title: read(form, "project_title", 150, "Judul proyek", true),
    client_name: read(form, "client_name", 100, "Nama klien"),
    location: read(form, "location", 150, "Lokasi"),
    completion_date: completion || null,
    description: read(form, "description", 3000, "Deskripsi proyek", true),
    is_published: form.has("is_published"),
  };
}

function profileFields(form) {
  const maps = read(form, "maps_url", 512, "Tautan peta");
  if (maps) {
    const url = URL.parse(maps);
    if (!url || url.protocol !== "https:" || !["www.google.com", "maps.google.com", "maps.app.goo.gl", "goo.gl"].includes(url.hostname)) {
      throw new Error("Gunakan tautan HTTPS Google Maps.");
    }
  }
  const phone = read(form, "whatsapp_number", 20, "Nomor WhatsApp").replace(/^\+/, "");
  if (phone && !/^[1-9][0-9]{7,14}$/.test(phone)) throw new Error("Isi nomor WhatsApp dalam format internasional.");
  const email = read(form, "email", 100, "Email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email tidak valid.");
  return {
    email, maps_url: maps, whatsapp_number: phone,
    company_name: read(form, "company_name", 150, "Nama usaha", true),
    description: read(form, "description", 5000, "Profil usaha", true),
    address: read(form, "address", 255, "Alamat", true),
    capacity: read(form, "capacity", 3000, "Kapasitas"),
    quality: read(form, "quality", 3000, "Mutu dan legalitas"),
  };
}

function databaseError(error) {
  if (error.code === "ER_DUP_ENTRY") return "Nama kategori sudah digunakan.";
  if (error.code === "ER_ROW_IS_REFERENCED_2") return "Pindahkan produk dari kategori ini sebelum menghapusnya.";
  if (error.code === "ER_NO_REFERENCED_ROW_2") return "Pilihan kategori sudah berubah. Muat ulang halaman.";
  if (!error.code) return error.message;
  console.error("Perubahan admin gagal", error.code);
  return "Perubahan belum tersimpan. Coba lagi.";
}

export async function saveContent(section, id, _state, form) {
  await requireAdmin();
  let uploaded = "";
  try {
    const table = section === "profil" ? "company_profiles" : collections[section];
    if (!table) throw new Error("Bagian tidak valid.");
    const previous = id ? await one("SELECT id, " + (["produk", "portofolio"].includes(section) ? "image_url" : "id AS existing") + " FROM " + table + " WHERE id = ?", [id]) : null;
    if (id && !previous) throw new Error("Data sudah tidak tersedia.");

    let fields;
    if (section === "produk") fields = await productFields(form);
    if (section === "portofolio") fields = projectFields(form);
    if (section === "profil") fields = profileFields(form);
    if (section === "kategori") fields = { name: read(form, "name", 100, "Nama kategori", true) };
    if (["produk", "portofolio"].includes(section)) {
      uploaded = await storePhoto(form.get("image"));
      if (uploaded) fields.image_url = uploaded;
    }
    const columns = Object.keys(fields);
    const values = Object.values(fields);
    if (id) {
      const updated = await rows("UPDATE " + table + " SET " + columns.map((column) => column + " = ?").join(", ") + " WHERE id = ?", [...values, id]);
      if (!updated.affectedRows) throw new Error("Data sudah tidak tersedia.");
    } else {
      await rows("INSERT INTO " + table + " (" + columns.join(", ") + ") VALUES (" + values.map(() => "?").join(", ") + ")", values);
    }
  } catch (error) {
    await discardPhoto(uploaded);
    return { error: databaseError(error) };
  }
  revalidatePath("/", "layout");
  if (section === "profil") return { message: "Profil usaha tersimpan." };
  redirect("/admin/" + section);
}

export async function removeContent(section, id, _state) {
  await requireAdmin();
  try {
    if (section === "produk") {
      await rows("UPDATE products SET is_active = FALSE WHERE id = ?", [id]);
    } else if (["kategori", "portofolio"].includes(section)) {
      await rows("DELETE FROM " + collections[section] + " WHERE id = ?", [id]);
    } else {
      throw new Error("Bagian tidak valid.");
    }
  } catch (error) {
    return { error: databaseError(error) };
  }
  revalidatePath("/", "layout");
  redirect("/admin/" + section);
}

export async function updateStatus(id, _state, form) {
  await requireAdmin();
  const status = form.get("status");
  if (typeof status !== "string" || !Object.hasOwn(statuses, status)) return { error: "Status tidak valid." };
  try {
    if (!await setInquiryStatus(id, status)) return { error: "Permintaan penawaran tidak ditemukan." };
  } catch (error) {
    return { error: databaseError(error) };
  }
  revalidatePath("/admin");
  revalidatePath("/admin/rfq");
  revalidatePath("/admin/rfq/" + id);
  return { message: "Status tersimpan." };
}
