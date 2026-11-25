import { notFound } from "next/navigation";
import { Photo } from "@/components/catalog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { project } from "@/lib/catalog";
import { date } from "@/lib/format";

export default async function PortfolioDetail({ params }) {
  const { id } = await params;
  const entry = /^\d+$/.test(id) ? await project(id) : null;
  if (!entry) notFound();
  return <section className="frame catalog-page">
    <Breadcrumbs parent={{ href: "/portofolio", label: "Portofolio" }} current={entry.project_title} />
    <div className="detail-grid public-story">
      <article className="detail-info"><h1>{entry.project_title}</h1>
        <p className="preserve">{entry.description}</p>
        {entry.location && <p>Lokasi · {entry.location}</p>}
        {entry.client_name && <p>Klien · {entry.client_name}</p>}
        {entry.completion_date && <p>Selesai · {date(entry.completion_date)}</p>}
      </article>
      <div className="detail-image"><Photo source={entry.image_url} alt={entry.project_title} priority /></div>
    </div>
  </section>;
}
