"use client";

import { useRef, type ReactNode } from "react";

/**
 * Bouton "Déposer" : le client ne crédite pas son compte lui-même, il est invité
 * à contacter son admin dans une fenêtre modale (élément <dialog> natif :
 * focus piégé, fermeture avec Échap, fond assombri).
 */
export default function DepositButton({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.showModal()}>
        {children}
      </button>

      <dialog
        ref={ref}
        aria-labelledby="deposit-title"
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }} // clic sur le fond
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl bg-white p-0 text-ink shadow-[0_30px_80px_rgba(18,22,58,0.35)] backdrop:bg-ink/50 backdrop:backdrop-blur-sm"
      >
        <div className="p-7 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z" />
            </svg>
          </span>
          <h2 id="deposit-title" className="mt-5 text-xl font-semibold">Contactez votre admin</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Pour déposer de l&apos;argent sur votre portefeuille, contactez votre admin. Il créditera votre compte et le solde sera mis à jour dans votre espace.
          </p>
          <button type="button" autoFocus className="btn btn-primary mt-7 w-full !py-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-brand/30" onClick={() => ref.current?.close()}>
            J&apos;ai compris
          </button>
        </div>
      </dialog>
    </>
  );
}
