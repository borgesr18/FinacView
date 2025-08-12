# FinacView — Sistema de Gestão de Clínica de Pilates

Stack: Next.js 14 (App Router) + TypeScript + Tailwind/shadcn | Supabase (Postgres + Auth + Storage + RLS) | Node.js APIs | Deploy Vercel

Docs
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/API.md
- docs/ETL-SPEC.md

Estrutura
.
├─ app/
│  ├─ api/
│  ├─ (auth)/
│  ├─ dashboard/
│  ├─ pacientes/
│  ├─ matriculas/
│  ├─ faturamento/
│  ├─ atendimentos/
│  └─ configuracoes/
├─ lib/
├─ components/
├─ scripts/
├─ db/
│  ├─ migrations/
│  └─ seed/
├─ docs/
├─ public/
├─ tests/
├─ data/
├─ .env.example
└─ package.json

Comandos (quando implementados)
- Local: pnpm i → pnpm db:migrate → pnpm db:seed → pnpm dev
- ETL (dry): pnpm etl:import --dry --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
- ETL (commit): pnpm etl:import --commit --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
- Build: pnpm build
- Testes: pnpm test / pnpm test:e2e

Milestones
1) Docs & Setup
2) DB & RLS
3) Auth & Perfis
4) API básica
5) Financeiro
6) Atendimentos
7) Dashboard
8) ETL
9) E2E & CI
10) Polimento & Deploy

Pasta de dados
- Coloque o arquivo real em /data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx para o ETL.
