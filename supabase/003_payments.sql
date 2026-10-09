-- =====================================================================
-- Migration 003 : paiements FedaPay (achat de packs de crédits par les admins)
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql (et 002). Script idempotent.
--
-- Principe de sécurité : les crédits ne sont JAMAIS accordés à cause d'une redirection du navigateur.
-- Ils le sont uniquement par rpc_settle_payment, appelée côté serveur APRÈS avoir relu la transaction
-- chez FedaPay avec la clé secrète. La fonction est idempotente (un paiement ne crédite qu'une fois).
-- =====================================================================

create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  plan_id      text not null,
  amount_eur   bigint not null check (amount_eur > 0),      -- prix affiché
  amount_xof   bigint not null check (amount_xof > 0),      -- montant réellement facturé par FedaPay (XOF)
  credits      bigint not null check (credits >= 0),        -- crédits à accorder une fois payé
  max_clients  int    not null check (max_clients >= 0),    -- quota minimum garanti par le pack
  fedapay_id   bigint unique,                               -- identifiant de la transaction chez FedaPay
  status       text not null default 'pending' check (status in ('pending','approved','declined','canceled')),
  created_at   timestamptz not null default now(),
  paid_at      timestamptz
);
create index if not exists payments_user_idx on public.payments(user_id, created_at desc);

alter table public.payments enable row level security;

-- Lecture : le propriétaire et le super admin. Aucune écriture directe : tout passe par les RPC ci-dessous.
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select to authenticated
  using ( user_id = auth.uid() or public.is_super_admin() );

revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

-- Crée un paiement "en attente" avant d'envoyer l'admin chez FedaPay.
create or replace function public.rpc_create_payment(
  p_user uuid, p_plan text, p_amount_eur bigint, p_amount_xof bigint, p_credits bigint, p_max_clients int
) returns jsonb language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  if not exists (select 1 from profiles where id = p_user and role = 'admin') then
    return jsonb_build_object('ok', false, 'error', 'FORBIDDEN');
  end if;
  insert into payments (user_id, plan_id, amount_eur, amount_xof, credits, max_clients)
  values (p_user, p_plan, p_amount_eur, p_amount_xof, p_credits, p_max_clients)
  returning id into pid;
  return jsonb_build_object('ok', true, 'id', pid);
exception when check_violation then
  return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
end $$;

-- Associe la transaction FedaPay au paiement (une seule fois).
create or replace function public.rpc_attach_fedapay(p_payment uuid, p_fedapay_id bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update payments set fedapay_id = p_fedapay_id where id = p_payment and fedapay_id is null and status = 'pending';
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  return jsonb_build_object('ok', true);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
end $$;

-- Règle un paiement à partir de l'état RELU chez FedaPay (jamais à partir de la redirection du navigateur).
--   p_status : 'approved' | 'declined' | 'canceled' | 'pending'
--   p_amount_xof : montant que FedaPay déclare pour cette transaction (doit égaler celui qu'on a demandé)
-- Idempotent : un paiement déjà approuvé ne crédite plus jamais.
create or replace function public.rpc_settle_payment(p_fedapay_id bigint, p_status text, p_amount_xof bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare p payments;
begin
  select * into p from payments where fedapay_id = p_fedapay_id for update;   -- verrou : pas de double crédit
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;

  if p.status = 'approved' then
    return jsonb_build_object('ok', true, 'status', 'approved', 'already', true, 'payment', p.id);
  end if;

  if p_status = 'approved' then
    if p_amount_xof is distinct from p.amount_xof then
      return jsonb_build_object('ok', false, 'error', 'AMOUNT_MISMATCH');    -- montant falsifié : on ne crédite pas
    end if;
    update payments set status = 'approved', paid_at = now() where id = p.id;
    update profiles set credits = credits + p.credits, max_clients = greatest(max_clients, p.max_clients)
    where id = p.user_id and role = 'admin';
    if p.credits > 0 then
      insert into transactions (type, amount, to_user) values ('admin_credit', p.credits, p.user_id);
    end if;
    return jsonb_build_object('ok', true, 'status', 'approved', 'already', false, 'payment', p.id);
  end if;

  if p_status in ('declined', 'canceled') then
    update payments set status = p_status where id = p.id;
    return jsonb_build_object('ok', true, 'status', p_status, 'payment', p.id);
  end if;

  return jsonb_build_object('ok', true, 'status', 'pending', 'payment', p.id);
end $$;

-- Réservé à service_role (jamais appelable depuis le navigateur).
do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in ('rpc_create_payment','rpc_attach_fedapay','rpc_settle_payment') loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
