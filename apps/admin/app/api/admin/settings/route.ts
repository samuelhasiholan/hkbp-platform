import { proxyAdminRequest } from "../../../_lib/admin-api";

export async function GET() {
  return proxyAdminRequest("/api/admin/settings");
}

export async function PATCH(request: Request) {
  return proxyAdminRequest("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(await request.json()),
  });
}
