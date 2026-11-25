"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { MapPin, Menu, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useCart } from "./cart";

const links = [["Beranda", "/"], ["Katalog", "/katalog"], ["Portofolio", "/portofolio"], ["Profil bengkel", "/profil"]];

export function Brand({ name = "UD Grating Sejahterah" }) {
  return <Link className="brand" href="/">
    <span className="brand-icon" aria-hidden="true"><span /></span>
    <span>{name}</span>
  </Link>;
}

export function SiteNav({ name, categories }) {
  const pathname = usePathname();
  const category = useSearchParams().get("kategori") || "";
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  const mainMenu = useRef(null);
  const { items } = useCart();
  const inCatalog = pathname === "/katalog" || pathname.startsWith("/katalog/");
  const close = () => setOpen(false);
  useEffect(() => {
    if (open) mainMenu.current?.querySelector("a")?.focus();
  }, [open]);
  return <header className="site-header" onKeyDown={(event) => {
    if (event.key === "Escape" && open) {
      close();
      menuButton.current?.focus();
    }
  }}>
    <div className="site-utility">
      <div className="frame utility-row">
        <span><MapPin size={15} aria-hidden="true" /> Sidoarjo, Jawa Timur</span>
        <Link href="/kontak" onClick={close}>Kontak bengkel</Link>
      </div>
    </div>
    <div className="frame header-row">
      <Brand name={name} />
      <nav ref={mainMenu} id="site-main-menu" className={open ? "site-nav expanded" : "site-nav"} aria-label="Navigasi utama">
        {links.map(([label, href]) => {
          const current = pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
          return <Link key={href} href={href} onClick={close} aria-current={current ? "page" : undefined}>{label}</Link>;
        })}
      </nav>
      <div className="header-actions">
        <Link href="/keranjang" className="cart-link" aria-label={"Keranjang, " + items.length + " jenis item"} onClick={close}>
          <ShoppingBag size={19} /><span className="cart-label">Keranjang</span><span className="cart-count">{items.length}</span>
        </Link>
        <button ref={menuButton} type="button" className="menu-button" aria-controls="site-main-menu" aria-expanded={open} aria-label={open ? "Tutup menu" : "Buka menu"} onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </div>
    {(pathname === "/" || inCatalog) && categories.length > 0 && <div className="site-categories">
      <nav className="frame" aria-label="Kategori produk">
        <Link href="/katalog" onClick={close} aria-current={pathname === "/katalog" && !category ? "page" : undefined}>Semua produk</Link>
        {categories.map(({ id, name: label }) => <Link key={id} href={"/katalog?kategori=" + id} onClick={close}
          aria-current={pathname === "/katalog" && category === String(id) ? "page" : undefined}>{label}</Link>)}
      </nav>
    </div>}
  </header>;
}
