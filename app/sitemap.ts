import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/public-url";

const SITE_URL = publicSiteUrl();

/** Apenas páginas públicas e indexáveis. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/signup`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/login`,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];
}
