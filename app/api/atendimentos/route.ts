import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json({ status: "ok", items: [] })
}

export async function POST() {
  return new NextResponse(null, { status: 201 })
}
