import Link from "next/link";

export default function NotFound() {
  return <main className="frame page-section"><div className="panel empty"><h1>Halaman tidak ditemukan</h1><Link className="button primary" href="/">Kembali ke beranda</Link></div></main>;
}
