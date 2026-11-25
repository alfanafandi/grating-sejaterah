const rupiah = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const dates = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });

export const money = (value) => rupiah.format(value);
export const date = (value) => value ? dates.format(new Date(value)) : "—";
export const stockLabels = { TERSEDIA: "Tersedia", PRE_ORDER: "Pre-order", HABIS: "Habis" };
export const surfaceLabels = { PLAIN: "Polos (plain)", SERRATED: "Bergerigi (serrated)" };
export const statuses = { BARU: "Baru", PENAWARAN_DIKIRIM: "Penawaran dikirim", DIPROSES: "Diproses", SELESAI: "Selesai", BATAL: "Batal" };
export const price = (product) => product.price_type === "TETAP" ? money(product.base_price) + " / " + product.unit : "Sesuai penawaran";

export function normalizeWhatsappNumber(value) {
  const clean = value.replace(/[\s()-]/g, "");
  return /^\+?[0-9]{8,15}$/.test(clean) ? clean : null;
}
