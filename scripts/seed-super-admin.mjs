// Usage : npm run seed:super-admin   (lit .env.local via --env-file)
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = process.env;
const email = process.env.SEED_SUPER_ADMIN_EMAIL;
const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
const name = process.env.SEED_SUPER_ADMIN_NAME || "Super Admin";
if (!url || !key || !email || !password) {
  console.error("Variables manquantes : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_SUPER_ADMIN_EMAIL, SEED_SUPER_ADMIN_PASSWORD");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let userId;
const created = await sb.auth.admin.createUser({
  email, password, email_confirm: true,
  app_metadata: { role: "super_admin" }, user_metadata: { full_name: name },
});
if (created.error) {
  // Déjà existant ? on le retrouve et on le promeut.
  const list = await sb.auth.admin.listUsers({ perPage: 1000 });
  const existing = list.data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!existing) { console.error("createUser:", created.error.message); process.exit(1); }
  userId = existing.id;
  await sb.auth.admin.updateUserById(userId, { app_metadata: { role: "super_admin" } });
} else {
  userId = created.data.user.id;
}

const { error } = await sb.from("profiles").upsert({ id: userId, role: "super_admin", full_name: name, email: email.toLowerCase() });
if (error) { console.error("profiles:", error.message); process.exit(1); }
console.log(`Super admin prêt : ${email}`);
