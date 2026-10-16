import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

/**
 * Keeps Supabase sessions alive.
 *
 * Server Components cannot write cookies, so when a page refreshes an expired access token the new
 * token pair is thrown away. The next request then replays the already-used refresh token, which
 * Supabase treats as token reuse and the creator is signed out. Refreshing here, before rendering,
 * lets the rotated tokens be written to the response.
 *
 * Requests without a Supabase auth cookie (anonymous visitors and crawlers) skip the Auth round trip.
 */
export async function proxy(request: NextRequest) {
  const hasAuthCookie = request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
  if (!hasAuthCookie) return NextResponse.next();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.supabaseUrl(), env.supabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Validates the session with Supabase Auth and refreshes it when the access token has expired.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|assets/|brand/|favicon|apple-touch-icon|site\\.webmanifest|robots\\.txt|sitemap\\.xml|feed\\.xml|llms\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml)$).*)",
  ],
};
