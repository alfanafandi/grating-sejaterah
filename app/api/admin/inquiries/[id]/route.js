import { activeAdmin } from "@/lib/auth";
import { inquiry } from "@/lib/inquiries";

export async function GET(_request, { params }) {
  if (!await activeAdmin()) return Response.json({ error: "Sesi admin diperlukan." }, { status: 401 });
  const { id } = await params;
  const record = /^\d+$/.test(id) ? await inquiry(id) : null;
  return record ? Response.json(record) : Response.json({ error: "RFQ tidak ditemukan." }, { status: 404 });
}
