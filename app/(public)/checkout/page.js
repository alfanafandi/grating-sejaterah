import { Checkout } from "@/components/quote";
import { products } from "@/lib/catalog";

export const metadata = { title: "Ajukan penawaran" };

export default async function CheckoutPage() {
  return <section className="frame page-section">
    <div className="page-heading"><h1>Ajukan penawaran</h1><p>Lengkapi kontak Anda untuk meneruskan permintaan ke bengkel.</p></div>
    <Checkout products={await products()} demo={process.env.DEMO_MODE === "1"} />
  </section>;
}
