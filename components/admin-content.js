import Link from "next/link";
import { Box, ClipboardList, Images } from "lucide-react";
import { AdminForm } from "./admin-form";
import { Photo } from "./catalog";
import { categories, products, projects } from "@/lib/catalog";
import { one } from "@/lib/db.mjs";
import { date, money, price, statuses, stockLabels } from "@/lib/format";
import { inquiries } from "@/lib/inquiries";
import { removeContent, saveContent, updateStatus } from "@/lib/admin-actions";

export const contentLabels = { produk: "Produk & jasa", kategori: "Kategori", portofolio: "Portofolio" };
const contentSingular = { produk: "produk atau jasa", kategori: "kategori", portofolio: "proyek" };

export function Status({ value }) {
  return <span className={"stock " + ({ BARU: "pre_order", SELESAI: "tersedia", BATAL: "habis" }[value] || "")}>{statuses[value]}</span>;
}

function AdminTable({ columns, children }) {
  return <div className="table-wrap"><table className="data-table" role="table">
    <thead role="rowgroup"><tr role="row">{columns.map((column) => <th key={column} scope="col" role="columnheader">{column}</th>)}</tr></thead>
    <tbody role="rowgroup">{children}</tbody>
  </table></div>;
}

function Cell({ label, children, wide = false }) {
  return <td role="cell" className={wide ? "mobile-wide" : undefined}>
    {label && <span className="cell-label" aria-hidden="true">{label}</span>}
    {children}
  </td>;
}

export function InquiryTable({ entries }) {
  if (!entries.length) return <div className="empty"><p>Belum ada permintaan penawaran.</p></div>;
  return <AdminTable columns={["ID", "Pelanggan", "Tanggal", "Status", "Tindakan"]}>
    {entries.map((entry) => <tr key={entry.id} role="row">
      <Cell label="ID">#{entry.id}</Cell>
      <Cell label="Pelanggan">{entry.customer_name}</Cell>
      <Cell label="Tanggal">{date(entry.created_at)}</Cell>
      <Cell label="Status"><Status value={entry.status} /></Cell>
      <Cell wide><Link className="text-link table-action" href={"/admin/rfq/" + entry.id}>Lihat detail</Link></Cell>
    </tr>)}
  </AdminTable>;
}

export async function Dashboard() {
  const [metrics, recent] = await Promise.all([
    one("SELECT (SELECT COUNT(*) FROM inquiries WHERE status = 'BARU') AS pending, (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS products, (SELECT COUNT(*) FROM portfolios WHERE is_published = TRUE) AS projects"),
    inquiries(null, true),
  ]);
  const cards = [
    ["Permintaan baru", metrics.pending, ClipboardList, "/admin/rfq?status=BARU"],
    ["Produk aktif", metrics.products, Box, "/admin/produk"],
    ["Proyek terbit", metrics.projects, Images, "/admin/portofolio"],
  ];
  return <>
    <div className="admin-heading"><h1>Ringkasan bengkel</h1>
      <Link className="button primary" href="/admin/produk/baru">Tambah produk</Link></div>
    <div className="metrics">{cards.map(([label, value, Icon, href]) => <Link className="metric" href={href} key={href}>
      <div className="metric-icon"><Icon size={20} /></div><div><span>{label}</span><strong>{value}</strong></div>
    </Link>)}</div>
    <div className="panel admin-table">
      <div className="section-title"><h2>Permintaan terbaru</h2><Link href="/admin/rfq" className="button secondary">Lihat semua RFQ</Link></div>
      <InquiryTable entries={recent} />
    </div>
  </>;
}

export async function InquiryList({ status }) {
  const selected = typeof status === "string" && Object.hasOwn(statuses, status) ? status : "";
  const entries = await inquiries(selected);
  return <>
    <div className="admin-heading"><div><h1>Permintaan penawaran</h1><p>Buka rincian pesanan dan perbarui status tindak lanjut.</p></div></div>
    <div className="panel admin-table">
      <form className="table-filter" action="/admin/rfq"><label htmlFor="status-filter">Status</label>
        <select name="status" id="status-filter" defaultValue={selected}><option value="">Semua status</option>{Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <button className="button secondary">Terapkan</button>
      </form>
      <InquiryTable entries={entries} />
    </div>
  </>;
}

export function InquiryDetail({ entry }) {
  return <>
    <Link className="text-link breadcrumb" href="/admin/rfq">Kembali ke daftar RFQ</Link>
    <div className="admin-heading"><div><h1>Permintaan #{entry.id}</h1><p>Diajukan {date(entry.created_at)}</p></div><Status value={entry.status} /></div>
    <div className="admin-detail-grid">
      <div className="panel">
        <h2>Informasi pelanggan</h2>
        <dl className="info-list">
          <div><dt>Nama</dt><dd>{entry.customer_name}</dd></div>
          <div><dt>WhatsApp</dt><dd>{entry.customer_phone}</dd></div>
          <div><dt>Alamat pengiriman</dt><dd className="preserve">{entry.shipping_address}</dd></div>
          {entry.custom_notes && <div><dt>Catatan</dt><dd className="preserve">{entry.custom_notes}</dd></div>}
        </dl>
      </div>
      <div className="panel"><h2>Tindak lanjut</h2>
        <AdminForm action={updateStatus.bind(null, entry.id)} className="form-panel" submit="Simpan status">
          <label>Status<select name="status" aria-label="Status" defaultValue={entry.status}>
            {Object.entries(statuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select></label>
        </AdminForm>
      </div>
    </div>
    <div className="panel admin-table">
      <div className="section-title"><h2>Item pengajuan</h2></div>
      <AdminTable columns={["Produk", "Jumlah", "Harga satuan saat diajukan"]}>
        {entry.items.map((item) => <tr key={item.id} role="row">
          <Cell label="Produk" wide>{item.product_name_snapshot}{item.item_notes && <small>{item.item_notes}</small>}</Cell>
          <Cell label="Jumlah">{item.quantity} {item.unit_snapshot}</Cell>
          <Cell label="Harga satuan">{item.unit_price_snapshot === null ? "Sesuai penawaran" : money(item.unit_price_snapshot)}</Cell>
        </tr>)}
      </AdminTable>
    </div>
  </>;
}

export async function ContentList({ section }) {
  const entries = await ({ produk: () => products(true), kategori: categories, portofolio: () => projects(true) }[section])();
  const singular = contentSingular[section];
  const columns = ["Nama", ...(section === "produk" ? ["Harga", "Ketersediaan"] : section === "portofolio" ? ["Publikasi"] : []), "Tindakan"];
  return <>
    <div className="admin-heading"><h1>{contentLabels[section]}</h1><Link className="button primary" href={"/admin/" + section + "/baru"}>Tambah {singular}</Link></div>
    <div className="panel admin-table">
      {entries.length ? <AdminTable columns={columns}>
        {entries.map((entry) => <tr key={entry.id} role="row">
          <Cell label="Nama" wide={section === "produk"}>{entry.name || entry.project_title}{entry.category && <small>{entry.category}</small>}</Cell>
          {section === "produk" && <><Cell label="Harga">{price(entry)}</Cell><Cell label="Ketersediaan">{entry.is_active ? stockLabels[entry.stock_status] : "Nonaktif"}</Cell></>}
          {section === "portofolio" && <Cell label="Publikasi">{entry.is_published ? "Terbit" : "Draf"}</Cell>}
          <Cell wide={section !== "kategori"}><Link className="text-link table-action" href={"/admin/" + section + "/" + entry.id}>Edit</Link></Cell>
        </tr>)}
      </AdminTable> : <div className="empty"><p>Belum ada {singular}.</p></div>}
    </div>
  </>;
}

function Input({ field, label, entry, max = 100, required = false, type = "text", ...rest }) {
  return <label>{label}<input name={field} type={type} defaultValue={entry?.[field] ?? ""} maxLength={max} required={required} {...rest} /></label>;
}

function TextArea({ field, label, entry, max = 3000, required = false }) {
  return <label>{label}<textarea name={field} rows={3} defaultValue={entry?.[field] || ""} maxLength={max} required={required} /></label>;
}

function Select({ field, label, entry, options, initial = "" }) {
  return <label>{label}<select name={field} defaultValue={entry?.[field] ?? initial} required={field === "category_id"}>
    {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
  </select></label>;
}

function ProductFields({ entry, groups }) {
  return <>
    <Input field="name" label="Nama produk atau jasa" entry={entry} max={150} required />
    <TextArea field="description" label="Deskripsi" entry={entry} required />
    <div className="field-grid">
      <Select field="category_id" label="Kategori" entry={entry} options={[["", "Pilih kategori"], ...groups.map((group) => [group.id, group.name])]} />
      <Select field="type" label="Jenis item" entry={entry} initial="PRODUK" options={[["PRODUK", "Produk"], ["JASA", "Jasa"]]} />
      <Select field="surface" label="Tipe permukaan" entry={entry} options={[["", "Tidak berlaku"], ["PLAIN", "Polos"], ["SERRATED", "Bergerigi"]]} />
      <Input field="dimensions" label="Dimensi" entry={entry} placeholder="Contoh 1.000 × 1.000 mm" />
      <Input field="bearing_bar" label="Bearing bar" entry={entry} />
      <Input field="pitch" label="Pitch" entry={entry} />
      <Input field="finishing" label="Finishing" entry={entry} />
      <Input field="unit" label="Satuan jual" entry={entry} max={32} required placeholder="Contoh lembar" />
      <Select field="price_type" label="Jenis harga" entry={entry} initial="CUSTOM" options={[["CUSTOM", "Sesuai penawaran"], ["TETAP", "Harga tetap"]]} />
      <Input field="base_price" label="Harga tetap (Rp)" entry={entry} type="number" min="0" max="9999999999999.99" step="0.01" />
      <Select field="stock_status" label="Status ketersediaan" entry={entry} initial="TERSEDIA" options={Object.entries(stockLabels)} />
    </div>
    <label className="check-field"><input type="checkbox" name="is_active" defaultChecked={entry ? Boolean(entry.is_active) : true} /> Tampilkan di katalog</label>
  </>;
}

function ProjectFields({ entry }) {
  return <>
    <Input field="project_title" label="Judul proyek" entry={entry} max={150} required />
    <TextArea field="description" label="Deskripsi pekerjaan" entry={entry} required />
    <div className="field-grid">
      <Input field="location" label="Lokasi" entry={entry} max={150} />
      <Input field="client_name" label="Nama klien (jika diizinkan)" entry={entry} />
      <Input field="completion_date" label="Tanggal selesai" entry={entry} type="date" />
    </div>
    <label className="check-field"><input type="checkbox" name="is_published" defaultChecked={Boolean(entry?.is_published)} /> Publikasikan di galeri</label>
  </>;
}

export async function ContentEdit({ section, entry }) {
  const singular = contentSingular[section];
  const groups = section === "produk" ? await categories() : [];
  return <>
    <Link className="text-link breadcrumb" href={"/admin/" + section}>Kembali ke {contentLabels[section].toLowerCase()}</Link>
    <div className="admin-heading"><h1>{entry ? "Edit " : "Tambah "}{singular}</h1></div>
    <section className="panel edit-panel">
      {section === "produk" && !groups.length && <p className="notice">Buat <Link className="text-link" href="/admin/kategori/baru">kategori</Link> sebelum menyimpan produk.</p>}
      <AdminForm className="form-panel" action={saveContent.bind(null, section, entry?.id ?? null)} submit="Simpan perubahan">
        {section === "produk" && <ProductFields entry={entry} groups={groups} />}
        {section === "kategori" && <Input field="name" label="Nama kategori" entry={entry} required />}
        {section === "portofolio" && <ProjectFields entry={entry} />}
        {section !== "kategori" && <>
          {entry?.image_url && <Photo source={entry.image_url} alt="Foto saat ini" className="edit-preview" />}
          <label>{entry?.image_url ? "Ganti foto" : "Unggah foto"}<input name="image" type="file" accept="image/png,image/jpeg" /><span>JPEG atau PNG, maksimum 2 MB.</span></label>
        </>}
      </AdminForm>
      {entry && (section !== "produk" || Boolean(entry.is_active)) && <AdminForm className="remove-form" action={removeContent.bind(null, section, entry.id)} submit={section === "produk" ? "Nonaktifkan produk" : "Hapus " + singular}
        confirmText={section === "produk" ? "Nonaktifkan produk ini dari katalog?" : "Hapus " + singular + " ini?"} />}
    </section>
  </>;
}

export function ProfileEdit({ entry }) {
  return <>
    <div className="admin-heading"><h1>Profil usaha</h1></div>
    <section className="panel edit-panel">
      <AdminForm className="form-panel" action={saveContent.bind(null, "profil", 1)} submit="Simpan profil">
        <Input field="company_name" label="Nama usaha" entry={entry} max={150} required />
        <TextArea field="description" label="Profil, sejarah, visi dan misi" entry={entry} max={5000} required />
        <Input field="address" label="Alamat workshop" entry={entry} max={255} required />
        <div className="field-grid">
          <Input field="whatsapp_number" label="WhatsApp publik (format internasional)" entry={entry} max={20} type="tel" />
          <Input field="email" label="Email resmi" entry={entry} type="email" />
        </div>
        <Input field="maps_url" label="Tautan Google Maps" entry={entry} max={512} type="url" />
        <TextArea field="capacity" label="Kapasitas bengkel" entry={entry} />
        <TextArea field="quality" label="Mutu dan legalitas" entry={entry} />
      </AdminForm>
    </section>
  </>;
}
