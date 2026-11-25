import { Catalog, Photo } from "@/components/catalog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { categories, products } from "@/lib/catalog";

export const metadata = { title: "Katalog" };

export default async function CatalogPage() {
  const [entries, groups] = await Promise.all([products(), categories()]);
  return <>
    <div className="catalog-banner">
      <div className="frame catalog-banner-grid">
        <Photo source="/images/serrated.webp" alt="Ilustrasi detail permukaan grating bergerigi" priority />
        <p>Pilih grating berdasarkan aplikasi, ukuran, dan finishing.</p>
      </div>
    </div>
    <section className="frame catalog-page">
      <Breadcrumbs current="Katalog" />
      <div className="catalog-heading">
        <h1>Katalog produk &amp; jasa</h1>
        {process.env.DEMO_MODE === "1" && <p className="demo-note">Produk, gambar, dan harga contoh untuk demo.</p>}
      </div>
      <Catalog entries={entries} categories={groups} />
    </section>
  </>;
}
