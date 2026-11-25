import Link from "next/link";
import { Brand } from "@/components/site-nav";
import { AdminNav } from "@/components/admin-nav";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/lib/admin-actions";

export const metadata = { title: "Admin bengkel", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }) {
  const admin = await requireAdmin();
  return <main className="admin-shell">
    <aside className="admin-sidebar"><Brand /><AdminNav />
      <div className="admin-account"><span className="account-mark">{admin.name.charAt(0)}</span><span>{admin.name}<Link href="/">Lihat website</Link></span></div>
      <form action={signOut}><button className="button secondary full">Keluar</button></form>
    </aside>
    <section className="admin-main">{children}</section>
  </main>;
}
