import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const HOME: Record<string, string> = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  client: "/dashboard/client",
};

/**
 * Next.js 16 : `middleware.ts` s'appelle désormais `proxy.ts`.
 * Contrôle OPTIMISTE (session + rôle lu dans le JWT) pour rediriger tôt.
 * La vraie autorisation est refaite côté serveur dans chaque page / action (lib/dal.ts).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims() valide la signature du JWT et rafraîchit les cookies si besoin.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const role = (claims?.app_metadata as { role?: string } | undefined)?.role;
  const path = request.nextUrl.pathname;

  const redirectTo = (to: string) => {
    const res = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  if (path.startsWith("/dashboard")) {
    if (!claims) return redirectTo("/login");
    if (role && HOME[role]) {
      // Un utilisateur ne peut visiter que le dashboard de son rôle.
      const segment = path.split("/")[2];
      const allowed = HOME[role].split("/")[2];
      if (segment && segment !== allowed) return redirectTo(HOME[role]);
    }
  }
  if ((path === "/login" || path === "/signup" || path === "/admin") && claims) return redirectTo(role && HOME[role] ? HOME[role] : "/dashboard");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/signup", "/admin"],
};
