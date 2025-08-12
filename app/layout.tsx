import "./globals.css"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "FinacView",
  description: "Sistema de Gestão de Clínica de Pilates",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
