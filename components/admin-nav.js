"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Building2, ClipboardList, Images, LayoutDashboard, Menu, Tags } from "lucide-react";
import { useRef, useState } from "react";

const links = [
  ["/admin", "Ringkasan", LayoutDashboard], ["/admin/rfq", "Permintaan penawaran", ClipboardList],
  ["/admin/produk", "Produk & jasa", Box], ["/admin/kategori", "Kategori", Tags],
  ["/admin/portofolio", "Portofolio", Images], ["/admin/profil", "Profil usaha", Building2],
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuButton = useRef(null);
  function closeOnEscape(event) {
    if (event.key === "Escape" && open) {
      setOpen(false);
      menuButton.current?.focus();
    }
  }
  return <>
    <button ref={menuButton} type="button" className="admin-menu button secondary" aria-controls="admin-main-menu" aria-expanded={open} onKeyDown={closeOnEscape} onClick={() => setOpen(!open)}><Menu size={18} /> Menu admin</button>
    <nav id="admin-main-menu" aria-label="Navigasi admin" className={"admin-nav" + (open ? " expanded" : "")} onKeyDown={closeOnEscape}>
      {links.map(([url, label, Icon]) => {
        const selected = url === "/admin" ? pathname === url : pathname.startsWith(url);
        return <Link key={url} className={selected ? "selected" : ""} aria-current={selected ? "page" : undefined} href={url} onClick={() => setOpen(false)}><Icon size={18} /> {label}</Link>;
      })}
    </nav>
  </>;
}
