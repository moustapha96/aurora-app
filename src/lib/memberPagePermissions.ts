/**
 * Clés des pages membre (utilisées en base et pour le menu / member-card).
 * L'admin peut autoriser ou non chaque page par membre.
 */
export const MEMBER_PAGE_KEYS = [
  "home",
  "business",
  "family",
  "personal",
  "network",
  "members",
  "referrals",
  "marketplace",
  "concierge",
  "messages",
] as const;

export type MemberPageKey = (typeof MEMBER_PAGE_KEYS)[number];

/** Correspondance page_key -> route (pour le menu et la member-card). */
export const PAGE_KEY_TO_ROUTE: Record<MemberPageKey, string> = {
  home: "/member-card",
  business: "/business",
  family: "/family",
  personal: "/personal",
  network: "/network",
  members: "/members",
  referrals: "/referrals",
  marketplace: "/marketplace",
  concierge: "/concierge",
  messages: "/messages",
};

/** Clé de traduction pour le libellé de chaque page (pour l’admin). */
export const PAGE_KEY_TO_LABEL_KEY: Record<MemberPageKey, string> = {
  home: "pagePermHome",
  business: "pagePermBusiness",
  family: "pagePermFamily",
  personal: "pagePermPersonal",
  network: "pagePermNetwork",
  members: "pagePermMembers",
  referrals: "pagePermReferrals",
  marketplace: "pagePermMarketplace",
  concierge: "pagePermConcierge",
  messages: "pagePermMessages",
};
