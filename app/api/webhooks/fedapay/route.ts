import { settleFromFedaPay, } from "@/lib/payments";
import { verifyWebhookSignature } from "@/lib/fedapay";

/**
 * Webhook FedaPay (événements transaction.created / .approved / .canceled ...).
 * À déclarer dans le tableau de bord FedaPay : https://<votre-domaine>/api/webhooks/fedapay
 *
 * Défense en profondeur :
 *  1. la signature HMAC (secret du webhook) prouve que l'appel vient de FedaPay et n'a pas été rejoué ;
 *  2. on ne se fie PAS au contenu de l'événement : on relit la transaction chez FedaPay avant de créditer ;
 *  3. le règlement en base est atomique et idempotent (FedaPay peut renvoyer le même événement plusieurs fois).
 */
export async function POST(request: Request) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "webhook non configuré" }, { status: 503 });

  const rawBody = await request.text(); // corps brut : la signature porte sur ces octets exacts
  if (!verifyWebhookSignature(rawBody, request.headers.get("x-fedapay-signature"), secret)) {
    return Response.json({ error: "signature invalide" }, { status: 401 });
  }

  let event: { name?: unknown; entity?: { id?: unknown } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "JSON invalide" }, { status: 400 });
  }

  const id = Number(event.entity?.id);
  if (typeof event.name === "string" && event.name.startsWith("transaction.") && Number.isInteger(id)) {
    const result = await settleFromFedaPay(id);
    // "error" = FedaPay ou la base injoignables : on répond 500 pour que FedaPay réessaie plus tard.
    if (result.state === "error") return Response.json({ error: "traitement impossible" }, { status: 500 });
  }
  return Response.json({ received: true });
}
