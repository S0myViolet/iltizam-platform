// Public marketing site for the platform. The default points at the shared
// Iltzam landing page; set NEXT_PUBLIC_MAIN_WEBSITE_URL per deployment once
// the site has its own domain.
export const MAIN_WEBSITE_URL =
  process.env.NEXT_PUBLIC_MAIN_WEBSITE_URL ??
  "https://claude.ai/design/p/685f86da-43ba-4422-bc0c-b56407c1d1cb?file=Iltzam+Landing.dc.html&via=share";
