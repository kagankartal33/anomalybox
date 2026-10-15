/** Minimal host surface for the cross-runtime TypeScript check; not a Deno runtime test. */
declare namespace Deno {
  const env: { get(name: string): string | undefined };
  function serve(handler: (request: Request) => Response | Promise<Response>): void;
}
