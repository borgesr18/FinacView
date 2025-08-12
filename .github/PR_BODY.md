Milestone 1: Docs & Setup — PRD, ARCHITECTURE, API stub, Next.js bootstrap, Makefile e 0001_init.sql

Solicitante: FinacView — pedido por borgesr18 (GitHub: @borgesr18)
Link to Devin run: https://app.devin.ai/sessions/19f52f9ef42f4dd9b80d80d2d39fcfb6

Resumo
- Criação de docs iniciais: PRD, ARCHITECTURE, API, ETL-SPEC.
- Scaffolding do repositório conforme estrutura definida.
- Bootstrap do Next.js 14 (App Router) + TypeScript + Tailwind.
- Rotas iniciais: /api/openapi (spec stub) e /api/docs (Swagger UI).
- Scripts placeholders: migrate/seed/etl/healthcheck.
- CI: GitHub Actions com lint, typecheck e build.
- Migração 0001_init.sql: schema completo + RLS + views + funções + triggers.
- Makefile + README com passos.

Checklist da Milestone
- [x] docs/PRD.md
- [x] docs/ARCHITECTURE.md
- [x] docs/API.md (OpenAPI stub)
- [x] docs/ETL-SPEC.md
- [x] Estrutura do repo (app, lib, components, scripts, db/{migrations,seed}, docs, tests, public, data)
- [x] Next.js 14 + Tailwind bootstrap
- [x] /api/openapi e /api/docs
- [x] .env.example
- [x] 0001_init.sql (tabelas, views, funções, triggers, RLS)
- [x] Makefile
- [x] CI básico (lint, typecheck, build)

Como testar
1) pnpm i
2) pnpm typecheck
3) pnpm build
4) Acessar /api/openapi e /api/docs em dev para ver o stub do OpenAPI/Swagger.
5) Conferir db/migrations/0001_init.sql (script único com schema e RLS).

Notas
- Próximas milestones cobrirão seed, auth, CRUDs, financeiro, atendimentos, dashboard, ETL real e testes (unit/e2e), além de deploy Vercel + Supabase e cron.
