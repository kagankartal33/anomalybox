import Link from "next/link";
import { dateTime } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  created_at: string;
};

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  if (!notifications.length) {
    return (
      <div className="rounded-md border border-ink/10 bg-white p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Inbox empty</p>
        <p className="mt-2 text-sm font-semibold text-ink/80">No notifications yet</p>
        <p className="mt-1 text-sm leading-6 text-ink/55">
          Delivery notices and card-report updates will show up here after you buy or open a box.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((item) => {
        const isUnread = !item.read_at;
        return (
          <Link
            key={item.id}
            href={item.href ?? "#"}
            className={`block rounded-xl border p-4 transition focus-ring ${
              isUnread
                ? "border-plum/20 bg-plum-soft/30 hover:border-plum-deep/40 hover:bg-plum-soft/50 shadow-sm"
                : "border-ink/10 bg-white hover:border-ink/25 hover:bg-paper"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-plum-deep shrink-0" aria-label="Unread notification" />
                  )}
                  <div className={`text-sm ${isUnread ? "font-bold text-ink" : "font-semibold text-ink/80"}`}>
                    {item.title}
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink/65 leading-relaxed">{item.body}</p>
                <p className="mt-2 text-xs text-ink/40 tabular-nums">{dateTime(item.created_at)}</p>
              </div>
              <StatusPill value={item.read_at ? "read" : item.type} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
