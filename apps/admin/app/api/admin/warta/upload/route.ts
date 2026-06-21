import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getAccessToken } from "../../../../_lib/auth";

const MAX_PDF_SIZE = 20 * 1024 * 1024;

export async function POST(request: Request) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, data: null, message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("pdf");
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, data: null, message: "File PDF belum dipilih" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ success: false, data: null, message: "File warta harus berformat PDF" }, { status: 400 });
  }

  if (file.size > MAX_PDF_SIZE) {
    return NextResponse.json({ success: false, data: null, message: "Ukuran PDF maksimal 20MB" }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "warta");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.pdf`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  const origin = new URL(request.url).origin;

  return NextResponse.json({
    success: true,
    data: { url: `${origin}/uploads/warta/${fileName}`, fileName },
    message: "PDF berhasil diupload",
  });
}
