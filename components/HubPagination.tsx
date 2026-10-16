import Link from "next/link";
import { hubPageHref, hubPageWindow } from "@/lib/hub-pagination";

type Props = {
  basePath: string;
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

export function HubPagination({ basePath, page, totalPages, totalItems, pageSize }: Props) {
  if (totalPages <= 1) return null;

  const shownFrom = (page - 1) * pageSize + 1;
  const shownTo = Math.min(page * pageSize, totalItems);
  const pages = hubPageWindow(page, totalPages);

  return (
    <nav
      className="mt-10 flex flex-col items-center gap-4 border-t border-ink/10 pt-8"
      aria-label="Resource pages"
    >
      <p className="text-sm text-ink/60">
        {shownFrom}–{shownTo} of {totalItems} guides · page {page} of {totalPages}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <Link
            href={hubPageHref(basePath, page - 1)}
            className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink/80 transition hover:border-plum-deep/30 hover:bg-plum-soft/40"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-lg border border-ink/8 px-3 py-2 text-sm font-semibold text-ink/60">Previous</span>
        )}

        <ol className="flex flex-wrap items-center justify-center gap-1">
          {pages.map((item, index) =>
            item === "gap" ? (
              <li key={`gap-${index}`} className="px-1 text-sm text-ink/60" aria-hidden>
                …
              </li>
            ) : (
              <li key={item}>
                {item === page ? (
                  <span
                    aria-current="page"
                    className="inline-flex min-w-10 items-center justify-center rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white"
                  >
                    {item}
                  </span>
                ) : (
                  <Link
                    href={hubPageHref(basePath, item)}
                    className="focus-ring inline-flex min-w-10 items-center justify-center rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink/80 transition hover:border-plum-deep/30 hover:bg-plum-soft/40"
                  >
                    {item}
                  </Link>
                )}
              </li>
            ),
          )}
        </ol>

        {page < totalPages ? (
          <Link
            href={hubPageHref(basePath, page + 1)}
            className="focus-ring rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-semibold text-ink/80 transition hover:border-plum-deep/30 hover:bg-plum-soft/40"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-lg border border-ink/8 px-3 py-2 text-sm font-semibold text-ink/60">Next</span>
        )}
      </div>
    </nav>
  );
}
