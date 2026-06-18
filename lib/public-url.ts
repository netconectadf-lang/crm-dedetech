const DEFAULT_PUBLIC_URL = "https://dedetech-crm.vercel.app";

function normalizeOrigin(value: string | undefined): string | null {
  const origin = value?.trim();
  if (!origin) return null;

  try {
    const url = new URL(origin);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.origin === "null") return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function publicSiteUrl(): string {
  return (
    normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL) ??
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ??
    normalizeOrigin(
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    ) ??
    DEFAULT_PUBLIC_URL
  );
}
