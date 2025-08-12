# ETL — Importação da Planilha

Arquivo: /data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
Biblioteca: xlsx (Node).
Script: scripts/etl.ts com flags --dry e --commit, relatórios CSV/JSON em scripts/reports/etl-&lt;timestamp&gt;.(csv|json)

Abas e Mapeamentos

LISTA DE MATRÍCULAS
- Paciente: NOME → pacientes.nome (normalizar)
- Plano (Pilates): parse PLANO usando regex /(\d+)X\s*-\s*(MENSAL|TRIMESTRAL|SEMESTRAL|ANUAL)/i
  - modalidade='PILATES'
  - nome = "{freq}x/semana - {periodicidade}"
- Matrícula: DATA INÍCIO / DATA TÉRMINO (vazio → null)
- Valores:
  - valor_mensal = VALOR MENSAL. DESC. se presente, senão VALOR MENSALIDADE
  - valor_pacote = VALOR FINAL/VALOR TOTAL se existir
  - descontos tentar extrair; senão null
- Forma pagamento: mapear para PIX|ESPECIE|CARTAO|TRANSFERENCIA
- Status:
  - DATA_TÉRMINO ≥ hoje → ATIVA
  - &lt; hoje → ENCERRADA
  - vazio → ATIVA
- Clínica: associar à default do seed

ATENDIMENTOS CONSULTÓRIO
- Colunas 1..15 com datas ou “REMARCAR”/“FALTOU”
- Para datas válidas: tipo='CONSULTORIO', status='REALIZADO'
- “REMARCAR”: status='REMARCADO' (data se presente)
- “FALTOU”: status='FALTOU'
- Match por pacientes.nome (exato preferido)

FATURAMENTO 2024 - 2025 ATUALIZ
- Colunas por mês (YYYY-MM)
- Célula numérica → criar pagamento:
  - data_pagamento = dia 05 do mês
  - valor = número da célula
  - vincular a fatura da competência; senão criar
- Ignorar “-” e textos (logar)
- Idempotência: hash linha+coluna+paciente

Regras de robustez
- Conversão numérica considerando pt-BR
- Upserts e chaves naturais
- Relatório: inserted/updated/skipped/errors por aba
- CSVs de inconsistências

Execução
- Dry-run:
  - pnpm etl:import --dry --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
- Commit:
  - pnpm etl:import --commit --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx
