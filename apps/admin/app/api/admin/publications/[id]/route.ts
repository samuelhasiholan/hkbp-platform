import { proxyAdminRequest } from "../../../../_lib/admin-api";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/publications/${id}`);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/publications/${id}`, {
    method: "PATCH",
    body: JSON.stringify(await request.json()),
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/publications/${id}`, { method: "DELETE" });
}
