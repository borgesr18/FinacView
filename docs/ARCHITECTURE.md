# ARCHITECTURE

Visão Geral
- Frontend: Next.js 14 App Router (TypeScript, Tailwind, shadcn)
- Backend: Route Handlers e Server Actions (Node.js) com Supabase
- Banco: Supabase Postgres (RLS, views, funções, triggers)
- Auth: Supabase Auth
- Storage: Supabase Storage (comprovantes)
- Observabilidade: logger pino/winston; Sentry opcional
- Deploy: Vercel; Cron para jobs
## Auth & Perfis

- Middleware protege rotas de aplicação e redireciona usuários não autenticados para /login.
- Registro: POST /api/auth/register usa SUPABASE_SERVICE_ROLE_KEY (server-side) para criar o usuário e um perfil ADMIN em perfis_usuarios associado à clínica default (DEFAULT_CLINIC_NAME).
- No cliente, o Supabase usa apenas NEXT_PUBLIC_SUPABASE_ANON_KEY e nunca o Service Role.


Diagrama (alto nível)
[Browser] ⇄ [Next.js App Router]
  ├─ Server Actions/Route Handlers (API REST)
  │   ├─ Supabase JS (server-side)
  │   └─ RLS (por clinica_id e roles)
  └─ UI (shadcn + Tailwind)

[Supabase]
  ├─ Postgres (tabelas, views, funções, triggers)
  ├─ Auth (users, perfis_usuarios)
  └─ Storage (comprovantes)

Domínio de Dados (tabelas)
- clinicas
- perfis_usuarios
- pacientes
- planos
- matriculas
- faturas
- pagamentos
- atendimentos
- saldos_consultorio

Views
- vw_receita_mensal
- vw_renovacoes_proximas

Funções/Triggers
- auth.clinica_id()
- reconciliar_fatura(fid)
- Trigger em pagamentos → reconciliar_fatura
- Trigger em atendimentos consultório → incrementa saldos

Decisões
- App Router para unificar páginas e APIs
- Zod para validação
- RLS obrigatória: toda query contextualizada por clinica_id do usuário via função helper
- Rate limiting básico em endpoints de escrita
- ETL em Node com xlsx, gerando relatórios
- Idempotência em faturas/pagamentos por chaves naturais e hash

Ambiente
- .env example com chaves Supabase
- Scripts: migrate, seed, etl:import, healthcheck
- CI: lint, typecheck, unit/e2e, build

Segurança
- Proibir SERVICE_ROLE_KEY no cliente
- RLS end-to-end
- Sanitização de uploads
- Remoção de PII desnecessária em logs

Escalabilidade
- Índices nas chaves de busca/uniqueness
- Views materiais futuras (se necessário)
- Paginação e filtros em endpoints
