import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Client minimal de l'API FedaPay (agrégateur de paiement d'Afrique de l'Ouest).
 * Doc : https://docs.fedapay.com  |  Sandbox : https://sandbox-api.fedapay.com/v1
 *
 * - La clé secrète n'est lue que côté serveur (variables FEDAPAY_*, jamais NEXT_PUBLIC_).
 * - FedaPay ne facture qu'en francs CFA (XOF) : les prix en euros sont convertis au taux fixe officiel.
 */

/** Parité fixe officielle du franc CFA : 1 EUR = 655,957 XOF. */
export const EUR_TO_XOF = 655.957;
export const eurToXof = (eur: number) => Math.ceil(eur * EUR_TO_XOF);

function config() {
  const key = process.env.FEDAPAY_SECRET_KEY;
  if (!key) return null;
  const live = process.env.FEDAPAY_ENV === "live";
  const base = process.env.FEDAPAY_API_BASE || (live ? "https://api.fedapay.com/v1" : "https://sandbox-api.fedapay.com/v1");
  return { key, base };
}

export const isFedaPayConfigured = () => config() !== null;

export class FedaPayError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

async function call(method: "GET" | "POST", path: string, body?: unknown): Promise<Record<string, unknown>> {
  const cfg = config();
  if (!cfg) throw new FedaPayError("FEDAPAY_SECRET_KEY manquante");
  const res = await fetch(`${cfg.base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    console.error(`[fedapay ${method} ${path}] ${res.status}`, JSON.stringify(json).slice(0, 300));
    throw new FedaPayError(`FedaPay a répondu ${res.status}`, res.status);
  }
  return json;
}

export type FedaTransaction = { id: number; status: string; amount: number };

/** L'API enveloppe l'objet sous la clé "v1/transaction" ; on tolère aussi les variantes. */
function readTransaction(json: Record<string, unknown>): FedaTransaction {
  const raw = (json["v1/transaction"] ?? json["transaction"] ?? json) as Record<string, unknown>;
  const id = Number(raw.id);
  if (!Number.isInteger(id)) throw new FedaPayError("Réponse FedaPay inattendue (id manquant)");
  return { id, status: String(raw.status ?? "pending"), amount: Number(raw.amount) };
}

export async function createTransaction(input: {
  description: string;
  amountXof: number;
  callbackUrl: string;
  customer: { firstname: string; lastname: string; email: string };
}): Promise<FedaTransaction> {
  const json = await call("POST", "/transactions", {
    description: input.description,
    amount: input.amountXof,
    currency: { iso: "XOF" },
    callback_url: input.callbackUrl,
    customer: input.customer,
  });
  return readTransaction(json);
}

/** Génère le lien de la page de paiement hébergée par FedaPay (le client y choisit mobile money ou carte). */
export async function generatePaymentUrl(transactionId: number): Promise<string> {
  const json = await call("POST", `/transactions/${transactionId}/token`);
  const url = typeof json.url === "string" ? json.url : "";
  if (!url) throw new FedaPayError("Réponse FedaPay inattendue (url manquante)");
  return url;
}

export async function retrieveTransaction(transactionId: number): Promise<FedaTransaction> {
  return readTransaction(await call("GET", `/transactions/${transactionId}`));
}

/** Traduit un statut FedaPay vers ceux de notre base. "approved" et "transferred" = argent encaissé. */
export function toSettleStatus(status: string): "approved" | "declined" | "canceled" | "pending" {
  if (status === "approved" || status === "transferred") return "approved";
  if (status === "declined") return "declined";
  if (status === "canceled") return "canceled";
  return "pending";
}

/**
 * Vérifie l'en-tête X-FEDAPAY-SIGNATURE d'un webhook : "t=<horodatage>,s=<signature>",
 * où la signature est HMAC-SHA256 hexadécimal de "<horodatage>.<corps brut>" avec le secret du webhook.
 * Un horodatage trop ancien (> 5 min par défaut) est refusé pour empêcher le rejeu.
 */
export function verifyWebhookSignature(rawBody: string, header: string | null, secret: string, toleranceSeconds = 300): boolean {
  if (!header) return false;
  let timestamp = -1;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = parseInt(v, 10);
    if (k === "s" && v) signatures.push(v);
  }
  if (!Number.isFinite(timestamp) || timestamp < 0 || signatures.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - timestamp) > toleranceSeconds) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");
  const exp = Buffer.from(expected);
  return signatures.some((s) => {
    const got = Buffer.from(s);
    return got.length === exp.length && timingSafeEqual(got, exp);
  });
}
