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

/** Pastille d'icône sur fond bleu clair. */
export function IconBadge({ children }: { children: ReactNode }) {
  return <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">{children}</div>;
}
