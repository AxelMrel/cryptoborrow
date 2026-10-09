-- =====================================================================
-- Migration 004 : tarification à l'usage (plus de packs, de crédits ni de quotas)
--   - l'inscription d'un admin est gratuite ;
--   - créer un client coûte 5 000 FCFA (FedaPay) : le client reste "pending" jusqu'au paiement ;
--   - générer un code de retrait coûte 1 000 FCFA (FedaPay) : le code n'existe qu'après le paiement.
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql, 002 et 003. Script idempotent.
--
-- Sécurité : le montant est décidé PAR LA BASE (table settings), jamais par le navigateur ni par le serveur web.
-- Les effets (activation du client, génération du code) ne se produisent que dans rpc_settle_payment, appelée
-- côté serveur APRÈS relecture de la transaction chez FedaPay. Réglage atomique et idempotent.
-- =====================================================================

-- ---------- tarifs (en francs CFA, l'unité de FedaPay) ----------
insert into public.settings (key, value) values
  ('client_creation_fee_xof', '5000'),
  ('withdrawal_code_fee_xof', '1000')
on conflict (key) do nothing;
delete from public.settings where key = 'withdrawal_code_fee';   -- ancien tarif en crédits

-- ---------- statut d'un compte : un client non payé est "pending" ----------
alter table public.profiles add column if not exists status text not null default 'active';
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('active', 'pending'));

-- ---------- paiements : ajout du type d'opération payée ----------
alter table public.payments add column if not exists kind text not null default 'pack';
alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check check (kind in ('pack', 'client_creation', 'withdrawal_code'));
alter table public.payments add column if not exists target_client_id uuid references public.profiles(id) on delete set null;
alter table public.payments add column if not exists code_amount bigint check (code_amount is null or code_amount > 0);
-- les anciennes colonnes "pack" deviennent facultatives
alter table public.payments alter column plan_id drop not null;
alter table public.payments alter column amount_eur drop not null;
alter table public.payments alter column credits set default 0;
alter table public.payments alter column max_clients set default 0;

-- le code de retrait garde un lien vers le paiement qui l'a financé (pour l'afficher après le retour de FedaPay)
alter table public.withdrawal_codes add column if not exists payment_id uuid references public.payments(id) on delete set null;
create index if not exists codes_payment_idx on public.withdrawal_codes(payment_id);

-- ---------- fonctions obsolètes (crédits, quotas, packs) : supprimées pour réduire la surface d'attaque ----------
drop function if exists public.rpc_create_admin(uuid, uuid, text, text, bigint, int);
drop function if exists public.rpc_create_client(uuid, uuid, text, text);
drop function if exists public.rpc_grant_admin_credits(uuid, uuid, bigint);
drop function if exists public.rpc_set_max_clients(uuid, uuid, int);
drop function if exists public.rpc_generate_withdrawal_code(uuid, uuid, text, bigint);
drop function if exists public.rpc_create_payment(uuid, text, bigint, bigint, bigint, int);

-- ---------- code de retrait aléatoire, généré en base ----------
-- 8 caractères parmi 32 (sans 0/O/1/I). On tire 8 octets de deux UUID v4 (source cryptographique du serveur) en évitant
-- les octets de version et de variante ; 256 = 8 x 32, donc le "modulo 32" est parfaitement uniforme.
create or replace function public.gen_withdrawal_code() returns text
language plpgsql volatile set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  hex text := substr(replace(gen_random_uuid()::text, '-', ''), 1, 12) || substr(replace(gen_random_uuid()::text, '-', ''), 1, 4);
  out text := '';
  i int;
begin
  for i in 0..7 loop
    out := out || substr(alphabet, ((('x' || substr(hex, i * 2 + 1, 2))::bit(8))::int % 32) + 1, 1);
  end loop;
  return out;
end $$;

-- ---------- inscription gratuite d'un admin (le compte Auth existe déjà) ----------
create or replace function public.rpc_register_admin(p_user uuid, p_email text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
  end if;
  insert into profiles (id, role, full_name, email) values (p_user, 'admin', trim(p_name), p_email);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- client "en attente de paiement" ----------
create or replace function public.rpc_create_pending_client(p_admin uuid, p_user uuid, p_email text, p_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from profiles where id = p_admin and role = 'admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
  end if;
  insert into profiles (id, role, full_name, email, created_by, status)
  values (p_user, 'client', trim(p_name), p_email, p_admin, 'pending');
  return jsonb_build_object('ok', true);
end $$;

-- ---------- ouverture d'un paiement : le montant vient de la table settings ----------
--   p_kind 'client_creation' : p_target = client "pending" de cet admin
--   p_kind 'withdrawal_code' : p_target = client "active" de cet admin, p_code_amount optionnel (euros)
create or replace function public.rpc_create_fee_payment(p_user uuid, p_kind text, p_target uuid, p_code_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  amount bigint; pid uuid; st text;
  mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  if not exists (select 1 from profiles where id = p_user and role = 'admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  select status into st from profiles where id = p_target and role = 'client' and created_by = p_user;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;

  if p_kind = 'client_creation' then
    if st <> 'pending' then return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT'); end if;
    amount := get_setting_int('client_creation_fee_xof', 5000);
  elsif p_kind = 'withdrawal_code' then
    if st <> 'active' then return jsonb_build_object('ok', false, 'error', 'CLIENT_PENDING'); end if;
    if p_code_amount is not null and (p_code_amount <= 0 or p_code_amount > mx) then
      return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT');
    end if;
    amount := get_setting_int('withdrawal_code_fee_xof', 1000);
  else
    return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
  end if;

  insert into payments (user_id, kind, amount_xof, target_client_id, code_amount)
  values (p_user, p_kind, amount, p_target, case when p_kind = 'withdrawal_code' then p_code_amount end)
  returning id into pid;
  return jsonb_build_object('ok', true, 'id', pid, 'amount_xof', amount);
end $$;

-- ---------- règlement (remplace la version "packs") ----------
create or replace function public.rpc_settle_payment(p_fedapay_id bigint, p_status text, p_amount_xof bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  p payments;
  ttl bigint := get_setting_int('withdrawal_code_ttl_minutes', 60);
  new_code text; tries int := 0;
begin
  select * into p from payments where fedapay_id = p_fedapay_id for update;   -- verrou : jamais d'effet en double
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;

  if p.status = 'approved' then
    return jsonb_build_object('ok', true, 'status', 'approved', 'already', true, 'kind', p.kind, 'target', p.target_client_id, 'payment', p.id);
  end if;

  if p_status = 'approved' then
    if p_amount_xof is distinct from p.amount_xof then
      return jsonb_build_object('ok', false, 'error', 'AMOUNT_MISMATCH');    -- montant falsifié : aucun effet
    end if;
    update payments set status = 'approved', paid_at = now() where id = p.id;

    if p.kind = 'client_creation' then
      update profiles set status = 'active' where id = p.target_client_id and role = 'client' and created_by = p.user_id;

    elsif p.kind = 'withdrawal_code' then
      loop
        tries := tries + 1;
        new_code := gen_withdrawal_code();
        begin
          insert into withdrawal_codes (code, client_id, admin_id, amount, expires_at, payment_id)
          values (new_code, p.target_client_id, p.user_id, p.code_amount, now() + (ttl || ' minutes')::interval, p.id);
          exit;
        exception when unique_violation then
          if tries >= 5 then raise; end if;   -- collision improbable : on retire un autre code
        end;
      end loop;

    elsif p.kind = 'pack' then   -- anciens paiements de packs (historique)
      update profiles set credits = credits + p.credits, max_clients = greatest(max_clients, p.max_clients)
      where id = p.user_id and role = 'admin';
    end if;
    return jsonb_build_object('ok', true, 'status', 'approved', 'already', false, 'kind', p.kind, 'target', p.target_client_id, 'payment', p.id);
  end if;

  if p_status in ('declined', 'canceled') then
    update payments set status = p_status where id = p.id;
    return jsonb_build_object('ok', true, 'status', p_status, 'kind', p.kind, 'target', p.target_client_id, 'payment', p.id);
  end if;

  return jsonb_build_object('ok', true, 'status', 'pending', 'kind', p.kind, 'target', p.target_client_id, 'payment', p.id);
end $$;

-- ---------- crédit d'un client par son admin : plus de crédits requis, mais client actif ----------
create or replace function public.rpc_admin_credit_client(p_admin uuid, p_client uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  perform 1 from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  update profiles set balance = balance + p_amount
  where id = p_client and role = 'client' and created_by = p_admin and status = 'active';
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  insert into transactions (type, amount, from_user, to_user) values ('client_credit', p_amount, p_admin, p_client);
  return jsonb_build_object('ok', true);
end $$;

-- ---------- retrait : le client doit être actif ----------
create or replace function public.rpc_client_withdraw(p_client uuid, p_amount bigint, p_code text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare c withdrawal_codes; cl profiles; mx bigint := get_setting_int('max_operation_amount', 10000000);
begin
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
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
             and p.proname in ('rpc_register_admin','rpc_create_pending_client','rpc_create_fee_payment','rpc_settle_payment',
                               'rpc_admin_credit_client','rpc_client_withdraw','gen_withdrawal_code') loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
