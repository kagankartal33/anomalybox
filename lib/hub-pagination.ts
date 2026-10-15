export const HUB_PAGE_SIZE = 9;

export function pageFromSearch(search: { page?: string | string[] } | undefined): number {
  return parseHubPage(search?.page);
}

export function parseHubPage(raw: string | undefined | string[]): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const parsed = Number.parseInt(value ?? "1", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return parsed;
}

export function hubPageCount(totalItems: number, pageSize = HUB_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(Math.max(totalItems, 0) / pageSize));
}

export function clampHubPage(page: number, totalItems: number, pageSize = HUB_PAGE_SIZE): number {
  return Math.min(Math.max(page, 1), hubPageCount(totalItems, pageSize));
}

export function sliceHubPage<T>(items: T[], page: number, pageSize = HUB_PAGE_SIZE): T[] {
  const current = clampHubPage(page, items.length, pageSize);
  const start = (current - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function hubPageHref(basePath: string, page: number): string {
  if (page <= 1) return basePath;
  return `${basePath}/p/${page}`;
}

/** Compact page list: first, last, and a window around the current page. */
export function hubPageWindow(current: number, totalPages: number): Array<number | "gap"> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const window = new Set<number>([1, totalPages, current, current - 1, current + 1]);
  if (current <= 3) {
    window.add(2);
    window.add(3);
    window.add(4);
  }
  if (current >= totalPages - 2) {
    window.add(totalPages - 1);
    window.add(totalPages - 2);
    window.add(totalPages - 3);
  }

  const sorted = [...window].filter((page) => page >= 1 && page <= totalPages).sort((a, b) => a - b);
  const result: Array<number | "gap"> = [];
  for (const page of sorted) {
    const prev = result[result.length - 1];
    if (typeof prev === "number" && page - prev > 1) result.push("gap");
    result.push(page);
  }
  return result;
}
