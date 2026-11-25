import { readPhoto } from "@/lib/uploads";

export async function GET(_request, { params }) {
  const { filename } = await params;
  const photo = await readPhoto(filename);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(photo, {
    headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
