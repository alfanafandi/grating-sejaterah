import { activeAdmin } from "@/lib/auth";
import { inquiries } from "@/lib/inquiries";
import { statuses } from "@/lib/format";

export async function GET(request) {
  if (!await activeAdmin()) return Response.json({ error: "Sesi admin diperlukan." }, { status: 401 });
  const status = new URL(request.url).searchParams.get("status");
  if (status && !Object.hasOwn(statuses, status)) return Response.json({ error: "Status tidak valid." }, { status: 400 });
  return Response.json(await inquiries(status));
}
