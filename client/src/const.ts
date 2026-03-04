export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const PARTY_BACKGROUND_THEME = "neon" as const;

export const ARTIST_BACKGROUND_IMAGES = [
  "/artists/noel_rosa_caricature.png",
  "/artists/carmen_miranda_caricature.png",
  "/artists/cartola_caricature.png",
  "/artists/tim_maia_caricature.png",
  "/artists/chico_buarque_caricature.png",
  "/artists/tom_jobim_caricature.png",
  "/artists/roberto_carlos_caricature.png",
  "/artists/raul_seixas_caricature.png",
  "/artists/jorge_ben_caricature.png",
  "/artists/rita_lee_caricature.png",
] as const;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${globalThis.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
