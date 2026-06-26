export function getConfiguredSiteUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!siteUrl) {
    return null;
  }

  return siteUrl.replace(/\/+$/, "");
}

export function buildAbsoluteAppUrl(path: string) {
  const siteUrl = getConfiguredSiteUrl();

  if (!siteUrl) {
    return null;
  }

  return new URL(path, `${siteUrl}/`).toString();
}
