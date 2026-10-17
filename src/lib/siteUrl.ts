// Public, unprotected origin used for links that must work for anyone —
// e.g. the emergency QR code, which first responders scan without any login.
// Preview deployments sit behind Vercel Deployment Protection, so links must
// never be built from window.location.origin on a preview.
const DEFAULT_PUBLIC_SITE_URL = 'https://health-ai-omega-three.vercel.app';

export const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, '');

/**
 * Origin used in Supabase Auth email links (verification, password reset).
 * Local dev keeps localhost so links can be tested; every deployed build —
 * including previews — sends people to the public production domain.
 */
export const authRedirectOrigin = () =>
  import.meta.env.DEV && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(window.location.origin)
    ? window.location.origin
    : PUBLIC_SITE_URL;

/** Reads an auth error that Supabase appends to a redirect URL (e.g. an expired email link). */
export function readAuthUrlError(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
  const desc = params.get('error_description');
  if (!desc) return null;
  return params.get('error_code') === 'otp_expired'
    ? 'This email link has expired or was already used. Request a new one below.'
    : desc.replace(/\+/g, ' ');
}

/** True when the app is running somewhere other than the public site (preview, localhost). */
export const isOffPublicSite = () => window.location.origin !== PUBLIC_SITE_URL;
