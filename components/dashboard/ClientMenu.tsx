"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CardIcon, HomeIcon, UserIcon } from "@/components/Icons";

const ITEMS = [
  { href: "/dashboard/client", label: "Mon portefeuille", icon: HomeIcon },
  { href: "/dashboard/client/profile", label: "Mon profil", icon: UserIcon },
  { href: "/dashboard/client/payment-methods", label: "Moyens de paiement", icon: CardIcon },
];

/** Menu du client : avatar qui ouvre un panneau (profil, moyens de paiement…). */
export default function ClientMenu({ initials, name, email }: { initials: string; name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu du compte"
        className="flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">{initials}</span>
        <span className="hidden max-w-[8rem] truncate text-sm font-medium sm:block">{name}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`text-slate-400 transition ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_44px_rgba(18,22,58,0.16)]">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
          <nav className="p-1.5">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-brand"
              >
                <Icon className="h-5 w-5 text-slate-400" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
