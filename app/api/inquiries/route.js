import { createInquiry, InquiryError } from "@/lib/inquiries";

export async function POST(request) {
  try {
    const data = await request.json();
    const { replay, ...result } = await createInquiry(data, request.headers.get("Idempotency-Key"));
    return Response.json(result, { status: replay ? 200 : 201 });
  } catch (error) {
    if (error instanceof SyntaxError) return Response.json({ error: "Permintaan tidak valid." }, { status: 400 });
    if (error instanceof InquiryError) {
      return Response.json({ error: error.message, productId: error.productId }, { status: error.status });
    }
    console.error("Penyimpanan RFQ gagal", error.code);
    return Response.json({ error: "Permintaan belum tersimpan. Silakan coba lagi." }, { status: 500 });
  }
}
