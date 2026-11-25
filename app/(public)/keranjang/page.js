import { CartPage } from "@/components/quote";
import { products } from "@/lib/catalog";

export const metadata = { title: "Keranjang" };

export default async function Cart() {
  return <section className="frame page-section">
    <div className="page-heading"><h1>Keranjang penawaran</h1><p>Periksa produk dan jumlah sebelum melanjutkan.</p></div>
    <CartPage products={await products()} />
  </section>;
}
