-- =====================================================================
-- CoinPulse : schéma complet (aucun vrai argent)
-- À exécuter une fois dans Supabase > SQL Editor.
-- Montants en FCFA (XOF), entiers (bigint).
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin','admin','client')),
  full_name   text not null,
  email       text not null,
  created_by  uuid references public.profiles(id) on delete set null,
  balance     bigint not null default 0 check (balance >= 0),   -- solde client
  credits     bigint not null default 0 check (credits >= 0),   -- crédits admin
  max_clients int    not null default 0 check (max_clients >= 0),
  created_at  timestamptz not null default now()
);
create index if not exists profiles_created_by_idx on public.profiles(created_by);
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.transactions (
  id         uuid primary key default gen_random_uuid(),
  type       text not null check (type in ('deposit','withdrawal','client_credit','admin_credit','admin_fee')),
  amount     bigint not null check (amount > 0),
  from_user  uuid references public.profiles(id) on delete set null,
  to_user    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists transactions_from_idx on public.transactions(from_user, created_at desc);
create index if not exists transactions_to_idx   on public.transactions(to_user, created_at desc);

create table if not exists public.withdrawal_codes (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  client_id  uuid not null references public.profiles(id) on delete cascade,
  admin_id   uuid not null references public.profiles(id) on delete cascade,
  amount     bigint check (amount is null or amount > 0),  -- optionnel : si défini, le retrait doit être de ce montant
  status     text not null default 'active' check (status in ('active','used','expired')),
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists codes_client_idx on public.withdrawal_codes(client_id, status);
create index if not exists codes_admin_idx  on public.withdrawal_codes(admin_id, created_at desc);

create table if not exists public.settings (
  key   text primary key,
  value text not null
);
insert into public.settings (key, value) values
  ('withdrawal_code_fee', '5000'),       -- crédits débités à l'admin par code généré
  ('withdrawal_code_ttl_minutes', '60'),  -- durée de validité d'un code
  ('max_operation_amount', '10000000')    -- garde-fou sur un dépôt / crédit / retrait
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- FONCTIONS D'AIDE POUR LA RLS (security definer => pas de récursion)
-- ---------------------------------------------------------------------
create or replace function public.auth_role() returns text
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false)
$$;

create or replace function public.is_my_client(p_user uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = p_user and created_by = auth.uid() and role = 'client')
$$;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Aucune policy d'écriture : TOUTES les écritures passent par les RPC
-- ci-dessous, appelables uniquement avec la clé service_role (serveur).
-- ---------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.transactions     enable row level security;
alter table public.withdrawal_codes enable row level security;
alter table public.settings         enable row level security;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using ( id = auth.uid() or public.is_super_admin() or created_by = auth.uid() );

drop policy if exists transactions_select on public.transactions;
create policy transactions_select on public.transactions for select to authenticated
  using (
    public.is_super_admin()
    or from_user = auth.uid() or to_user = auth.uid()
    or public.is_my_client(from_user) or public.is_my_client(to_user)
  );

-- Un client ne peut PAS lire les codes (sinon il contournerait l'admin et les frais).
drop policy if exists codes_select on public.withdrawal_codes;
create policy codes_select on public.withdrawal_codes for select to authenticated
  using ( public.is_super_admin() or admin_id = auth.uid() );

drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to authenticated using ( true );

-- Droits de table : lecture seule pour les utilisateurs connectés, rien pour anon.
revoke all on public.profiles, public.transactions, public.withdrawal_codes, public.settings from anon, authenticated;
grant select on public.profiles, public.transactions, public.withdrawal_codes, public.settings to authenticated;

-- ---------------------------------------------------------------------
-- RPC ATOMIQUES (security definer, verrous de ligne FOR UPDATE)
-- Elles retournent jsonb {ok:true,...} ou {ok:false,error:'CODE'} pour
-- les erreurs métier (pas d'exception => pas de rollback surprenant).
-- Elles sont réservées au rôle service_role.
-- ---------------------------------------------------------------------
create or replace function public.get_setting_int(p_key text, p_default bigint) returns bigint
language sql stable security definer set search_path = public as $$
  select coalesce((select value::bigint from public.settings where key = p_key), p_default)
$$;

-- Crée le profil d'un admin (l'utilisateur auth existe déjà).
create or replace function public.rpc_create_admin(
  p_super uuid, p_user uuid, p_email text, p_name text, p_credits bigint, p_max_clients int
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = p_super and role = 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if p_credits < 0 or p_max_clients < 0 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT');
  end if;
  insert into profiles (id, role, full_name, email, created_by, credits, max_clients)
  values (p_user, 'admin', p_name, p_email, p_super, p_credits, p_max_clients);
  if p_credits > 0 then
    insert into transactions (type, amount, from_user, to_user) values ('admin_credit', p_credits, p_super, p_user);
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- Crée le profil d'un client en respectant le quota (admin verrouillé => pas de course).
create or replace function public.rpc_create_client(
  p_admin uuid, p_user uuid, p_email text, p_name text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare a profiles; n int;
begin
  select * into a from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if a.credits <= 0 then return jsonb_build_object('ok', false, 'error', 'NO_CREDITS'); end if;
  select count(*) into n from profiles where created_by = p_admin and role = 'client';
  if n >= a.max_clients then return jsonb_build_object('ok', false, 'error', 'QUOTA_REACHED'); end if;
  insert into profiles (id, role, full_name, email, created_by) values (p_user, 'client', p_name, p_email, p_admin);
  return jsonb_build_object('ok', true);
end $$;

-- Le super admin ajoute des crédits à un admin.
create or replace function public.rpc_grant_admin_credits(
  p_super uuid, p_admin uuid, p_amount bigint
) returns jsonb language plpgsql security definer set search_path = public as $$
declare mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  if not exists (select 1 from profiles where id = p_super and role = 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  update profiles set credits = credits + p_amount where id = p_admin and role = 'admin';
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  insert into transactions (type, amount, from_user, to_user) values ('admin_credit', p_amount, p_super, p_admin);
  return jsonb_build_object('ok', true);
end $$;

-- Le super admin fixe le quota de clients d'un admin (jamais sous le nombre actuel).
create or replace function public.rpc_set_max_clients(
  p_super uuid, p_admin uuid, p_max int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not exists (select 1 from profiles where id = p_super and role = 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if p_max is null or p_max < 0 then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  perform 1 from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  select count(*) into n from profiles where created_by = p_admin and role = 'client';
  if p_max < n then return jsonb_build_object('ok', false, 'error', 'QUOTA_BELOW_CURRENT', 'current', n); end if;
  update profiles set max_clients = p_max where id = p_admin;
  return jsonb_build_object('ok', true);
end $$;

-- Modification d'un tarif (super admin uniquement).
create or replace function public.rpc_update_setting(
  p_super uuid, p_key text, p_value text
) returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = p_super and role = 'super_admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if p_value !~ '^[0-9]{1,12}$' then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  update settings set value = p_value where key = p_key;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- L'admin crédite le compte d'un de SES clients.
-- (Choix de conception : n'est pas débité des crédits de l'admin ; seuls les codes coûtent des crédits.)
create or replace function public.rpc_admin_credit_client(
  p_admin uuid, p_client uuid, p_amount bigint
) returns jsonb language plpgsql security definer set search_path = public as $$
declare mx bigint := get_setting_int('max_operation_amount', 10000000); a profiles;
begin
  select * into a from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if a.credits <= 0 then return jsonb_build_object('ok', false, 'error', 'NO_CREDITS'); end if;
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  update profiles set balance = balance + p_amount where id = p_client and role = 'client' and created_by = p_admin;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  insert into transactions (type, amount, from_user, to_user) values ('client_credit', p_amount, p_admin, p_client);
  return jsonb_build_object('ok', true);
end $$;

-- Dépôt d'un client.
create or replace function public.rpc_client_deposit(
  p_client uuid, p_amount bigint
) returns jsonb language plpgsql security definer set search_path = public as $$
declare mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  update profiles set balance = balance + p_amount where id = p_client and role = 'client';
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  insert into transactions (type, amount, to_user) values ('deposit', p_amount, p_client);
  return jsonb_build_object('ok', true);
end $$;

-- L'admin génère un code de retrait pour un de SES clients : débite les frais en crédits.
-- Le code lui-même est généré côté serveur (aléatoire cryptographique) et passé en paramètre.
create or replace function public.rpc_generate_withdrawal_code(
  p_admin uuid, p_client uuid, p_code text, p_amount bigint
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  a profiles;
  fee bigint := get_setting_int('withdrawal_code_fee', 5000);
  ttl bigint := get_setting_int('withdrawal_code_ttl_minutes', 60);
  mx  bigint := get_setting_int('max_operation_amount', 10000000);
  exp timestamptz := now() + (ttl || ' minutes')::interval;
begin
  select * into a from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if not exists (select 1 from profiles where id = p_client and role = 'client' and created_by = p_admin) then
    return jsonb_build_object('ok', false, 'error', 'NOT_FOUND');
  end if;
  if p_amount is not null and (p_amount <= 0 or p_amount > mx) then
    return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT');
  end if;
  if a.credits < fee then
    return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_CREDITS', 'fee', fee, 'credits', a.credits);
  end if;
  update profiles set credits = credits - fee where id = p_admin;
  insert into transactions (type, amount, from_user) values ('admin_fee', fee, p_admin);
  insert into withdrawal_codes (code, client_id, admin_id, amount, expires_at)
  values (p_code, p_client, p_admin, p_amount, exp);
  return jsonb_build_object('ok', true, 'code', p_code, 'fee', fee, 'expires_at', exp);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'CODE_COLLISION');  -- l'appelant retente avec un autre code
end $$;

-- Retrait : valide le code ET débite le solde dans la même transaction SQL.
create or replace function public.rpc_client_withdraw(
  p_client uuid, p_amount bigint, p_code text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare c withdrawal_codes; cl profiles; mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  select * into cl from profiles where id = p_client and role = 'client' for update;  -- sérialise les retraits du client
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
  if cl.balance < p_amount then
    return jsonb_build_object('ok', false, 'error', 'INSUFFICIENT_BALANCE');  -- le code reste utilisable
  end if;

  update profiles set balance = balance - p_amount where id = p_client;
  update withdrawal_codes set status = 'used', used_at = now() where id = c.id;
  insert into transactions (type, amount, from_user) values ('withdrawal', p_amount, p_client);
  return jsonb_build_object('ok', true);
end $$;

-- Seul service_role peut appeler ces fonctions (jamais le navigateur).
do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and (p.proname like 'rpc\_%' or p.proname = 'get_setting_int') loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- SUPER ADMIN DE DÉPART
-- Option A (recommandée) : `npm run seed:super-admin` (crée l'utilisateur
--   Auth + le profil via l'API admin).
-- Option B : créer l'utilisateur dans Supabase > Authentication > Users
--   (cocher "Auto Confirm"), puis lancer ceci en remplaçant l'email :
--
-- insert into public.profiles (id, role, full_name, email)
-- select id, 'super_admin', 'Super Admin', email from auth.users where email = 'superadmin@example.com'
-- on conflict (id) do update set role = 'super_admin';
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"super_admin"}' where email = 'superadmin@example.com';
-- ---------------------------------------------------------------------
