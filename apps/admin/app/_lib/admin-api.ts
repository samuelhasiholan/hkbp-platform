import { NextResponse } from "next/server";
import { getAccessToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function proxyAdminRequest(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ success: false, data: null, message: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : { success: response.ok, data: null };
  return NextResponse.json(body, { status: response.status });
}
