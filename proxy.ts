import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANG_COOKIE, defaultLocale, hasLocale, type Locale } from "@/i18n/config";

const HOME: Record<string, string> = {
  super_admin: "/dashboard/super-admin",
  admin: "/dashboard/admin",
  client: "/dashboard/client",
};

/** Langue préférée : cookie d'abord, puis en-tête Accept-Language du navigateur, sinon le français. */
function preferredLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LANG_COOKIE)?.value;
  if (hasLocale(cookie)) return cookie;
  for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
    const tag = part.trim().split(";")[0].toLowerCase().split("-")[0];
    if (hasLocale(tag)) return tag;
  }
  return defaultLocale;
}

/**
 * Next.js 16 : `middleware.ts` s'appelle désormais `proxy.ts`. Deux rôles :
 * 1. Internationalisation : toute URL sans préfixe de langue est redirigée vers /fr ou /en,
 *    et la langue courante est mémorisée dans un cookie (lu par les Server Actions).
 * 2. Contrôle OPTIMISTE de la session et du rôle (lu dans le JWT). La vraie autorisation est refaite
 *    côté serveur dans chaque page et chaque action (lib/dal.ts, lib/rpc.ts).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (!hasLocale(first)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${preferredLocale(request)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const locale = first;
  const path = pathname.slice(locale.length + 1) || "/"; // chemin sans la langue
  const remember = (res: NextResponse) => {
    res.cookies.set(LANG_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  };

  // Pages publiques sans logique de session : on mémorise seulement la langue.
  const guarded = path.startsWith("/dashboard") || path === "/login" || path === "/signup" || path === "/admin";
  if (!guarded) return remember(NextResponse.next({ request }));

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

  const redirectTo = (to: string) => {
    const res = NextResponse.redirect(new URL(`/${locale}${to}`, request.url));
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return remember(res);
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
  // Connecté : inutile de revoir connexion, inscription ou landing admin.
  if ((path === "/login" || path === "/signup" || path === "/admin") && claims) {
    return redirectTo(role && HOME[role] ? HOME[role] : "/dashboard");
  }

  return remember(response);
}

export const config = {
  // Toutes les pages, sauf les internes Next (_next), les routes API et les fichiers statiques (avec extension).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
