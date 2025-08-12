
begin;

create extension if not exists pgcrypto;


create table if not exists clinicas (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists perfis_usuarios (
  user_id uuid primary key,
  clinica_id uuid not null references clinicas(id) on delete cascade,
  nome text not null,
  role text not null check (role in ('ADMIN','FINANCEIRO','INSTRUTOR','RECEPCAO')),
  created_at timestamptz not null default now()
);

create table if not exists pacientes (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  documento text,
  created_at timestamptz not null default now()
);

create table if not exists planos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  nome text not null,
  modalidade text not null check (modalidade in ('PILATES','CONSULTORIO')),
  frequencia_semana int,
  periodicidade text check (periodicidade in ('MENSAL','TRIMESTRAL','SEMESTRAL','ANUAL')),
  sessoes_inclusas int,
  preco_mensal numeric(12,2),
  preco_pacote numeric(12,2),
  ativo boolean not null default true
);

create table if not exists matriculas (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  paciente_id uuid not null references pacientes(id) on delete cascade,
  plano_id uuid not null references planos(id),
  data_inicio date not null,
  data_termino date,
  desconto_percentual numeric(5,2),
  desconto_valor numeric(12,2),
  valor_mensal numeric(12,2),
  valor_pacote numeric(12,2),
  forma_pagamento_preferida text check (forma_pagamento_preferida in ('PIX','ESPECIE','CARTAO','TRANSFERENCIA')),
  status text not null check (status in ('ATIVA','PAUSADA','ENCERRADA')) default 'ATIVA'
);

create table if not exists faturas (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  matricula_id uuid not null references matriculas(id) on delete cascade,
  competencia date not null,
  valor numeric(12,2) not null,
  vencimento date not null,
  status text not null check (status in ('ABERTA','PAGA','ATRASADA','CANCELADA')) default 'ABERTA',
  observacoes text,
  created_at timestamptz not null default now(),
  unique (matricula_id, competencia)
);

create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  fatura_id uuid not null references faturas(id) on delete cascade,
  data_pagamento date not null,
  valor numeric(12,2) not null check (valor >= 0),
  metodo text not null check (metodo in ('PIX','ESPECIE','CARTAO','TRANSFERENCIA')),
  comprovante_url text,
  created_at timestamptz not null default now()
);

create table if not exists atendimentos (
  id uuid primary key default gen_random_uuid(),
  clinica_id uuid not null references clinicas(id) on delete cascade,
  matricula_id uuid references matriculas(id) on delete set null,
  data timestamptz not null,
  tipo text not null check (tipo in ('PILATES','CONSULTORIO')),
  status text not null check (status in ('REALIZADO','REMARCADO','FALTOU')),
  profissional text,
  observacoes text,
  created_at timestamptz not null default now()
);

create table if not exists saldos_consultorio (
  matricula_id uuid primary key references matriculas(id) on delete cascade,
  sessoes_total int not null default 0,
  sessoes_utilizadas int not null default 0
);

create schema if not exists auth;

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create or replace function auth.clinica_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.clinica_id
  from perfis_usuarios p
  where p.user_id = auth.uid()
$$;


create or replace view vw_receita_mensal as
select
  date_trunc('month', p.data_pagamento)::date as mes,
  sum(p.valor) as receita
from pagamentos p
group by 1
order by 1;

create or replace view vw_renovacoes_proximas as
select m.*
from matriculas m
where m.status = 'ATIVA'
  and m.data_termino is not null
  and m.data_termino between current_date and (current_date + interval '30 days');


create or replace function reconciliar_fatura(fid uuid)
returns void
language plpgsql
as $$
declare
  total_pago numeric(12,2);
  f_valor numeric(12,2);
begin
  select coalesce(sum(valor),0) into total_pago from pagamentos where fatura_id = fid;
  select valor into f_valor from faturas where id = fid;
  if f_valor is null then
    return;
  end if;
  if total_pago >= f_valor then
    update faturas set status = 'PAGA' where id = fid;
  else
    update faturas set status = 'ABERTA' where id = fid and status <> 'CANCELADA';
  end if;
end;
$$;


create or replace function trg_pagamentos_reconcile()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' or tg_op = 'UPDATE' then
    perform reconciliar_fatura(NEW.fatura_id);
  elsif tg_op = 'DELETE' then
    perform reconciliar_fatura(OLD.fatura_id);
  end if;
  return null;
end;
$$;

drop trigger if exists pagamentos_reconcile_aiud on pagamentos;
create trigger pagamentos_reconcile_aiud
after insert or update or delete on pagamentos
for each row execute procedure trg_pagamentos_reconcile();


create or replace function trg_atendimentos_consultorio_saldo()
returns trigger
language plpgsql
as $$
begin
  if NEW.tipo = 'CONSULTORIO' and NEW.status = 'REALIZADO' and NEW.matricula_id is not null then
    insert into saldos_consultorio (matricula_id, sessoes_total, sessoes_utilizadas)
    values (NEW.matricula_id, 0, 1)
    on conflict (matricula_id) do update
      set sessoes_utilizadas = saldos_consultorio.sessoes_utilizadas + 1;
  end if;
  return NEW;
end;
$$;

drop trigger if exists atendimentos_consultorio_realizado_ai on atendimentos;
create trigger atendimentos_consultorio_realizado_ai
after insert on atendimentos
for each row execute procedure trg_atendimentos_consultorio_saldo();


alter table clinicas enable row level security;
alter table perfis_usuarios enable row level security;
alter table pacientes enable row level security;
alter table planos enable row level security;
alter table matriculas enable row level security;
alter table faturas enable row level security;
alter table pagamentos enable row level security;
alter table atendimentos enable row level security;
alter table saldos_consultorio enable row level security;

create policy sel_clinicas on clinicas
  for select using (id = auth.clinica_id());

create policy sel_perfis on perfis_usuarios
  for select using (clinica_id = auth.clinica_id());

create policy sel_pacientes on pacientes
  for select using (clinica_id = auth.clinica_id());

create policy sel_planos on planos
  for select using (clinica_id = auth.clinica_id());

create policy sel_matriculas on matriculas
  for select using (clinica_id = auth.clinica_id());

create policy sel_faturas on faturas
  for select using (clinica_id = auth.clinica_id());

create policy sel_pagamentos on pagamentos
  for select using (clinica_id = auth.clinica_id());

create policy sel_atendimentos on atendimentos
  for select using (clinica_id = auth.clinica_id());

create policy sel_saldos on saldos_consultorio
  for select using (
    exists (
      select 1 from matriculas m
      where m.id = saldos_consultorio.matricula_id
        and m.clinica_id = auth.clinica_id()
    )
  );

create policy wrt_perfis on perfis_usuarios
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_pacientes on pacientes
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN','FINANCEIRO','RECEPCAO'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_planos on planos
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN','FINANCEIRO'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_matriculas on matriculas
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN','FINANCEIRO','RECEPCAO'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_faturas on faturas
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN','FINANCEIRO'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_pagamentos on pagamentos
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN','FINANCEIRO'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_atendimentos on atendimentos
  for all
  using (clinica_id = auth.clinica_id() and (select role from perfis_usuarios where user_id = auth.uid()) in ('ADMIN','INSTRUTOR','RECEPCAO'))
  with check (clinica_id = auth.clinica_id());

create policy wrt_saldos on saldos_consultorio
  for all
  using (
    exists (
      select 1 from matriculas m
      join perfis_usuarios p on p.clinica_id = m.clinica_id and p.user_id = auth.uid()
      where m.id = saldos_consultorio.matricula_id
        and m.clinica_id = auth.clinica_id()
        and p.role in ('ADMIN','INSTRUTOR','FINANCEIRO')
    )
  )
  with check (true);

create index if not exists idx_perfis_usuarios_clinica on perfis_usuarios (clinica_id);
create index if not exists idx_perfis_usuarios_role on perfis_usuarios (role);

create index if not exists idx_pacientes_clinica on pacientes (clinica_id);
create index if not exists idx_pacientes_documento on pacientes (documento);

create index if not exists idx_planos_clinica on planos (clinica_id);
create index if not exists idx_planos_modalidade on planos (modalidade);

create index if not exists idx_matriculas_clinica on matriculas (clinica_id);
create index if not exists idx_matriculas_paciente on matriculas (paciente_id);
create index if not exists idx_matriculas_plano on matriculas (plano_id);
create index if not exists idx_matriculas_status on matriculas (status);

create index if not exists idx_faturas_clinica on faturas (clinica_id);
create index if not exists idx_faturas_matricula on faturas (matricula_id);
create index if not exists idx_faturas_status on faturas (status);
create index if not exists idx_faturas_vencimento on faturas (vencimento);

create index if not exists idx_pagamentos_clinica on pagamentos (clinica_id);
create index if not exists idx_pagamentos_fatura on pagamentos (fatura_id);
create index if not exists idx_pagamentos_data on pagamentos (data_pagamento);

create index if not exists idx_atendimentos_clinica on atendimentos (clinica_id);
create index if not exists idx_atendimentos_matricula on atendimentos (matricula_id);
create index if not exists idx_atendimentos_data on atendimentos (data);
create index if not exists idx_atendimentos_tipo on atendimentos (tipo);
create index if not exists idx_atendimentos_status on atendimentos (status);

commit;
