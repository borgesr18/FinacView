"use client"
import { useState } from "react"
import Link from "next/link"
import { supabaseBrowserClient } from "@/lib/supabase/client"

export default function ForgotPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const supabase = supabaseBrowserClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window !== "undefined" ? `${window.location.origin}/login` : undefined
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Recuperar senha</h1>
      {sent ? (
        <p className="text-green-700">Se existir, enviamos um email com instruções.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button className="w-full bg-black text-white rounded px-3 py-2">Enviar</button>
        </form>
      )}
      <div className="mt-4 text-sm">
        <Link href="/login" className="underline">Voltar</Link>
      </div>
    </main>
  )
}
