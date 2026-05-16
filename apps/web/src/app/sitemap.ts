import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  return [
    { url: base, lastModified: new Date(), priority: 1.0 },
    { url: `${base}/signup`, lastModified: new Date(), priority: 0.7 },
    { url: `${base}/login`, lastModified: new Date(), priority: 0.5 },
    { url: `${base}/privacy`, lastModified: new Date(), priority: 0.3 },
  ]
}
