import { proxyAdminRequest } from "../../../../../_lib/admin-api";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/organization/profiles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(await request.json()),
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/organization/profiles/${id}`, { method: "DELETE" });
}
