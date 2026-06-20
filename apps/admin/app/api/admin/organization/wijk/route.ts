import { proxyAdminRequest } from "../../../../_lib/admin-api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return proxyAdminRequest(`/api/admin/organization/wijk${url.search}`);
}

export async function POST(request: Request) {
  return proxyAdminRequest("/api/admin/organization/wijk", {
    method: "POST",
    body: JSON.stringify(await request.json()),
  });
}
