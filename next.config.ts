import type { NextConfig } from "next";
import consolidation from "./lib/seo-consolidation.json";

// Content consolidation (docs/seo/content-consolidation-plan.md): merged articles and hub pages that no
// longer exist answer with a 308 to the page that now owns their search intent.
const consolidationRedirects = [
  ...consolidation.clusters.flatMap((cluster) =>
    cluster.redirects.map((source) => ({ source, destination: cluster.winner, permanent: true })),
  ),
  ...consolidation.retiredHubPages.map(({ source, destination }) => ({ source, destination, permanent: true })),
];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  {
    key: "Content-Security-Policy-Report-Only",
    value: [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self' https://checkout.stripe.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com",
      "frame-src https://challenges.cloudflare.com https://www.google.com https://checkout.stripe.com",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://www.google.com https://www.google-analytics.com https://region1.google-analytics.com",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
    optimizePackageImports: ["lucide-react", "@supabase/supabase-js", "@supabase/ssr", "clsx"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [64, 96, 128, 256, 384, 512],
    qualities: [75, 85],
    minimumCacheTTL: 60 * 60 * 24 * 365,
    localPatterns: [
      { pathname: "/assets/**" },
      { pathname: "/brand/**" },
      { pathname: "/icons/**" },
      { pathname: "/favicon-32.png" },
      { pathname: "/favicon-48.png" },
      { pathname: "/apple-touch-icon.png" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/legal#privacy",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/legal#terms",
        permanent: true,
      },
      {
        source: "/privacy-policy",
        destination: "/legal#privacy",
        permanent: true,
      },
      {
        source: "/terms-of-service",
        destination: "/legal#terms",
        permanent: true,
      },
      {
        source: "/signup",
        destination: "/login",
        permanent: false,
      },
      // Legacy static-site URLs (e.g. http://www.anomalybox.com/index.html) still known to Google.
      {
        source: "/index.html",
        destination: "/",
        permanent: true,
      },
      {
        source: "/:path+/index.html",
        destination: "/:path+",
        permanent: true,
      },
      // ?page=N -> /p/N. Page 1 lands on /p/1, which permanently redirects to the hub root without the
      // query string. Redirecting ?page=1 straight to the root looped, because Next.js carries the
      // query over to the destination.
      ...["/resources", "/content-ideas", "/reels", "/creator-lanes", "/creator-personas", "/services", "/tools"].map(
        (root) => ({
          source: root,
          has: [{ type: "query" as const, key: "page", value: "(?<page>\\d+)" }],
          destination: `${root}/p/:page`,
          permanent: true,
        }),
      ),
      ...consolidationRedirects,
      {
        source: "/dashboard",
        destination: "/boxes",
        permanent: false,
      },
      {
        source: "/generator",
        destination: "/content-ideas",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/(about|pricing|methodology|legal)",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" }],
      },
      {
        source: "/store",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
      ...["/resources", "/content-ideas", "/reels", "/creator-lanes", "/creator-personas", "/services", "/tools"].flatMap(
        (root) => [
          {
            source: root,
            headers: [{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" }],
          },
          {
            source: `${root}/:slug`,
            headers: [{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" }],
          },
          {
            source: `${root}/p/:page`,
            headers: [{ key: "Cache-Control", value: "public, s-maxage=3600, stale-while-revalidate=86400" }],
          },
        ],
      ),
    ];
  },
};

export default nextConfig;
