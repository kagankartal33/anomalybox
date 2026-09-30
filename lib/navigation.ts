export function safeNextPath(value: string | null | undefined, fallback = "/profile") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://viralbox.local");
    if (!url.pathname.startsWith("/")) return fallback;
    if (url.pathname.startsWith("/api/")) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function storeSelectionPath({
  boxProductSlug,
  categorySlug,
  personaSlug,
  contextDetail,
  checkout,
}: {
  boxProductSlug: string;
  categorySlug: string;
  personaSlug: string;
  contextDetail?: string;
  checkout?: boolean;
}) {
  const params = new URLSearchParams({
    box: boxProductSlug,
    category: categorySlug,
    persona: personaSlug,
  });
  if (contextDetail) params.set("detail", contextDetail);
  if (checkout) params.set("checkout", "1");
  return `/store?${params.toString()}`;
}