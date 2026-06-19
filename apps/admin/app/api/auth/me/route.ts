import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function GET() {
  const token = (await cookies()).get("hkbp_access_token")?.value;
  if (!token) {
    return NextResponse.json({ success: false, data: null, message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const result = await response.json();

  return NextResponse.json(result, { status: response.status });
}
