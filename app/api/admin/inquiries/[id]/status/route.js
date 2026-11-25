import { activeAdmin } from "@/lib/auth";
import { statuses } from "@/lib/format";
import { setInquiryStatus } from "@/lib/inquiries";

export async function PATCH(request, { params }) {
  if (!await activeAdmin()) return Response.json({ error: "Sesi admin diperlukan." }, { status: 401 });
  const input = await request.json().catch(() => null);
  if (typeof input?.status !== "string" || !Object.hasOwn(statuses, input.status)) {
    return Response.json({ error: "Status tidak valid." }, { status: 400 });
  }
  const { id } = await params;
  if (!/^\d+$/.test(id) || !await setInquiryStatus(id, input.status)) {
    return Response.json({ error: "RFQ tidak ditemukan." }, { status: 404 });
  }
  return Response.json({ id: Number(id), status: input.status });
}
