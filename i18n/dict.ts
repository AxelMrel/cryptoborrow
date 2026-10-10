import type { Locale } from "./config";
import { admin } from "./messages/admin";
import { adminLanding } from "./messages/adminLanding";
import { auth } from "./messages/auth";
import { billing } from "./messages/billing";
import { client } from "./messages/client";
import { dash } from "./messages/dash";
import { errors } from "./messages/errors";
import { market } from "./messages/market";
import { home } from "./messages/home";
import { site } from "./messages/site";
import { superAdmin } from "./messages/superAdmin";

const build = (l: Locale) => ({
  site: site[l],
  home: home[l],
  adminLanding: adminLanding[l],
  auth: auth[l],
  errors: errors[l],
  market: market[l],
  dash: dash[l],
  client: client[l],
  admin: admin[l],
  billing: billing[l],
  superAdmin: superAdmin[l],
});

export const dictionaries = { fr: build("fr"), en: build("en"), it: build("it") };
export type Dict = ReturnType<typeof build>;
