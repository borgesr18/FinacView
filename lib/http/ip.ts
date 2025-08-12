import { headers } from "next/headers"

export function getClientIp() {
  const h = headers()
  const xfwd = h.get("x-forwarded-for") ?? undefined
  const candidate = xfwd?.split(",")[0]?.trim()
  if (candidate) return candidate
  const realIp = h.get("x-real-ip") ?? undefined
  if (realIp) return realIp
  return "unknown"
}
