-- =====================================================================
-- Migration 005 : rendement automatique du solde des clients
--   Après un crédit, le solde augmente de `yield_rate_percent` % toutes les `yield_period_minutes` minutes
--   (par défaut 5 % toutes les 1 440 min = 24 h), intérêts composés.
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql, 002, 003 et 004. Script idempotent.
--
-- Fonctionnement : le rendement est calculé "à la demande", de façon exacte et idempotente. À chaque lecture d'un
-- tableau de bord, ou avant un crédit ou un retrait, on applique toutes les périodes écoulées depuis `yield_at`
-- (qui avance de périodes entières, jamais de "maintenant", donc aucun temps n'est perdu ni compté deux fois).
-- Aucune tâche planifiée n'est nécessaire.
-- =====================================================================

-- ---------- paramètres (modifiables par le super admin ; 0 désactive le rendement) ----------
insert into public.settings (key, value) values
  ('yield_rate_percent', '5'),
  ('yield_period_minutes', '1440')
on conflict (key) do nothing;

-- ---------- nouveau type de transaction ----------
alter table public.transactions drop constraint if exists transactions_type_check;
alter table public.transactions add constraint transactions_type_check
  check (type in ('deposit', 'withdrawal', 'client_credit', 'admin_credit', 'admin_fee', 'yield'));

-- date jusqu'à laquelle le rendement a été appliqué
alter table public.profiles add column if not exists yield_at timestamptz;

-- ---------- application du rendement à UN client (fonction interne, verrouille la ligne) ----------
create or replace function public.accrue_yield_internal(p_client uuid) returns bigint
language plpgsql security definer set search_path = public as $$
declare
  cl profiles;
  rate bigint := get_setting_int('yield_rate_percent', 5);
  per  bigint := get_setting_int('yield_period_minutes', 1440);
  n int; i int; bal bigint; gain bigint := 0; g bigint;
begin
  if rate <= 0 or per <= 0 then return 0; end if;
  select * into cl from profiles where id = p_client and role = 'client' and status = 'active' for update;
  if not found or cl.balance <= 0 then return 0; end if;

  if cl.yield_at is null then            -- première fois : le décompte démarre maintenant
    update profiles set yield_at = now() where id = p_client;
    return 0;
  end if;

  n := floor(extract(epoch from (now() - cl.yield_at)) / (per * 60));
  if n <= 0 then return 0; end if;
  n := least(n, 1000);                   -- garde-fou : jamais plus de 1 000 périodes d'un coup

  bal := cl.balance;
  for i in 1..n loop                     -- intérêts composés : chaque période porte sur le solde déjà augmenté
    g := round(bal::numeric * rate / 100)::bigint;
    bal := bal + g;
    gain := gain + g;
  end loop;

  update profiles set balance = bal, yield_at = cl.yield_at + ((n * per) || ' minutes')::interval where id = p_client;
  if gain > 0 then
    insert into transactions (type, amount, to_user) values ('yield', gain, p_client);
  end if;
  return gain;
end $$;

-- ---------- appel depuis le serveur : un client, les clients d'un admin, ou tous ----------
create or replace function public.rpc_accrue_yield(p_admin uuid, p_client uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; total bigint := 0; cnt int := 0; g bigint;
begin
  for r in select id from profiles
           where role = 'client' and status = 'active' and balance > 0
             and (p_client is null or id = p_client)
             and (p_admin is null or created_by = p_admin) loop
    g := accrue_yield_internal(r.id);
    total := total + g;
    if g > 0 then cnt := cnt + 1; end if;
  end loop;
  return jsonb_build_object('ok', true, 'total', total, 'clients', cnt);
end $$;

-- ---------- crédit d'un client : on applique d'abord le rendement dû, puis on démarre le décompte si le solde était vide ----------
create or replace function public.rpc_admin_credit_client(p_admin uuid, p_client uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  perform 1 from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;

  perform accrue_yield_internal(p_client);
  update profiles
     set balance = balance + p_amount,
         yield_at = case when balance <= 0 or yield_at is null then now() else yield_at end
   where id = p_client and role = 'client' and created_by = p_admin and status = 'active';
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  insert into transactions (type, amount, from_user, to_user) values ('client_credit', p_amount, p_admin, p_client);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- retrait : le rendement dû est appliqué avant de vérifier le solde ----------
create or replace function public.rpc_client_withdraw(p_client uuid, p_amount bigint, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c withdrawal_codes; cl profiles; mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  perform accrue_yield_internal(p_client);
  select * into cl from profiles where id = p_client and role = 'client' and status = 'active' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;

  select * into c from withdrawal_codes where code = upper(trim(p_code)) and client_id = p_client for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'CODE_INVALID'); end if;
  if c.status = 'used' then return jsonb_build_object('ok', false, 'error', 'CODE_USED'); end if;
  if c.status = 'expired' or c.expires_at <= now() then
    update withdrawal_codes set status = 'expired' where id = c.id and status = 'active';
    return jsonb_build_object('ok', false, 'error', 'CODE_EXPIRED');
  end if;
  if c.amount is not null and c.amount <> p_amount then
    return jsonb_build_object('ok', false, 'error', 'CODE_AMOUNT_MISMATCH', 'expected', c.amount);
  end if;
  if cl.balance < p_amount then return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_BALANCE'); end if;

  update profiles set balance = balance - p_amount where id = p_client;
  update withdrawal_codes set status = 'used', used_at = now() where id = c.id;
  insert into transactions (type, amount, from_user) values ('withdrawal', p_amount, p_client);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- droits d'exécution : service_role uniquement ----------
do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname in ('accrue_yield_internal','rpc_accrue_yield','rpc_admin_credit_client','rpc_client_withdraw') loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
