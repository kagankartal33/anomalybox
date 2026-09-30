import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ indexNowKey: string }> },
) {
  const expected = process.env.INDEXNOW_KEY?.trim();
  const { indexNowKey } = await context.params;
  if (!expected || indexNowKey !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }
  return new NextResponse(expected, {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}