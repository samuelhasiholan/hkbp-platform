import { proxyAdminRequest } from "@/app/_lib/admin-api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return proxyAdminRequest(`/api/admin/feedback/${id}`, { method: "DELETE" });
}
