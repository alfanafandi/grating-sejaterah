import Link from "next/link";
import { categories, profile } from "@/lib/catalog";
import { CartProvider } from "@/components/cart";
import { Brand, SiteNav } from "@/components/site-nav";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }) {
  const [company, groups] = await Promise.all([profile(), categories()]);
  const name = company?.company_name || "UD Grating Sejahterah";
  return <CartProvider>
    <div className="public-shell">
      <SiteNav name={name} categories={groups} />
      <main id="main" className="public-main">{children}</main>
      <footer className="footer">
        <div className="frame footer-main">
          <div><Brand name={name} />{company?.address && <p>{company.address}</p>}</div>
          <nav className="footer-links" aria-label="Navigasi footer">
            <div><h2>Produk</h2><Link href="/katalog">Semua produk</Link>{groups.slice(0, 5).map(({ id, name: label }) => <Link key={id} href={"/katalog?kategori=" + id}>{label}</Link>)}</div>
            <div><h2>Bengkel</h2><Link href="/profil">Profil usaha</Link><Link href="/portofolio">Portofolio</Link><Link href="/kontak">Kontak</Link></div>
          </nav>
        </div>
        <div className="frame footer-bottom"><span>© {new Date().getFullYear()} {name}</span><Link href="/admin">Masuk admin</Link></div>
      </footer>
    </div>
  </CartProvider>;
}
