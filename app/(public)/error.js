"use client";

export default function PublicError({ reset }) {
  return <section className="frame page-section">
    <div className="panel empty">
      <h1>Halaman belum bisa dimuat</h1>
      <p>Silakan coba muat ulang.</p>
      <button className="button primary" onClick={reset}>Coba lagi</button>
    </div>
  </section>;
}
