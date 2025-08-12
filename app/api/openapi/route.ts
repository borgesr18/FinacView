import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function GET() {
  const spec = {
    openapi: "3.0.3",
    info: {
      title: "FinacView API",
      version: "0.1.0"
    },
    components: {
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "object", nullable: true }
          }
        },
        PacienteCreate: {
          type: "object",
          required: ["nome"],
          properties: {
            nome: { type: "string", minLength: 2 },
            telefone: { type: "string", minLength: 8, nullable: true },
            email: { type: "string", format: "email", nullable: true },
            documento: { type: "string", minLength: 5, nullable: true }
          }
        },
        PlanoCreate: {
          type: "object",
          required: ["nome", "modalidade"],
          properties: {
            nome: { type: "string", minLength: 2 },
            modalidade: { type: "string", enum: ["PILATES", "CONSULTORIO"] },
            frequencia_semana: { type: "integer", minimum: 0, maximum: 7, nullable: true },
            periodicidade: { type: "string", enum: ["MENSAL","TRIMESTRAL","SEMESTRAL","ANUAL"], nullable: true },
            sessoes_inclusas: { type: "integer", minimum: 0, nullable: true },
            preco_mensal: { type: "number", minimum: 0, nullable: true },
            preco_pacote: { type: "number", minimum: 0, nullable: true },
            ativo: { type: "boolean", default: true }
          }
        },
        MatriculaCreate: {
          type: "object",
          required: ["paciente_id", "plano_id", "data_inicio"],
          properties: {
            paciente_id: { type: "string", format: "uuid" },
            plano_id: { type: "string", format: "uuid" },
            data_inicio: { type: "string" },
            data_termino: { type: "string", nullable: true },
            desconto_percentual: { type: "number", minimum: 0, maximum: 100, nullable: true },
            desconto_valor: { type: "number", minimum: 0, nullable: true },
            valor_mensal: { type: "number", minimum: 0, nullable: true },
            valor_pacote: { type: "number", minimum: 0, nullable: true },
            forma_pagamento_preferida: { type: "string", enum: ["PIX","ESPECIE","CARTAO","TRANSFERENCIA"], nullable: true },
            status: { type: "string", enum: ["ATIVA","PAUSADA","ENCERRADA"], default: "ATIVA" }
          }
        },
        PagamentoCreate: {
          type: "object",
          required: ["fatura_id", "valor", "metodo"],
          properties: {
            fatura_id: { type: "string", format: "uuid" },
            data_pagamento: { type: "string" },
            valor: { type: "number", minimum: 0.01 },
            metodo: { type: "string", enum: ["PIX","ESPECIE","CARTAO","TRANSFERENCIA"] },
            comprovante_url: { type: "string", format: "uri" }
          }
        },
        AtendimentoCreate: {
          type: "object",
          required: ["matricula_id", "data", "tipo", "status"],
          properties: {
            matricula_id: { type: "string", format: "uuid" },
            data: { type: "string" },
            tipo: { type: "string", enum: ["PILATES","CONSULTORIO"] },
            status: { type: "string", enum: ["REALIZADO","REMARCADO","FALTOU"] },
            profissional: { type: "string", minLength: 2 },
            observacoes: { type: "string", maxLength: 1000 }
          }
        }
      },
      responses: {
        ValidationError: { description: "Validation error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        RateLimited: { description: "Rate limited", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } }
      }
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
        post: {
          summary: "Criar paciente",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/PacienteCreate" } } }
          },
          responses: {
            "201": { description: "Criado" },
            "400": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/RateLimited" }
          }
        }
      },
      "/api/planos": {
        get: { summary: "Listar planos", responses: { "200": { description: "OK" } } },
        post: {
          summary: "Criar plano",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/PlanoCreate" } } }
          },
          responses: {
            "201": { description: "Criado" },
            "400": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/RateLimited" }
          }
        }
      },
      "/api/matriculas": {
        get: { summary: "Listar matrículas", responses: { "200": { description: "OK" } } },
        post: {
          summary: "Criar matrícula",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/MatriculaCreate" } } }
          },
          responses: {
            "201": { description: "Criado" },
            "400": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/RateLimited" }
          }
        }
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
        post: {
          summary: "Registrar pagamento",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/PagamentoCreate" } } }
          },
          responses: {
            "201": { description: "Criado" },
            "400": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/RateLimited" }
          }
        }
      },
      "/api/atendimentos": {
        get: { summary: "Listar atendimentos", responses: { "200": { description: "OK" } } },
        post: {
          summary: "Cadastrar atendimento",
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/AtendimentoCreate" } } }
          },
          responses: {
            "201": { description: "Criado" },
            "400": { $ref: "#/components/responses/ValidationError" },
            "429": { $ref: "#/components/responses/RateLimited" }
          }
        }
      },
      "/api/etl/import": {
        post: { summary: "Executar ETL de importação", responses: { "202": { description: "Aceito" } } }
      }
    }
  }
  return NextResponse.json(spec)
}
