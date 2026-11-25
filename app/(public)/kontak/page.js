import { Mail, MapPin, MessageCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { consultation, profile } from "@/lib/catalog";

export const metadata = { title: "Kontak" };

export default async function Contact() {
  const company = await profile();
  const wa = consultation("", company?.whatsapp_number);
  return <section className="frame catalog-page">
    <Breadcrumbs current="Kontak bengkel" />
    <div className="page-heading"><h1>Kontak bengkel</h1><p>Diskusikan spesifikasi, kebutuhan kustom, dan pengiriman dengan tim bengkel.</p></div>
    <div className="contact-grid">
      <article className="panel"><MapPin /><h2>Lokasi workshop</h2><p>{company?.address}</p>
        {company?.maps_url && <a className="text-link" href={company.maps_url} target="_blank" rel="noreferrer">Buka di Google Maps</a>}</article>
      <article className="panel"><MessageCircle /><h2>WhatsApp</h2>
        {company?.whatsapp_number && <p>+{company.whatsapp_number}</p>}
        {wa ? <a className="button primary" href={wa} target="_blank" rel="noreferrer">Buka WhatsApp</a> : <p>Nomor WhatsApp belum tersedia.</p>}</article>
      {company?.email && <article className="panel"><Mail /><h2>Email</h2><a className="text-link" href={"mailto:" + company.email}>{company.email}</a></article>}
    </div>
  </section>;
}
