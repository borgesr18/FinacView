"use client"
import { useEffect, useState } from "react"
import { supabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const [email, setEmail] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = supabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = supabaseBrowserClient()
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button onClick={handleSignOut} disabled={signingOut} className="underline">
          {signingOut ? "Saindo..." : "Sair"}
        </button>
      </div>
      <p className="mt-4 text-sm text-gray-600">Olá, {email ?? "usuário"}.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded border p-4">Receita do mês</div>
        <div className="rounded border p-4">MRR</div>
        <div className="rounded border p-4">Matrículas ativas</div>
        <div className="rounded border p-4">Renovações 30d</div>
      </div>
    </main>
  )
}
