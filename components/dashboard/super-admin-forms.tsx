"use client";

import { grantAdminCredits, setMaxClients, updateSetting } from "@/lib/actions/super-admin";
import { useI18n } from "@/i18n/provider";
import { ActionForm, SubmitButton } from "./forms";

export function AdminActions({ adminId, maxClients }: { adminId: string; maxClients: number }) {
  const { t: dict } = useI18n();
  const t = dict.superAdmin.forms;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ActionForm action={grantAdminCredits} className="space-y-1">
        <input type="hidden" name="admin_id" value={adminId} />
        <label className="label" htmlFor={`gc-${adminId}`}>{t.addCredits}</label>
        <div className="flex gap-2">
          <input id={`gc-${adminId}`} name="amount" inputMode="numeric" required className="input" placeholder={t.addCreditsPlaceholder} />
          <SubmitButton className="btn btn-ghost">{t.credit}</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={setMaxClients} className="space-y-1">
        <input type="hidden" name="admin_id" value={adminId} />
        <label className="label" htmlFor={`mc-${adminId}`}>{t.quota}</label>
        <div className="flex gap-2">
          <input id={`mc-${adminId}`} name="max_clients" inputMode="numeric" required defaultValue={maxClients} className="input" />
          <SubmitButton className="btn btn-ghost">{t.setQuota}</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

export function SettingForm({ k, label, value }: { k: string; label: string; value: string }) {
  const { t: dict } = useI18n();
  return (
    <ActionForm action={updateSetting} className="space-y-1">
      <input type="hidden" name="key" value={k} />
      <label className="label" htmlFor={`s-${k}`}>{label}</label>
      <div className="flex gap-2">
        <input id={`s-${k}`} name="value" inputMode="numeric" required defaultValue={value} className="input" />
        <SubmitButton className="btn btn-ghost">{dict.superAdmin.forms.save}</SubmitButton>
      </div>
    </ActionForm>
  );
}
