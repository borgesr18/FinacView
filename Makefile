SHELL := /bin/bash

.PHONY: setup dev build start lint typecheck format db-migrate db-seed etl-dry etl-commit test test-e2e health

setup:
	@echo "Installing dependencies with pnpm"
	pnpm i

dev:
	pnpm dev

build:
	pnpm build

start:
	pnpm start

lint:
	pnpm lint

typecheck:
	pnpm typecheck

format:
	pnpm format

db-migrate:
	pnpm db:migrate

db-seed:
	pnpm db:seed

etl-dry:
	pnpm etl:import --dry --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx

etl-commit:
	pnpm etl:import --commit --file ./data/LISTA_DE_MATRICULAS_E_FATURAMENTO.xlsx

test:
	pnpm test

test-e2e:
	pnpm test:e2e

health:
	pnpm tsx scripts/healthcheck.ts
