import Link from "next/link";
import { Photo } from "@/components/catalog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { profile } from "@/lib/catalog";

export const metadata = { title: "Profil usaha" };

export default async function Profile() {
  const company = await profile();
  return <section className="frame catalog-page">
    <Breadcrumbs current="Profil bengkel" />
    <div className="detail-grid public-story">
      <article className="detail-info"><h1>{company?.company_name || "Profil usaha"}</h1><p className="preserve">{company?.description}</p>
        {company?.capacity && <><h3>Kapasitas bengkel</h3><p className="preserve">{company.capacity}</p></>}
        {company?.quality && <><h3>Mutu dan legalitas</h3><p className="preserve">{company.quality}</p></>}
        <Link className="button secondary" href="/kontak">Kontak dan lokasi</Link>
      </article>
      <figure className="detail-image"><Photo source="/images/hero.webp" alt="Ilustrasi panel grating dalam bengkel" priority /><figcaption className="demo-note">Ilustrasi bengkel fabrikasi</figcaption></figure>
    </div>
  </section>;
}
