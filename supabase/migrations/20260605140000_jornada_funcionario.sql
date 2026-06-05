-- Jornada diária (em horas) configurável por funcionário.
-- Usada no espelho de ponto / banco de horas. Padrão CLT = 8h/dia.
alter table public.employees
  add column if not exists jornada_horas numeric not null default 8;
