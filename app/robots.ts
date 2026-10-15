import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  const privatePaths = [
    "/admin",
    "/api",
    "/auth",
    "/profile",
    "/boxes",
    "/cards",
    "/onboarding",
    "/checkout",
    "/login",
    "/forgot-password",
    "/reset-password",
  ];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
