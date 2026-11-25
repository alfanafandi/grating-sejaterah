"use client";

import Link from "next/link";
import { Check, MessageCircle, ShoppingBag, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { money, normalizeWhatsappNumber, price } from "@/lib/format";
import { useCart } from "./cart";
import { Photo } from "./catalog";

function fixedSubtotal(entries) {
  let cents = 0n;
  for (const { product, quantity } of entries) {
    const [whole, fraction = ""] = String(product.base_price).split(".");
    cents += (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) * BigInt(quantity);
  }
  return money(`${cents / 100n}.${String(cents % 100n).padStart(2, "0")}`);
}

function Summary({ entries, children }) {
  const fixed = entries.filter(({ product }) => product?.price_type === "TETAP");
  const custom = entries.filter(({ product }) => product?.price_type === "CUSTOM");
  return <aside className="panel quote-summary">
    <h2>Ringkasan penawaran</h2>
    <ul>{entries.map(({ productId, product, quantity }) => <li key={productId}><span>{product?.name || "Produk tidak tersedia"}</span><strong>× {quantity}</strong></li>)}</ul>
    {fixed.length > 0 && <div className="quote-total"><span>Subtotal item harga tetap</span><strong>{fixedSubtotal(fixed)}</strong></div>}
    {custom.length > 0 && <p className="form-note">{fixed.length ? custom.length + " jenis item dihitung sesuai penawaran." : "Seluruh item dihitung sesuai penawaran."}</p>}
    {children}
  </aside>;
}

function EmptyCart() {
  return <div className="panel empty"><ShoppingBag aria-hidden="true" /><h2>Keranjang masih kosong</h2>
    <p>Pilih produk dari katalog untuk meminta penawaran.</p><Link className="button primary" href="/katalog">Lihat katalog</Link></div>;
}

function useEntries(products) {
  const cart = useCart();
  const entries = cart.items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) }));
  const blocked = entries.some(({ product }) => !product || product.stock_status === "HABIS");
  return { ...cart, entries, blocked };
}

function CartQuantity({ quantity, name, onChange }) {
  const [draft, setDraft] = useState(String(quantity));
  return <label>Jumlah<input type="number" min="1" max="99999" required value={draft} aria-label={"Jumlah " + name}
    onChange={(event) => {
      const input = event.target;
      setDraft(input.value);
      if (input.validity.valid) onChange(input.valueAsNumber);
    }}
    onBlur={() => setDraft(String(quantity))} /></label>;
}

export function CartPage({ products }) {
  const { entries, ready, blocked, remove, update } = useEntries(products);
  if (!ready) return <p className="notice">Memuat keranjang…</p>;
  if (!entries.length) return <EmptyCart />;

  return <div className="quote-grid">
    <section className="panel cart-items" aria-label="Isi keranjang">
      {entries.map(({ productId, product, quantity, notes }) => <article className="cart-item" key={productId}>
        <Photo className="cart-photo" source={product?.image_url} alt={product?.name || ""} />
        <div className="cart-item-main">
          <h2>{product ? <Link href={"/katalog/" + product.id}>{product.name}</Link> : "Produk tidak tersedia"}</h2>
          <p>{product ? price(product) : "Keluarkan item untuk melanjutkan."}</p>
          {product?.stock_status === "HABIS" && <p className="form-error">Produk ini sedang habis.</p>}
          <label>Catatan item <textarea placeholder="Opsional" rows={2} maxLength={250} value={notes} onChange={(event) => update(productId, { notes: event.target.value })} /></label>
        </div>
        <div className="cart-item-actions">
          <CartQuantity quantity={quantity} name={product?.name || "produk"} onChange={(next) => update(productId, { quantity: next })} />
          <button className="icon-button" aria-label={"Hapus " + (product?.name || "produk")} onClick={() => remove(productId)}><Trash2 size={18} /></button>
        </div>
      </article>)}
    </section>
    <Summary entries={entries}>
      {blocked ? <p className="form-error">Hapus item yang sudah tidak tersedia.</p> : <Link href="/checkout" className="button primary full">Lanjut ke penawaran</Link>}
      <Link href="/katalog" className="text-link">Lanjut lihat katalog</Link>
    </Summary>
  </div>;
}

async function keyFor(payload) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
  const stored = JSON.parse(sessionStorage.getItem("grating-rfq-attempt") || "null");
  if (stored?.hash === hash) return stored.key;
  const key = crypto.randomUUID();
  sessionStorage.setItem("grating-rfq-attempt", JSON.stringify({ hash, key }));
  return key;
}

export function Checkout({ products, demo }) {
  const { entries, items, ready, blocked, clear } = useEntries(products);
  const [error, setError] = useState(null);
  const [phoneError, setPhoneError] = useState("");
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const locked = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (locked.current || blocked) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = { ...Object.fromEntries(fields), items };
    if (!normalizeWhatsappNumber(payload.customerPhone)) {
      setPhoneError("Masukkan nomor WhatsApp dengan 8–15 digit.");
      form.elements.customerPhone.focus();
      return;
    }
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const key = await keyFor(payload);
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key": key },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setError({ ...data, productName: entries.find((entry) => entry.productId === data.productId)?.product?.name });
        return;
      }
      setResult(data);
      clear();
      sessionStorage.removeItem("grating-rfq-attempt");
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError({ error: "Website belum bisa memastikan pengajuan tersimpan. Coba lagi dengan data yang sama." });
    } finally {
      setPending(false);
      locked.current = false;
    }
  }

  if (result) return <div className="panel empty quote-success" role="status">
    <span className="success-mark"><Check size={27} /></span>
    <h2>Permintaan #{result.id} tersimpan</h2>
    <p>Kirim draf pesan di WhatsApp untuk melanjutkan percakapan.</p>
    <a className="button primary" href={result.whatsappUrl} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Buka WhatsApp lagi</a>
    <Link className="text-link" href="/katalog">Kembali ke katalog</Link>
  </div>;
  if (!ready) return <p className="notice">Memuat keranjang…</p>;
  if (!entries.length) return <EmptyCart />;

  return <form className="quote-grid" onSubmit={submit}>
    <section className="panel form-panel">
      <h2>Kontak dan pengiriman</h2>
      <label>Nama lengkap atau perusahaan<input name="customerName" autoComplete="name" required maxLength={100} /></label>
      <label>Nomor WhatsApp
        <input name="customerPhone" type="tel" autoComplete="tel" required maxLength={30} placeholder="Contoh 081234567890"
          aria-invalid={phoneError ? true : undefined} aria-describedby={phoneError ? "checkout-phone-error" : undefined}
          onChange={() => setPhoneError("")} />
        {phoneError && <small className="field-error" id="checkout-phone-error" role="alert">{phoneError}</small>}
      </label>
      <label>Alamat pengiriman<textarea name="shippingAddress" autoComplete="street-address" required maxLength={255} rows={3} /></label>
      <label><span className="field-title">Catatan pengajuan <small>(opsional)</small></span><textarea name="notes" maxLength={500} rows={3} /></label>
      <p className="form-note">Informasi kontak digunakan untuk menindaklanjuti permintaan penawaran ini.</p>
    </section>
    <Summary entries={entries}>
      {demo && <p className="demo-note">Mode demo. Gunakan data uji. WhatsApp membuka draf contoh.</p>}
      {(error || blocked) && <p className="form-error" role="alert">{error?.productName && error.productName + " · "}{error?.error || "Perbarui item yang tidak tersedia."}</p>}
      <button className="button primary full" disabled={pending || blocked}>{pending ? "Menyimpan pengajuan…" : "Ajukan penawaran dan buka WhatsApp"}</button>
      <Link href="/keranjang" className="text-link">Kembali ke keranjang</Link>
    </Summary>
  </form>;
}
