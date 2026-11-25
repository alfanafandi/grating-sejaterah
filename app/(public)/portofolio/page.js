import Link from "next/link";
import { Photo } from "@/components/catalog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { projects } from "@/lib/catalog";

export const metadata = { title: "Portofolio" };

export default async function Portfolio() {
  const entries = await projects();
  return <section className="frame catalog-page">
    <Breadcrumbs current="Portofolio" />
    <div className="page-heading"><h1>Portofolio</h1><p>Penerapan steel grating dan dokumentasi pekerjaan fabrikasi.</p></div>
    {process.env.DEMO_MODE === "1" && <p className="demo-note">Galeri demo menampilkan ilustrasi penerapan.</p>}
    {entries.length ? <div className="product-grid portfolio-grid">{entries.map((entry) => <article className="product-card catalog-card" key={entry.id}>
      <div className="product-image"><Photo source={entry.image_url} alt={entry.project_title} /></div>
      <div className="product-info"><h3><Link className="product-link" href={"/portofolio/" + entry.id}>{entry.project_title}</Link></h3><p>{entry.location || entry.description}</p></div>
    </article>)}</div> : <div className="panel empty">Belum ada proyek yang dipublikasikan.</div>}
  </section>;
}
