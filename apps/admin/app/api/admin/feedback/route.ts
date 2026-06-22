import { NextRequest } from "next/server";
import { proxyAdminRequest } from "@/app/_lib/admin-api";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  return proxyAdminRequest(`/api/admin/feedback${url.search}`);
}
