import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const expected = process.env.INDEXNOW_KEY?.trim();
  const url = new URL(request.url);
  const key = url.pathname.replace(/^\//, "").replace(/\.txt$/, "");
  if (!expected || key !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(expected, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}