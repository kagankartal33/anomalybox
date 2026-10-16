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
  // Next.js prefetches React Server Component payloads as `<page>?_rsc=<random>`. Search Console
  // showed 77% of Googlebot requests going to these variants and only 10% to HTML pages, starving
  // real pages of crawl budget. Pages are fully server-rendered, so crawlers never need them.
  const rscPayloads = ["/*?_rsc=", "/*&_rsc="];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...privatePaths, ...rscPayloads],
      },
    ],
    sitemap: `${url}/sitemap.xml`,
    host: url,
  };
}
