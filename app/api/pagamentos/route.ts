import { NextResponse } from "next/server"
import { pagamentoCreateSchema } from "@/lib/validation/pagamentos"
import { getClientIp } from "@/lib/http/ip"
import { rateLimit } from "@/lib/security/rateLimit"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const ip = getClientIp()
  const rl = rateLimit(`pagamentos:POST:${ip}`, 20, 60_000)
  if (!rl.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429 })

  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }) }

  const parsed = pagamentoCreateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 })

  return new NextResponse(null, { status: 201 })
}
