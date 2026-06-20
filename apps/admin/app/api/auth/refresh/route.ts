import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("hkbp_refresh_token")?.value;
  if (!refreshToken) {
    return NextResponse.json({ success: false, data: null, message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${API_URL}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    cookieStore.delete("hkbp_access_token");
    cookieStore.delete("hkbp_refresh_token");
    return NextResponse.json({ success: false, data: null, message: result.message ?? "Unauthorized" }, { status: response.status || 401 });
  }

  const secure = process.env.NODE_ENV === "production";
  cookieStore.set("hkbp_access_token", result.data.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 15 * 60,
  });
  cookieStore.set("hkbp_refresh_token", result.data.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return NextResponse.json({ success: true, data: { user: result.data.user }, message: "Session diperbarui" });
}
