"use client";

import { updateSetting } from "@/lib/actions/super-admin";
import { useI18n } from "@/i18n/provider";
import { ActionForm, SubmitButton } from "./forms";

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
