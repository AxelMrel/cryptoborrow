-- =====================================================================
-- Migration 006 : dépôt (crédit d'un client par son admin) minimum de 200 €
-- À exécuter APRÈS 005. Script idempotent. Le minimum est un réglage (`min_credit_amount`).
-- =====================================================================
insert into public.settings (key, value) values ('min_credit_amount', '200') on conflict (key) do nothing;

create or replace function public.rpc_admin_credit_client(p_admin uuid, p_client uuid, p_amount bigint)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  mx bigint := get_setting_int('max_operation_amount', 10000000);
  mn bigint := get_setting_int('min_credit_amount', 200);
begin
  perform 1 from profiles where id = p_admin and role = 'admin' for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'FORBIDDEN'); end if;
  if p_amount is null or p_amount <= 0 or p_amount > mx then return jsonb_build_object('ok', false, 'error', 'INVALID_AMOUNT'); end if;
  if p_amount < mn then return jsonb_build_object('ok', false, 'error', 'AMOUNT_TOO_LOW', 'min', mn); end if;

  perform accrue_yield_internal(p_client);
  update profiles
     set balance = balance + p_amount,
         yield_at = case when balance <= 0 or yield_at is null then now() else yield_at end
   where id = p_client and role = 'client' and created_by = p_admin and status = 'active';
  if not found then return jsonb_build_object('ok', false, 'error', 'NOT_FOUND'); end if;
  insert into transactions (type, amount, from_user, to_user) values ('client_credit', p_amount, p_admin, p_client);
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.rpc_admin_credit_client(uuid, uuid, bigint) from public, anon, authenticated;
grant execute on function public.rpc_admin_credit_client(uuid, uuid, bigint) to service_role;
