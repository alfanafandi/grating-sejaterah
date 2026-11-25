import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { product, profile, project } from "@/lib/catalog";
import { one } from "@/lib/db.mjs";
import { inquiry } from "@/lib/inquiries";
import { contentLabels, ContentEdit, ContentList, Dashboard, InquiryDetail, InquiryList, ProfileEdit } from "@/components/admin-content";

export default async function AdminPage({ params, searchParams }) {
  await requireAdmin();
  const { section = [] } = await params;
  const [name, id] = section;
  if (section.length > 2) notFound();
  if (!name) return <Dashboard />;

  if (name === "rfq") {
    if (!id) return <InquiryList status={(await searchParams).status} />;
    const entry = /^\d+$/.test(id) ? await inquiry(id) : null;
    if (!entry) notFound();
    return <InquiryDetail entry={entry} />;
  }

  if (name === "profil" && !id) return <ProfileEdit entry={await profile()} />;
  if (!Object.hasOwn(contentLabels, name)) notFound();
  if (!id) return <ContentList section={name} />;
  if (id === "baru") return <ContentEdit section={name} entry={null} />;
  if (!/^\d+$/.test(id)) notFound();

  const handlers = {
    produk: () => product(id, true),
    kategori: () => one("SELECT * FROM categories WHERE id = ?", [id]),
    portofolio: () => project(id, true),
  };
  const entry = await handlers[name]();
  if (!entry) notFound();
  return <ContentEdit section={name} entry={entry} />;
}
