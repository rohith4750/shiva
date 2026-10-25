/* ==========================================================================
   URL ROUTES
   ==========================================================================
   Every section and journal tab has its own path, so reloading or sharing a
   link opens the same view:
     /users  /roles  /permissions
     /journal/dashboard  /journal/add-trade  /journal/history  /journal/calendar
     /journal/monthly  /journal/analytics  /journal/psychology  /journal/accounts
   Section numbers match HomeClient's landingTab; journal numbers match
   TradingJournalView's activeTab.
   ========================================================================== */

export const SECTION_SLUGS: Record<number, string> = {
  1: "users",
  2: "roles",
  3: "permissions",
  6: "journal",
};

export const JOURNAL_TAB_SLUGS: Record<number, string> = {
  0: "dashboard",
  1: "add-trade",
  2: "history",
  3: "calendar",
  7: "monthly",
  4: "analytics",
  5: "psychology",
  6: "accounts",
};

export const DEFAULT_SECTION = 6;
export const DEFAULT_JOURNAL_TAB = 0;

export interface AppRoute {
  section: number;
  journalTab: number;
}

const invert = (m: Record<number, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, Number(k)]));
const SECTION_BY_SLUG: Record<string, number> = invert(SECTION_SLUGS);
const JOURNAL_TAB_BY_SLUG: Record<string, number> = invert(JOURNAL_TAB_SLUGS);

/** Parses path segments (e.g. ["journal", "history"]) into a route; null for an unknown path. "/" maps to the default. */
export function parseRoute(segments: string[]): AppRoute | null {
  const [sectionSlug, tabSlug, ...rest] = segments.map((s) => s.toLowerCase());
  if (!sectionSlug) return { section: DEFAULT_SECTION, journalTab: DEFAULT_JOURNAL_TAB };
  const section = SECTION_BY_SLUG[sectionSlug];
  if (section === undefined || rest.length) return null;
  if (section !== 6) return tabSlug ? null : { section, journalTab: DEFAULT_JOURNAL_TAB };
  if (!tabSlug) return { section, journalTab: DEFAULT_JOURNAL_TAB };
  const journalTab = JOURNAL_TAB_BY_SLUG[tabSlug];
  return journalTab === undefined ? null : { section, journalTab };
}

export function parsePathname(pathname: string): AppRoute | null {
  return parseRoute(pathname.split("/").filter(Boolean));
}

export function routePath({ section, journalTab }: AppRoute): string {
  if (section === 6) return `/journal/${JOURNAL_TAB_SLUGS[journalTab] ?? JOURNAL_TAB_SLUGS[DEFAULT_JOURNAL_TAB]}`;
  return `/${SECTION_SLUGS[section] ?? SECTION_SLUGS[DEFAULT_SECTION]}`;
}

/** Old hash links (#journal, #users, …) from before paths existed. */
export function routeFromLegacyHash(hash: string): AppRoute | null {
  const slug = hash.replace("#", "").toLowerCase();
  const legacy: Record<string, number> = { overview: 6, journal: 6, trading: 6, users: 1, roles: 2, permissions: 3 };
  return legacy[slug] !== undefined ? { section: legacy[slug], journalTab: DEFAULT_JOURNAL_TAB } : null;
}
