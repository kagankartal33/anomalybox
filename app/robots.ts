import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login"],
        disallow: ["/admin", "/api", "/profile", "/boxes", "/cards", "/reviews", "/onboarding"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}