import { NextResponse } from "next/server"
import { z } from "zod"
import { supabaseServiceClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nome: z.string().min(2)
})

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_error", details: parsed.error.flatten() }, { status: 400 })
  }
  const { email, password, nome } = parsed.data

  const supabase = supabaseServiceClient()

  const { data: created, error: adminErr } = await supabase.auth.admin.createUser({
    email, password, email_confirm: false
  })
  if (adminErr || !created.user) {
    return NextResponse.json({ error: adminErr?.message || "failed_to_create_user" }, { status: 400 })
  }

  const userId = created.user.id
  const defaultClinicName = process.env.DEFAULT_CLINIC_NAME || "Clínica Exemplo"

  const clinRes = await supabase
    .from("clinicas")
    .upsert({ nome: defaultClinicName }, { onConflict: "nome" })
    .select("id")
    .single()
  if (clinRes.error) {
    return NextResponse.json({ error: clinRes.error.message }, { status: 500 })
  }

  const profileRes = await supabase
    .from("perfis_usuarios")
    .insert({
      user_id: userId,
      clinica_id: clinRes.data.id,
      nome,
      role: "ADMIN"
    })
  if (profileRes.error) {
    return NextResponse.json({ error: profileRes.error.message }, { status: 500 })
  }

  return new NextResponse(null, { status: 201 })
}
