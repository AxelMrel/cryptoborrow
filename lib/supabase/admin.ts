import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client service_role : contourne la RLS. Importable UNIQUEMENT côté serveur
 * (le package `server-only` fait échouer le build si un composant client l'importe).
 * À n'utiliser qu'après avoir vérifié le rôle de l'appelant (voir lib/dal.ts).
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
