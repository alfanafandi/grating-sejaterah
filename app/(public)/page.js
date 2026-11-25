import Link from "next/link";
import { Photo } from "@/components/catalog";
import { consultation, products, profile, projects } from "@/lib/catalog";

export default async function Home() {
  const [entries, company, gallery] = await Promise.all([products(), profile(), projects()]);
  const demo = process.env.DEMO_MODE === "1";
  const wa = consultation("", company?.whatsapp_number);
  const featuredProject = gallery[0];
  const applications = [];
  for (const entry of entries) {
    if (applications.some((item) => item.category_id === entry.category_id)) continue;
    applications.push(entry);
    if (applications.length === 3) break;
  }

  return <>
    <section className="home-hero">
      <div className="frame home-hero-grid">
        <div className="home-hero-copy">
          <h1>Steel grating<br />&amp; fabrikasi besi</h1>
          <p>Panel baja untuk drainase, platform, dan tangga. Pilih ukuran standar atau diskusikan kebutuhan dari gambar kerja Anda.</p>
          <Link href="/katalog" className="button primary">Lihat katalog</Link>
        </div>
        <figure className="home-hero-photo">
          <Photo source="/images/grating-workshop.webp" alt="Panel kisi baja galvanis di bengkel" priority />
          <figcaption>Ilustrasi panel galvanis</figcaption>
        </figure>
      </div>
    </section>

    <section className="frame home-catalog" id="aplikasi">
      <div className="section-title home-section-title">
        <div>
          <h2>Aplikasi steel grating</h2>
          {demo && <p className="demo-note">Contoh produk untuk demo.</p>}
        </div>
        <Link href="/katalog" className="text-link rule-link">Lihat semua produk</Link>
      </div>
      {applications.length ? <div className="application-grid">{applications.map((entry) => <article key={entry.category_id} className="application">
        <div className="application-photo"><Photo source={entry.image_url} alt={entry.name} /></div>
        <div className="application-copy">
          <h3><Link href={"/katalog?kategori=" + entry.category_id}>{entry.category}</Link></h3>
          <p>{entry.name}{entry.dimensions && " · " + entry.dimensions}</p>
        </div>
      </article>)}</div> :
        <p className="empty">Belum ada produk yang ditampilkan.</p>}
    </section>

    {featuredProject && <section className="home-project">
      <div className="frame home-project-grid">
        <div className="home-project-copy">
          <p className="eyebrow">{demo ? "Contoh penerapan" : "Portofolio"}</p>
          <h2>{featuredProject.project_title}</h2>
          <p>{featuredProject.description}</p>
          <Link href={"/portofolio/" + featuredProject.id} className="text-link rule-link">Lihat detail proyek</Link>
        </div>
        <Photo source={featuredProject.image_url} alt={featuredProject.project_title} />
      </div>
    </section>}

    <section className="frame home-contact">
      <div>
        <h2>Profil bengkel</h2>
        {company?.description && <p>{company.description}</p>}
        <Link href="/profil" className="text-link rule-link">Tentang bengkel</Link>
      </div>
      <div>
        <h3>Butuh ukuran khusus?</h3>
        <p>Diskusikan dimensi, finishing, dan pengiriman dengan tim bengkel.</p>
        {wa ? <a href={wa} target="_blank" rel="noreferrer" className="button primary">Konsultasi via WhatsApp</a> :
          <Link href="/kontak" className="button primary">Lihat kontak bengkel</Link>}
      </div>
    </section>
  </>;
}
