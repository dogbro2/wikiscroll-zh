import {cardsOrigin} from './config.js';
export async function permit(env,name,key) {
  try { return !!(await env[name].limit({key:'wikiscroll:'+key})).success; }
  catch { return false; }
}
export const limited = () => new Response('Please try again shortly.',{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
// The app's own pages. Scripts only from WikiScroll, cdnjs (Leaflet, for the
// map) and Cloudflare Web Analytics; no inline scripts or handlers. Inline
// styles stay allowed: the markup sets small layout styles directly. Requests
// go to WikiScroll, Wikimedia (direct fallback, images, map coordinates) and
// Nominatim (map fallback). public/_headers carries the same policy for
// assets served without the Worker; a test keeps the two identical.
const POLICY_FOR=cards=>`default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob: https://upload.wikimedia.org https://thumb.wikimedia.org https://*.basemaps.cartocdn.com https://cdnjs.cloudflare.com; connect-src 'self'${cards?` ${cards}`:''} https://*.wikipedia.org https://*.wikivoyage.org https://upload.wikimedia.org https://thumb.wikimedia.org https://nominatim.openstreetmap.org https://cloudflareinsights.com; font-src 'self'; manifest-src 'self'; worker-src 'self'; frame-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`;
// No card library is configured by default, so its origin is not allowed either.
export const pageCSP=(env={})=>POLICY_FOR(cardsOrigin(env));
export const PAGE_CSP=pageCSP();
export function secure(response, env = {}) {
  const headers=new Headers(response.headers);
  headers.set('X-Content-Type-Options','nosniff');
  headers.set('X-Frame-Options','DENY');
  headers.set('Referrer-Policy','strict-origin-when-cross-origin');
  headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  // HTTPS only. No includeSubDomains or preload: those commit other hosts.
  headers.set('Strict-Transport-Security','max-age=31536000');
  if(!headers.has('Content-Security-Policy'))headers.set('Content-Security-Policy',headers.get('Content-Type')?.includes('text/html')?pageCSP(env):"object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
