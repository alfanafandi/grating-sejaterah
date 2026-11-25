import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = () => process.env.UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
const allowedName = /^[a-f0-9-]{36}\.webp$/;

export async function storePhoto(file) {
  if (!file?.size) return "";
  if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran foto maksimal 2 MB.");
  if (!["image/jpeg", "image/png"].includes(file.type)) throw new Error("Gunakan berkas JPEG atau PNG.");

  let image;
  try {
    const input = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 25000000 });
    const { format } = await input.metadata();
    if (!["jpeg", "png"].includes(format)) throw new Error();
    image = await input.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
  } catch {
    throw new Error("Berkas foto tidak dapat dibaca sebagai JPEG atau PNG.");
  }

  const filename = randomUUID() + ".webp";
  await mkdir(directory(), { recursive: true });
  await writeFile(path.join(directory(), filename), image, { flag: "wx" });
  return "/media/" + filename;
}

export function readPhoto(filename) {
  if (!allowedName.test(filename)) return null;
  return readFile(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ directory(), filename)).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
}

export async function discardPhoto(url) {
  if (!url?.startsWith("/media/")) return;
  const filename = url.slice(7);
  if (allowedName.test(filename)) await unlink(/*turbopackIgnore: true*/ path.join(/*turbopackIgnore: true*/ directory(), filename)).catch(() => {});
}
