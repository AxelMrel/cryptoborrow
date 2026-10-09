import type { Plan } from "@/lib/types";

/** Packs proposés sur la landing. Modifiez simplement ces valeurs (prix en euros). */
export const PLANS: Plan[] = [
  { id: "starter", name: "Starter", price: 5, credits: 10_000, max_clients: 3, highlight: false },
  { id: "pro", name: "Pro", price: 15, credits: 35_000, max_clients: 10, highlight: true },
  { id: "business", name: "Business", price: 40, credits: 100_000, max_clients: 30, highlight: false },
];

export const getPlan = (id: string) => PLANS.find((p) => p.id === id);
