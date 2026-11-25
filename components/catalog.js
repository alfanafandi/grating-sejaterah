"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ImageOff, Search, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { price, stockLabels, surfaceLabels } from "@/lib/format";
import { useCart } from "./cart";

export function Photo({ source, alt, className = "", priority = false }) {
  return source ? <img className={className} src={source} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" /> :
    <div className={"image-placeholder " + className}><ImageOff size={34} aria-label="Foto belum tersedia" /></div>;
}

export function ProductCard({ product }) {
  const href = "/katalog/" + product.id;
  return <article className="product-card catalog-card">
    <div className="product-image"><Photo source={product.image_url} alt={product.name} /></div>
    <div className="product-info">
      <h3><Link className="product-link" href={href}>{product.name}</Link></h3>
      <dl className="catalog-facts">
        <div><dt>Kategori</dt><dd>{product.category}</dd></div>
        {product.surface && <div><dt>Permukaan</dt><dd>{surfaceLabels[product.surface]}</dd></div>}
        {product.dimensions && <div><dt>Dimensi</dt><dd>{product.dimensions}</dd></div>}
        {product.finishing && <div><dt>Finishing</dt><dd>{product.finishing}</dd></div>}
      </dl>
      <div className="product-meta"><strong className="product-price">{price(product)}</strong><span className={"stock " + product.stock_status.toLowerCase()}>{stockLabels[product.stock_status]}</span></div>
    </div>
  </article>;
}

export function Catalog({ entries, categories }) {
  const params = useSearchParams();
  const selected = params.get("kategori");
  const category = categories.some(({ id }) => String(id) === selected) ? selected : "";
  const [query, setQuery] = useState("");
  const [surface, setSurface] = useState("");
  const term = query.trim().toLocaleLowerCase("id");
  const results = entries.filter((item) =>
    (!category || String(item.category_id) === category) && (!surface || item.surface === surface) &&
    [item.name, item.category, item.description, item.dimensions, item.finishing, surfaceLabels[item.surface]].join(" ").toLocaleLowerCase("id").includes(term)
  );
  function setCategory(value) {
    const next = new URL(window.location.href);
    if (value) next.searchParams.set("kategori", value);
    else next.searchParams.delete("kategori");
    window.history.replaceState(null, "", next);
  }
  const reset = () => { setQuery(""); setCategory(""); setSurface(""); };

  return <>
    <div className="catalog-toolbar" id="filter-produk">
      <div className="filters">
        <label className="search-field"><Search size={19} /><span className="sr-only">Cari produk</span><input type="search" placeholder="Cari produk atau spesifikasi" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label>Kategori<select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Semua kategori</option>
          {categories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
        </select></label>
        <label>Permukaan<select value={surface} onChange={(event) => setSurface(event.target.value)}>
          <option value="">Semua tipe</option>
          {Object.entries(surfaceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></label>
      </div>
      <div className="catalog-results">
        <p className="result-count" aria-live="polite">{results.length} produk dan jasa</p>
        {(query || category || surface) && <button className="text-link" type="button" onClick={reset}>Hapus filter</button>}
      </div>
    </div>
    {results.length ? <div className="product-grid">{results.map((entry) => <ProductCard key={entry.id} product={entry} />)}</div> :
      <div className="panel empty"><h2>Produk belum ditemukan</h2><p>Coba kata kunci lain atau hapus pilihan filter.</p><button className="button secondary" onClick={reset}>Atur ulang filter</button></div>}
  </>;
}

export function AddToCart({ product }) {
  const { add, ready } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  if (product.stock_status === "HABIS") return <p className="notice">Produk ini sedang habis.</p>;
  return <>
    <form className="add-form" onSubmit={(event) => {
      event.preventDefault();
      add(product.id, Number(quantity));
      setAdded(true);
    }}>
      <label>Jumlah<input type="number" min="1" max="99999" required value={quantity} onChange={(event) => { setQuantity(event.target.value); setAdded(false); }} /></label>
      <button className="button primary" disabled={!ready}><ShoppingBag size={18} /> Tambah ke keranjang</button>
    </form>
    {added && <p className="notice" role="status">Item ditambahkan. <Link className="text-link" href="/keranjang">Lihat keranjang</Link></p>}
  </>;
}
