import { NextResponse } from "next/server"
import { runEtl, EtlMode } from "@/scripts/etl"

export const runtime = "nodejs"

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const mode = body?.mode as EtlMode
  const file = body?.file as string
  if (!mode || (mode !== "dry" && mode !== "commit")) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 })
  }
  if (!file || typeof file !== "string") {
    return NextResponse.json({ error: "invalid_file" }, { status: 400 })
  }

  try {
    const { report, reportPath } = await runEtl(mode, file)
    return NextResponse.json(
      {
        ok: report.errors.length === 0,
        summary: {
          pacientes: report.pacientes,
          planos: report.planos,
          matriculas: report.matriculas,
          faturas: report.faturas,
          pagamentos: report.pagamentos,
          atendimentos: report.atendimentos
        },
        reportPath
      },
      { status: 202 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "etl_failed" }, { status: 500 })
  }
}
