import { useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { AtSign, Mail, MessageCircle, Moon, UserPlus } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router";
import { PageHeader } from "../components/AppShell";
import { Avatar } from "../components/ui/Avatar";
import { EmptyState } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { timeAgo } from "../lib/format";
import { REACTIONS } from "../lib/meta";
import type { Notification } from "../lib/types";

export function Notifications() {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const list = useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ items: Notification[] }>("/notifications").then((r) => r.items),
  });

  // Opening the page marks everything (except unopened letters) as read.
  useEffect(() => {
    if (!list.data?.some((n) => !n.read && n.type !== "letter")) return;
    api("/notifications/read", { method: "POST" }).then(() => queryClient.invalidateQueries({ queryKey: ["summary"] }));
  }, [list.data, queryClient]);

  return (
    <div>
      <PageHeader title="Notifications" subtitle="Checked once a minute — never a flood." />
      {me?.battery === "recharging" ? (
        <p className="mb-4 flex items-center gap-2 rounded-2xl bg-accent-soft px-4 py-3 text-sm text-accent-strong">
          <Moon className="size-4" /> You're recharging, so badges are hushed. Everything is still waiting here when you're ready.
        </p>
      ) : null}
      {list.isPending ? (
        <PageSpinner />
      ) : !list.data?.length ? (
        <div className="card">
          <EmptyState icon="🌙" title="All quiet">
            When someone resonates with your words, replies, follows you, or a letter arrives, you'll find it here.
          </EmptyState>
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {list.data.map((n) => (
            <li key={n.id}>
              <Link
                to={n.type === "letter" ? `/letters/${n.letterId}` : n.type === "follow" && n.actor ? `/u/${n.actor.username}` : `/post/${n.postId}`}
                className={clsx("flex gap-3.5 px-4 py-4 transition-colors hover:bg-surface-2 sm:px-5", !n.read && "bg-accent-soft/40")}
              >
                <div className="relative">
                  <Avatar user={n.actor} />
                  <span className="absolute -right-1 -bottom-1 grid size-6 place-items-center rounded-full bg-surface text-sm ring-2 ring-surface">
                    <NotificationIcon n={n} />
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] leading-snug">
                    <span className="font-semibold">{n.actor?.displayName ?? "Someone"}</span> {describe(n)}
                  </p>
                  {n.commentExcerpt || n.postExcerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">“{n.commentExcerpt || n.postExcerpt}”</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-clay" aria-label="Unread" /> : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function describe(n: Notification) {
  switch (n.type) {
    case "reaction":
      return n.reaction ? `${REACTIONS[n.reaction].verb} your post` : "resonated with your post";
    case "comment":
      return "replied to your post";
    case "follow":
      return "started following you";
    case "letter":
      return "sent you a letter. It just arrived.";
    case "mention":
      return n.commentId ? "mentioned you in a reply" : "mentioned you in a post";
    case "comment_reaction":
      return n.reaction ? `${REACTIONS[n.reaction].verb} your reply` : "resonated with your reply";
  }
}

function NotificationIcon({ n }: { n: Notification }) {
  if (n.type === "reaction" || n.type === "comment_reaction") return <span aria-hidden>{n.reaction ? REACTIONS[n.reaction].emoji : "🤍"}</span>;
  if (n.type === "comment") return <MessageCircle className="size-3.5 text-accent" />;
  if (n.type === "follow") return <UserPlus className="size-3.5 text-accent" />;
  if (n.type === "mention") return <AtSign className="size-3.5 text-accent" />;
  return <Mail className="size-3.5 text-clay" />;
}
