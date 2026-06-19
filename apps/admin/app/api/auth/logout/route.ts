import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("hkbp_access_token");
  cookieStore.delete("hkbp_refresh_token");
  return NextResponse.json({ success: true, data: null, message: "Logout berhasil" });
}
