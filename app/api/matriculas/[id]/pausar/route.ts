import { NextResponse } from "next/server"
import { supabaseRouteClient } from "@/lib/supabase/user"

export const runtime = "nodejs"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = supabaseRouteClient(req)
  const id = params.id
  const { data, error } = await supabase
    .from("matriculas")
    .update({ status: "PAUSADA" })
    .eq("id", id)
    .select("*")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
