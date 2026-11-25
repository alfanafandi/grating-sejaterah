import "@fontsource-variable/dm-sans";
import "./globals.css";

export const metadata = {
  title: { default: "UD Grating Sejahterah — Steel Grating & Fabrikasi Besi", template: "%s | UD Grating Sejahterah" },
  description: "Katalog steel grating dan jasa fabrikasi besi di Sidoarjo. Lihat spesifikasi produk dan ajukan penawaran melalui WhatsApp.",
};

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
