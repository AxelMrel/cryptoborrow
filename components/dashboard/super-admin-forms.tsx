"use client";

import { grantAdminCredits, setMaxClients, updateSetting } from "@/lib/actions/super-admin";
import { ActionForm, SubmitButton } from "./forms";

export function AdminActions({ adminId, maxClients }: { adminId: string; maxClients: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ActionForm action={grantAdminCredits} className="space-y-1">
        <input type="hidden" name="admin_id" value={adminId} />
        <label className="label" htmlFor={`gc-${adminId}`}>Ajouter des crédits</label>
        <div className="flex gap-2">
          <input id={`gc-${adminId}`} name="amount" inputMode="numeric" required className="input" placeholder="ex. 50000" />
          <SubmitButton className="btn btn-ghost">Créditer</SubmitButton>
        </div>
      </ActionForm>
      <ActionForm action={setMaxClients} className="space-y-1">
        <input type="hidden" name="admin_id" value={adminId} />
        <label className="label" htmlFor={`mc-${adminId}`}>Quota de clients</label>
        <div className="flex gap-2">
          <input id={`mc-${adminId}`} name="max_clients" inputMode="numeric" required defaultValue={maxClients} className="input" />
          <SubmitButton className="btn btn-ghost">Fixer</SubmitButton>
        </div>
      </ActionForm>
    </div>
  );
}

export function SettingForm({ k, label, value }: { k: string; label: string; value: string }) {
  return (
    <ActionForm action={updateSetting} className="space-y-1">
      <input type="hidden" name="key" value={k} />
      <label className="label" htmlFor={`s-${k}`}>{label}</label>
      <div className="flex gap-2">
        <input id={`s-${k}`} name="value" inputMode="numeric" required defaultValue={value} className="input" />
        <SubmitButton className="btn btn-ghost">Enregistrer</SubmitButton>
      </div>
    </ActionForm>
  );
}
