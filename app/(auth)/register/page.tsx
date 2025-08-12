"use client"
import { useState } from "react"
import Link from "next/link"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nome, setNome] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, nome })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j?.error || "Falha ao registrar")
      } else {
        setOk(true)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Criar conta</h1>
      {ok ? (
        <div className="space-y-2">
          <p className="text-green-700">Conta criada. Verifique seu e-mail para confirmar e depois faça o login.</p>
          <Link href="/login" className="underline">Ir para login</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="w-full border rounded px-3 py-2" placeholder="Nome" value={nome} onChange={e=>setNome(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="w-full border rounded px-3 py-2" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button disabled={submitting} className="w-full bg-black text-white rounded px-3 py-2">{submitting ? "Registrando..." : "Registrar"}</button>
        </form>
      )}
      <div className="mt-4 text-sm">
        <Link href="/login" className="underline">Já tenho conta</Link>
      </div>
    </main>
  )
}
