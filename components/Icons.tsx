import type { ReactNode } from "react";

type P = { className?: string };
const base = {
  width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
};
const make = (path: ReactNode) => function Icon({ className }: P) {
  return <svg {...base} className={className ?? "h-6 w-6"}>{path}</svg>;
};

export const WalletIcon = make(<><path d="M3 7a2 2 0 0 1 2-2h13v4" /><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H5a2 2 0 0 1-2-2Z" /><circle cx="16.5" cy="14.5" r="1" /></>);
export const ChartIcon = make(<><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>);
export const KeyIcon = make(<><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9" /><path d="m16 7 3 3" /></>);
export const ShieldIcon = make(<><path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>);
export const UsersIcon = make(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 4.5a3.5 3.5 0 0 1 0 7" /><path d="M18 14.2A6.5 6.5 0 0 1 21.5 20" /></>);
export const SendIcon = make(<><path d="m21 3-9.5 18-2.5-7.5L1.5 11 21 3Z" /><path d="M21 3 9 13.5" /></>);
export const CoinsIcon = make(<><circle cx="9" cy="9" r="6" /><path d="M15 9.2A6 6 0 1 1 9.2 21" /><path d="M9 6.5v5" /></>);
export const CheckIcon = make(<path d="m5 12.5 4.5 4.5L19 7.5" />);
export const CopyIcon = make(<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>);

export const EyeIcon = make(<><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const EyeOffIcon = make(<><path d="M9.9 5.2A9.6 9.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1" /><path d="M6.6 6.6C3.6 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /><path d="m3 3 18 18" /></>);

export const LogoutIcon = make(<><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="m16 8 4 4-4 4" /><path d="M20 12H9" /></>);
export const UserIcon = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>);
export const CardIcon = make(<><rect x="2.5" y="5" width="19" height="14" rx="2.5" /><path d="M2.5 10h19" /><path d="M6.5 15h4" /></>);
export const HomeIcon = make(<><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></>);
export const TrashIcon = make(<><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>);

/** Pastille d'icône sur fond bleu clair. */
export function IconBadge({ children }: { children: ReactNode }) {
  return <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">{children}</div>;
}
