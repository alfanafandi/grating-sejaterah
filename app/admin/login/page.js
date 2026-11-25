import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/site-nav";
import { AdminForm } from "@/components/admin-form";
import { activeAdmin } from "@/lib/auth";
import { signIn } from "@/lib/admin-actions";

export const metadata = { title: "Masuk admin" };

export default async function Login() {
  if (await activeAdmin()) redirect("/admin");
  return <main className="login-page">
    <section className="panel login-card">
      <Brand /><h1>Masuk admin</h1><p>Kelola katalog dan permintaan penawaran bengkel.</p>
      <AdminForm className="form-panel" action={signIn} submit="Masuk">
        <label>Nama pengguna<input name="username" autoComplete="username" required maxLength={50} /></label>
        <label>Kata sandi<input name="password" type="password" autoComplete="current-password" required /></label>
      </AdminForm>
      <Link className="text-link" href="/">Kembali ke website</Link>
    </section>
  </main>;
}
