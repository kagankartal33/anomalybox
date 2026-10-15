import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/profile",
          "/profile/",
          "/boxes",
          "/boxes/",
          "/cards/",
          "/reviews/",
          "/onboarding",
          "/onboarding/",
          "/checkout/",
          "/reset-password",
          "/forgot-password",
          "/auth/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/profile/",
          "/boxes/",
          "/cards/",
          "/reviews/",
          "/onboarding/",
          "/checkout/",
          "/reset-password",
          "/forgot-password",
          "/auth/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/profile/",
          "/boxes/",
          "/cards/",
          "/reviews/",
          "/onboarding/",
          "/checkout/",
          "/reset-password",
          "/forgot-password",
          "/auth/",
        ],
      },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/feed.xml`,
    ],
    host: base,
  };
}