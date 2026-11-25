import { notFound } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { AddToCart, Photo } from "@/components/catalog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { consultation, product, profile } from "@/lib/catalog";
import { price, stockLabels, surfaceLabels } from "@/lib/format";

export default async function ProductDetail({ params }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const [entry, company] = await Promise.all([product(id), profile()]);
  if (!entry) notFound();
  const wa = consultation(entry.name, company?.whatsapp_number);
  const specs = [
    ["Kategori", entry.category], ["Tipe permukaan", surfaceLabels[entry.surface]],
    ["Dimensi", entry.dimensions], ["Bearing bar", entry.bearing_bar], ["Pitch", entry.pitch], ["Finishing", entry.finishing], ["Satuan", entry.unit],
  ];
  return <section className="frame catalog-page">
    <Breadcrumbs parent={{ href: "/katalog", label: "Katalog" }} current={entry.name} />
    <div className="product-sheet">
      <header className="sheet-heading">
        <h1>{entry.name}</h1><p>{entry.description}</p>
      </header>
      <div className="sheet-media">
        <div className="detail-image"><Photo source={entry.image_url} alt={entry.name} priority /></div>
        {process.env.DEMO_MODE === "1" && <p className="demo-note">Ilustrasi produk untuk demo.</p>}
      </div>
      <div className="sheet-specs">
        <h2>Spesifikasi</h2>
        <table className="spec-table"><caption className="sr-only">Spesifikasi produk</caption><tbody>{specs.filter(([, value]) => value).map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}</tbody></table>
      </div>
      <div className="sheet-order">
        <div className="detail-price"><strong>{price(entry)}</strong><span className={"stock " + entry.stock_status.toLowerCase()}>{stockLabels[entry.stock_status]}</span></div>
        <AddToCart product={entry} />
      </div>
      {wa && <aside className="sheet-contact">
        <h2>Butuh ukuran khusus?</h2>
        <a className="text-link inline-link" href={wa} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Konsultasi ukuran khusus</a>
      </aside>}
    </div>
  </section>;
}
