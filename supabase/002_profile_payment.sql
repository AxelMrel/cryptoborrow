-- =====================================================================
-- Migration 002 : profil client (téléphone) et moyens de paiement
-- À exécuter dans Supabase > SQL Editor APRÈS schema.sql (script idempotent).
--
-- Sécurité : on ne stocke JAMAIS un numéro de carte complet ni un cryptogramme.
-- Seuls les 4 derniers chiffres, le titulaire, la marque et l'expiration sont conservés.
-- =====================================================================

alter table public.profiles add column if not exists phone text;

create table if not exists public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('card', 'bank')),
  label      text not null check (char_length(label) between 1 and 40),   -- marque de la carte ou nom de la banque
  holder     text not null check (char_length(holder) between 2 and 80),
  last4      text not null check (last4 ~ '^[0-9]{4}$'),
  expiry     text check (expiry is null or expiry ~ '^(0[1-9]|1[0-2])/[0-9]{2}$'),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists payment_methods_user_idx on public.payment_methods(user_id, created_at desc);

alter table public.payment_methods enable row level security;

-- Lecture : le propriétaire (et le super admin). Aucune policy d'écriture : tout passe par les RPC.
drop policy if exists payment_methods_select on public.payment_methods;
create policy payment_methods_select on public.payment_methods for select to authenticated
  using ( user_id = auth.uid() or public.is_super_admin() );

revoke all on public.payment_methods from anon, authenticated;
grant select on public.payment_methods to authenticated;

-- Mise à jour du profil (nom et téléphone) par son propriétaire.
create or replace function public.rpc_update_profile(p_user uuid, p_name text, p_phone text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(p_name)) < 2 or char_length(trim(p_name)) > 100 then
    return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
  end if;
  if p_phone is not null and p_phone <> '' and p_phone !~ '^[0-9+ ()-]{6,24}$' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
  end if;
  update profiles set full_name = trim(p_name), phone = nullif(trim(coalesce(p_phone, '')), '')
  where id = p_user;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Ajout d'un moyen de paiement (5 maximum ; le premier devient le moyen par défaut).
create or replace function public.rpc_add_payment_method(
  p_user uuid, p_kind text, p_label text, p_holder text, p_last4 text, p_expiry text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare n int;
begin
  perform 1 from profiles where id = p_user and role = 'client' for update;   -- sérialise les ajouts
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  select count(*) into n from payment_methods where user_id = p_user;
  if n >= 5 then return jsonb_build_object('ok', false, 'error', 'LIMIT_REACHED'); end if;
  insert into payment_methods (user_id, kind, label, holder, last4, expiry, is_default)
  values (p_user, p_kind, trim(p_label), trim(p_holder), p_last4, nullif(p_expiry, ''), n = 0);
  return jsonb_build_object('ok', true);
exception when check_violation then
  return jsonb_build_object('ok', false, 'error', 'INVALID_INPUT');
end $$;

create or replace function public.rpc_delete_payment_method(p_user uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare was_default boolean;
begin
  delete from payment_methods where id = p_id and user_id = p_user returning is_default into was_default;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  if was_default then   -- le plus récent restant devient le moyen par défaut
    update payment_methods set is_default = true
    where id = (select id from payment_methods where user_id = p_user order by created_at desc limit 1);
  end if;
  return jsonb_build_object('ok', true);
end $$;

create or replace function public.rpc_set_default_payment_method(p_user uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  perform 1 from payment_methods where id = p_id and user_id = p_user;
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  update payment_methods set is_default = (id = p_id) where user_id = p_user;
  return jsonb_build_object('ok', true);
end $$;

-- Réservé à service_role (jamais appelable depuis le navigateur).
do $$
declare f text;
begin
  for f in select p.oid::regprocedure::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public'
             and p.proname in ('rpc_update_profile','rpc_add_payment_method','rpc_delete_payment_method','rpc_set_default_payment_method') loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
