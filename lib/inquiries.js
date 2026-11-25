import { createHash } from "node:crypto";
import { one, rows, transaction } from "./db.mjs";
import { normalizeWhatsappNumber } from "./format.js";

export class InquiryError extends Error {
  constructor(message, status = 400, productId = null) {
    super(message);
    this.status = status;
    this.productId = productId;
  }
}

function string(value, max, label, required = true) {
  const clean = typeof value === "string" ? value.trim() : "";
  if ((required && !clean) || clean.length > max) throw new InquiryError(label + " tidak valid.");
  return clean;
}

function validate(data, key) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key || "")) {
    throw new InquiryError("Kunci pengajuan tidak valid.");
  }
  if (!Array.isArray(data?.items) || !data.items.length || data.items.length > 30) {
    throw new InquiryError("Keranjang harus berisi 1–30 item.");
  }
  const customerName = string(data.customerName, 100, "Nama");
  const customerPhone = normalizeWhatsappNumber(string(data.customerPhone, 30, "Nomor WhatsApp"));
  if (!customerPhone) throw new InquiryError("Periksa kembali nomor WhatsApp.");
  const shippingAddress = string(data.shippingAddress, 255, "Alamat pengiriman");
  const notes = string(data.notes, 500, "Catatan", false);
  const items = data.items.map((item) => {
    if (!Number.isInteger(item?.productId) || item.productId < 1 || item.productId > 4294967295 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99999) {
      throw new InquiryError("Produk atau jumlah tidak valid.");
    }
    return { productId: item.productId, quantity: item.quantity, notes: string(item.notes, 250, "Catatan item", false) };
  }).sort((a, b) => a.productId - b.productId);
  if (new Set(items.map((item) => item.productId)).size !== items.length) throw new InquiryError("Gabungkan jumlah untuk produk yang sama.");
  return { customerName, customerPhone, shippingAddress, notes, items };
}

function whatsapp(id, items) {
  const recipient = process.env.SALES_WHATSAPP || "";
  if (!/^[1-9][0-9]{7,14}$/.test(recipient) && (recipient || process.env.DEMO_MODE !== "1")) {
    throw new InquiryError("Nomor WhatsApp bengkel belum dikonfigurasi. Coba lagi setelah menghubungi pengelola.", 503);
  }
  const lines = items.map((item) => "- " + item.name + " × " + item.quantity + " " + item.unit);
  const message = ["Halo UD Grating Sejahterah, saya ingin menindaklanjuti permintaan penawaran #" + id + ".", "", ...lines].join("\n");
  return "https://wa.me/" + recipient + "?text=" + encodeURIComponent(message);
}

export async function createInquiry(raw, key) {
  const data = validate(raw, key);
  const hash = createHash("sha256").update(JSON.stringify(data)).digest("hex");
  const findExisting = async () => {
    const record = await one(
      "SELECT id, status, request_hash, whatsapp_url FROM inquiries WHERE idempotency_key = ?", [key],
    );
    if (!record) return null;
    if (record.request_hash !== hash) throw new InquiryError("Kunci pengajuan telah dipakai untuk data berbeda.", 409);
    return { id: record.id, status: record.status, whatsappUrl: record.whatsapp_url, replay: true };
  };

  const existing = await findExisting();
  if (existing) return existing;
  try {
    return await transaction(async (connection) => {
      const header = await rows(
        "INSERT INTO inquiries (customer_name, customer_phone, shipping_address, custom_notes, idempotency_key, request_hash) VALUES (?, ?, ?, ?, ?, ?)",
        [data.customerName, data.customerPhone, data.shippingAddress, data.notes, key, hash], connection,
      );
      const items = [];
      for (const request of data.items) {
        const match = await one(
          "SELECT name, unit, price_type, base_price FROM products WHERE id = ? AND is_active = TRUE AND stock_status <> 'HABIS' FOR UPDATE",
          [request.productId], connection,
        );
        if (!match) throw new InquiryError("Salah satu item sudah tidak tersedia. Perbarui keranjang Anda.", 409, request.productId);
        items.push({ ...request, ...match });
        await rows(
          "INSERT INTO inquiry_items (inquiry_id, product_id, quantity, product_name_snapshot, unit_price_snapshot, unit_snapshot, item_notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [header.insertId, request.productId, request.quantity, match.name, match.price_type === "TETAP" ? match.base_price : null, match.unit, request.notes], connection,
        );
      }
      const whatsappUrl = whatsapp(header.insertId, items);
      await rows("UPDATE inquiries SET whatsapp_url = ? WHERE id = ?", [whatsappUrl, header.insertId], connection);
      return { id: header.insertId, status: "BARU", whatsappUrl, replay: false };
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      const replay = await findExisting();
      if (replay) return replay;
    }
    throw error;
  }
}

export function inquiries(status, recent = false) {
  return rows(
    "SELECT id, customer_name, status, created_at FROM inquiries" + (status ? " WHERE status = ?" : "") +
      " ORDER BY created_at DESC, id DESC" + (recent ? " LIMIT 8" : ""), status ? [status] : [],
  );
}

export async function inquiry(id) {
  const header = await one(
    "SELECT id, customer_name, customer_phone, shipping_address, custom_notes, status, created_at FROM inquiries WHERE id = ?", [id],
  );
  if (!header) return null;
  const items = await rows("SELECT * FROM inquiry_items WHERE inquiry_id = ? ORDER BY id", [id]);
  return { ...header, items };
}

export async function setInquiryStatus(id, status) {
  const result = await rows("UPDATE inquiries SET status = ? WHERE id = ?", [status, id]);
  return result.affectedRows > 0;
}
