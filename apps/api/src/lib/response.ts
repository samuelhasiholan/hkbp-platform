export function ok<T>(data: T, meta?: Record<string, unknown>, message = "OK") {
  return { success: true, data, meta, message };
}
