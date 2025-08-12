import { headers } from "next/headers"

export function getClientIp() {
  const h = headers()
  const xfwd = h.get("x-forwarded-for")
  if (xfwd) return xfwd.split(",")[0].trim()
  const realIp = h.get("x-real-ip")
  if (realIp) return realIp
  return "unknown"
}
