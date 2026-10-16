// Public, unprotected origin used for links that must work for anyone —
// e.g. the emergency QR code, which first responders scan without any login.
// Preview deployments sit behind Vercel Deployment Protection, so links must
// never be built from window.location.origin on a preview.
const DEFAULT_PUBLIC_SITE_URL = 'https://health-ai-omega-three.vercel.app';

export const PUBLIC_SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, '');

/** True when the app is running somewhere other than the public site (preview, localhost). */
export const isOffPublicSite = () => window.location.origin !== PUBLIC_SITE_URL;
