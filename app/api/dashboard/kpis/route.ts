import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ status: "ok", data: { receitaMes: 0, mrr: 0, matriculasAtivas: 0, renovacoes30d: 0, noShowRate: 0 } })
}
