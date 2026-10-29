// Every value that differs between deployments lives here, so no other site's
// domain is baked into the source. Set them in wrangler.jsonc for the Worker
// and in the build environment as PUBLIC_* for the static reader (see README).
const clean = value => typeof value === 'string' ? value.trim().replace(/\/+$/, '') : '';

export const siteOrigin = env => clean(env?.SITE_ORIGIN);
export const cardsOrigin = env => clean(env?.CARDS_ORIGIN);
export const contactEmail = env => typeof env?.CONTACT_EMAIL === 'string' ? env.CONTACT_EMAIL.trim() : '';

// Wikimedia asks every client to identify itself with a way to reach its
// operator; a fork must not send the upstream author's address.
export const userAgent = env => {
  const where = [siteOrigin(env), contactEmail(env)].filter(Boolean).join('; ');
  return `WikiScroll-zh/2.1${where ? ` (${where})` : ''}`;
};