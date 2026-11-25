import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumbs({ parent, current }) {
  return <nav aria-label="Jejak navigasi" className="breadcrumbs">
    <ol>
      <li><Link href="/">Beranda</Link></li>
      {parent && <li><ChevronRight size={14} aria-hidden="true" /><Link href={parent.href}>{parent.label}</Link></li>}
      <li><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{current}</span></li>
    </ol>
  </nav>;
}
