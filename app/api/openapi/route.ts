import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "FinacView API",
      version: "0.1.0"
    },
    paths: {
      "/api/dashboard/kpis": {
        get: {
          summary: "KPIs do dashboard",
          parameters: [
            { in: "query", name: "from", required: false, schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" } },
            { in: "query", name: "to", required: false, schema: { type: "string", pattern: "^\\d{4}-\\d{2}$" } }
          ],
          responses: { "200": { description: "OK" } }
        }
      },
      "/api/pacientes": {
        get: { summary: "Listar pacientes", responses: { "200": { description: "OK" } } },
        post: { summary: "Criar paciente", responses: { "201": { description: "Criado" } } }
      },
      "/api/planos": {
        get: { summary: "Listar planos", responses: { "200": { description: "OK" } } },
        post: { summary: "Criar plano", responses: { "201": { description: "Criado" } } }
      },
      "/api/matriculas": {
        get: { summary: "Listar matrículas", responses: { "200": { description: "OK" } } },
        post: { summary: "Criar matrícula", responses: { "201": { description: "Criado" } } }
      },
      "/api/matriculas/{id}/encerrar": {
        post: {
          summary: "Encerrar matrícula",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } }
        }
      },
      "/api/matriculas/{id}/pausar": {
        post: {
          summary: "Pausar matrícula",
          parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "OK" } }
        }
      },
      "/api/faturas/generate": {
        post: { summary: "Gerar faturas para período", responses: { "202": { description: "Aceito" } } }
      },
      "/api/faturas": {
        get: { summary: "Listar faturas", responses: { "200": { description: "OK" } } },
        post: { summary: "Criar fatura", responses: { "201": { description: "Criado" } } }
      },
      "/api/pagamentos": {
        post: { summary: "Registrar pagamento", responses: { "201": { description: "Criado" } } }
      },
      "/api/atendimentos": {
        get: { summary: "Listar atendimentos", responses: { "200": { description: "OK" } } },
        post: { summary: "Cadastrar atendimento", responses: { "201": { description: "Criado" } } }
      },
      "/api/etl/import": {
        post: { summary: "Executar ETL de importação", responses: { "202": { description: "Aceito" } } }
      }
    }
  }
  return NextResponse.json(spec)
}
