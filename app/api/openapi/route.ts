import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "FinacView API",
      version: "0.1.0"
    },
    paths: {}
  }
  return NextResponse.json(spec)
}
