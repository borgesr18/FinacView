# API (OpenAPI)

Descrição
- REST endpoints no App Router em /app/api/*
- OpenAPI gerado em runtime e servido em:
  - GET /api/openapi.json
  - GET /api/docs (Swagger UI)

Módulos mínimos
- Auth
  - POST /api/auth/register — cria usuário (Service Role) e perfis_usuarios (role=ADMIN) na clínica default
- Dashboard
  - GET /api/dashboard/kpis?from=YYYY-MM&amp;to=YYYY-MM
- Pacientes
  - GET /api/pacientes
  - POST /api/pacientes
- Planos
  - GET /api/planos
  - POST /api/planos
- Matrículas
  - GET /api/matriculas
  - POST /api/matriculas
  - POST /api/matriculas/{id}/encerrar
  - POST /api/matriculas/{id}/pausar
- Faturas
  - POST /api/faturas/generate
  - GET /api/faturas
  - POST /api/faturas
- Pagamentos
  - POST /api/pagamentos
- Atendimentos
  - GET /api/atendimentos
  - POST /api/atendimentos
- ETL
  - POST /api/etl/import

Autenticação
- Supabase Auth via JWT do usuário (Authorization: Bearer)
- Rotas server-side, sem uso do SERVICE_ROLE_KEY no cliente

Validação
- Zod schemas por endpoint
- Respostas tipadas

Códigos de status
- 200/201 para sucesso
- 400/422 validação
- 401/403 auth/rls
- 404 não encontrado
- 409 conflito (idempotência)
- 500 erro interno

Observações
- Rate-limit básico em escrita
- Paginação e filtros nas listagens
