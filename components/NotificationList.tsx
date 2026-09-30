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
    return <div className="rounded-md border border-ink/10 bg-white p-4 text-sm text-ink/60">No notifications yet.</div>;
  }

  return (
    <div className="space-y-2">
      {notifications.map((item) => (
        <Link key={item.id} href={item.href ?? "#"} className="block rounded-md border border-ink/10 bg-white p-4 transition hover:border-teal/40 hover:bg-mist/50 focus-ring">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{item.title}</div>
              <p className="mt-1 text-sm text-ink/65">{item.body}</p>
              <p className="mt-2 text-xs text-ink/45">{dateTime(item.created_at)}</p>
            </div>
            <StatusPill value={item.read_at ? "read" : item.type} />
          </div>
        </Link>
      ))}
    </div>
  );
}