import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const url = siteUrl();
  // /login, /forgot-password and /reset-password are linked from public pages and carry a noindex
  // meta tag. They must stay crawlable: blocking them here would hide the noindex from Google and
  // produce "Indexed, though blocked by robots.txt" warnings in Search Console.
  const privatePaths = [
    "/admin",
    "/api",
    "/auth",
    "/profile",
    "/boxes",
    "/cards",
    "/onboarding",
    "/checkout",
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
