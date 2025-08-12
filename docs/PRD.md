# PRD — Sistema de Gestão de Clínica de Pilates

Projeto: Sistema de Gestão de Clínica de Pilates (multi-clínica)
Stack: Next.js 14 (App Router) + TypeScript + Tailwind/shadcn | Supabase (Postgres + Auth + Storage + RLS) | Node.js APIs (server actions/route handlers) | Deploy Vercel com Cron

1) Objetivo
Construir um sistema web multi-clínica para:
- Cadastros: pacientes, planos (Pilates/Consultório), matrículas.
- Financeiro: faturas mensais (Pilates), pagamentos, conciliação, relatórios.
- Operacional: atendimentos (agenda/lista) para Pilates e consultório (com saldo de sessões).
- ETL: importar a planilha histórica como base inicial, com saneamento de dados.
- Relatórios/KPIs: receita por mês, ativos, renovações 30 dias, no-show.

Personas & papéis
- ADMIN: total
- FINANCEIRO: financeiro e relatórios
- INSTRUTOR: atendimentos/agenda
- RECEPCAO: cadastro básico e marcações

Métricas-chaves
- Receita mensal, MRR (baseada em faturas pagas), matrículas ativas, renovações em 7/15/30 dias, no-show rate.

2) Escopo funcional
- Autenticação e perfis multi-clínica
- CRUDs: pacientes, planos, matrículas
- Faturamento: geração de faturas, registro de pagamentos, reconciliação automática
- Atendimentos: registro/listagem, status (REALIZADO/REMARCADO/FALTOU), saldo consultório
- Dashboard: KPIs e gráficos
- ETL: importação Excel, idempotência, relatórios
- Jobs/Cron: geração de faturas e lembretes

3) Restrições e Assunções
- Supabase com RLS em todas as tabelas de domínio
- Nunca expor SERVICE_ROLE_KEY no cliente; apenas em rotas server-side
- Tabela e políticas por clinica_id (isolamento)
- ETL idempotente; logs e relatórios CSV/JSON
- TypeScript estrito; validação com Zod
- UI com Tailwind e shadcn
- Deploy Vercel; cron de rotas

4) Critérios de Aceite
- Deploy Vercel online + Supabase conectado
- RLS ativa e testada (teste prova isolamento)
- Auth (login/registro/recuperar) funcional
- Dashboard com KPIs + gráfico
- CRUDs completos
- Faturamento e reconciliação autom.
- Atendimentos filtráveis, no-show
- ETL real rodando e idempotente
- /api/openapi.json + /api/docs
- README com passo a passo
- Coleção Postman/Insomnia em docs/

5) Não escopo (fase 1)
- Notificações via WhatsApp/SMS
- Integrações com gateways de pagamento
- Multi-idioma

6) Dependências externas
- Supabase Project (Postgres, Auth, Storage)
- Vercel (Deploy + Cron)
- Sentry opcional

7) Riscos
- Qualidade/variedade do Excel inicial
- Regras de conciliação/parcelas variáveis
- Performance de ETL em dataset grande

8) Roadmap (Milestones)
1. Docs & Setup
2. DB & RLS
3. Auth & Perfis
4. API básica
5. Financeiro
6. Atendimentos
7. Dashboard
8. ETL
9. E2E & CI
10. Polimento & Deploy
