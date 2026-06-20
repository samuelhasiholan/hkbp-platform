import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAccessToken } from "../../../../_lib/auth";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const allowedExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, data: null, message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, data: null, message: "File thumbnail belum dipilih" }, { status: 400 });
  }

  const extension = allowedExtensions[file.type];
  if (!extension) {
    return NextResponse.json({ success: false, data: null, message: "Format thumbnail harus JPG, PNG, WEBP, atau GIF" }, { status: 400 });
  }

  if (file.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ success: false, data: null, message: "Ukuran thumbnail maksimal 5MB" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "publications");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  const origin = new URL(request.url).origin;

  return NextResponse.json({
    success: true,
    data: { url: `${origin}/uploads/publications/${fileName}` },
    message: "Thumbnail berhasil diupload",
  });
}
