import { one, rows } from "./db.mjs";

export const profile = () => one("SELECT * FROM company_profiles WHERE id = 1");
export const categories = () => rows("SELECT * FROM categories ORDER BY name");

const catalogSql = "SELECT p.*, c.name AS category FROM products p JOIN categories c ON c.id = p.category_id";
export const products = (admin = false) => rows(catalogSql + (admin ? "" : " WHERE p.is_active = TRUE") + " ORDER BY p.id");
export const product = (id, admin = false) => one(catalogSql + " WHERE p.id = ?" + (admin ? "" : " AND p.is_active = TRUE"), [id]);

export const projects = (admin = false) => rows(
  "SELECT * FROM portfolios" + (admin ? "" : " WHERE is_published = TRUE") + " ORDER BY completion_date DESC, id DESC",
);
export const project = (id, admin = false) => one(
  "SELECT * FROM portfolios WHERE id = ?" + (admin ? "" : " AND is_published = TRUE"), [id],
);

export function consultation(name = "", publishedPhone = "") {
  const phone = publishedPhone || process.env.SALES_WHATSAPP || "";
  if (!/^[1-9][0-9]{7,14}$/.test(phone) && process.env.DEMO_MODE !== "1") return null;
  const message = "Halo UD Grating Sejahterah, saya ingin konsultasi kebutuhan fabrikasi dan ukuran custom" + (name ? " untuk " + name : "") + ".";
  return "https://wa.me/" + (/^[1-9][0-9]{7,14}$/.test(phone) ? phone : "") + "?text=" + encodeURIComponent(message);
}
