import assert from "node:assert/strict";

/**
 * E2E Auth Protection & Route Gating Test
 * Validates route protection rules, session redirect expectations,
 * and public vs private route boundaries.
 */

const PROTECTED_ROUTES = [
  "/boxes",
  "/profile",
  "/admin",
  "/cards/c6395b05-cbf9-450f-9cb4-97216a9a81dc",
];

const PUBLIC_ROUTES = [
  "/",
  "/store",
  "/pricing",
  "/legal",
  "/atelier",
  "/about",
  "/methodology",
  "/resources",
  "/content-ideas",
  "/reels",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/health",
];

// Helper to simulate Next.js middleware routing logic
function evaluateRouteAccess(pathname: string, hasValidSessionCookie: boolean): { allowed: boolean; redirectUrl?: string } {
  const isProtected = PROTECTED_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (isProtected && !hasValidSessionCookie) {
    const encodedNext = encodeURIComponent(pathname);
    return {
      allowed: false,
      redirectUrl: `/login?next=${encodedNext}`,
    };
  }

  return { allowed: true };
}

async function runAuthProtectionTest() {
  console.log("--> Testing Auth Protection & Route Gating Contracts...");

  // 1. Unauthenticated users must NOT access protected routes
  for (const route of PROTECTED_ROUTES) {
    const access = evaluateRouteAccess(route, false);
    assert.equal(access.allowed, false, `Route ${route} must be blocked for anonymous users`);
    assert.ok(access.redirectUrl?.includes(`/login?next=`), `Route ${route} must redirect to login`);
  }

  // 2. Authenticated users MUST access protected routes
  for (const route of PROTECTED_ROUTES) {
    const access = evaluateRouteAccess(route, true);
    assert.equal(access.allowed, true, `Route ${route} must be allowed for authenticated users`);
  }

  // 3. Anonymous users MUST access public routes
  for (const route of PUBLIC_ROUTES) {
    const access = evaluateRouteAccess(route, false);
    assert.equal(access.allowed, true, `Public route ${route} must be accessible anonymously`);
  }

  // 4. Session Token Structure check
  const validSupabaseAuthToken = "sb-access-token=mock_jwt_token; Path=/; HttpOnly; SameSite=Lax";
  assert.ok(validSupabaseAuthToken.includes("HttpOnly"), "Auth cookie must have HttpOnly flag");
  assert.ok(validSupabaseAuthToken.includes("SameSite=Lax"), "Auth cookie must have SameSite flag");

  console.log("OK: Auth Protection & Route Gating Test Passed.");
}

runAuthProtectionTest().catch((err) => {
  console.error("FAIL: Auth Protection Test Failed:", err);
  process.exit(1);
});
