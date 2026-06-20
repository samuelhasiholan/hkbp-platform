import { cookies } from "next/headers";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roles: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function getCurrentUser() {
  const token = (await cookies()).get("hkbp_access_token")?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || !result.success) return null;
    return result.data as CurrentUser;
  } catch {
    return null;
  }
}

export async function getAccessToken() {
  return (await cookies()).get("hkbp_access_token")?.value ?? null;
}
