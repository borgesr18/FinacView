# FinacView — Sistema de Gestão de Clínica de Pilates

Stack: Next.js 14 (App Router) + TypeScript + Tailwind/shadcn | Supabase (Postgres + Auth + Storage + RLS) | Node.js APIs | Deploy Vercel

Docs
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/API.md
- docs/ETL-SPEC.md
- Swagger UI: /api/docs
- Postman: docs/FinacView.postman_collection.json

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
├─ Makefile
└─ package.json

Setup local
1) Copie .env.example para .env.local e preencha as variáveis (URLs/keys do Supabase).
2) Instale dependências:
   - pnpm i
3) Migração e seed iniciais:
   - pnpm db:migrate
   - pnpm db:seed
4) Suba o dev:
   - pnpm dev

Comandos
- Lint/Typecheck: pnpm lint · pnpm typecheck
- Build/Start: pnpm build · pnpm start
- DB: pnpm db:migrate · pnpm db:seed
- ETL (dry): pnpm etl:import --dry --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
- ETL (commit): pnpm etl:import --commit --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
- Testes: pnpm test · pnpm test:e2e
- Healthcheck: pnpm tsx scripts/healthcheck.ts

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
