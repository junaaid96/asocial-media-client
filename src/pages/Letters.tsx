import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { Clock, Feather, Mail, MailOpen } from "lucide-react";
import { Link, useSearchParams } from "react-router";
import { PageHeader, useShell } from "../components/AppShell";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api } from "../lib/api";
import { timeAgo, timeUntil } from "../lib/format";
import type { Letter } from "../lib/types";

export function Letters() {
  const { openLetter } = useShell();
  const [params, setParams] = useSearchParams();
  const box = params.get("box") === "sent" ? "sent" : "inbox";
  const letters = useQuery({
    queryKey: ["letters", box],
    queryFn: () => api<{ items: Letter[]; incoming: number }>("/letters", { query: { box } }),
    refetchInterval: 60_000,
  });

  return (
    <div>
      <PageHeader
        title="Letters"
        subtitle="Slow correspondence. Every letter takes time to arrive."
        action={
          <Button onClick={() => openLetter()}>
            <Feather className="size-4" /> <span className="hidden sm:inline">Write a letter</span>
            <span className="sm:hidden">Write</span>
          </Button>
        }
      />

      <div role="tablist" className="mb-4 flex gap-1 rounded-full border border-line bg-surface p-1">
        {(["inbox", "sent"] as const).map((b) => (
          <button
            key={b}
            role="tab"
            aria-selected={box === b}
            onClick={() => setParams(b === "sent" ? { box: "sent" } : {}, { replace: true })}
            className={clsx(
              "flex-1 rounded-full px-3 py-2 text-sm font-medium capitalize transition-colors",
              box === b ? "bg-accent text-on-accent" : "text-muted hover:text-ink",
            )}
          >
            {b === "inbox" ? "Received" : "Sent"}
          </button>
        ))}
      </div>

      {box === "inbox" && letters.data?.incoming ? (
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-clay-soft px-4 py-3 text-sm">
          <span className="text-xl" aria-hidden>
            ✉️
          </span>
          <p>
            <span className="font-semibold">
              {letters.data.incoming} {letters.data.incoming === 1 ? "letter is" : "letters are"} on the way to you.
            </span>{" "}
            <span className="text-muted">They'll arrive in their own time.</span>
          </p>
        </div>
      ) : null}

      {letters.isPending ? (
        <PageSpinner />
      ) : !letters.data?.items.length ? (
        <div className="card">
          <EmptyState icon="💌" title={box === "inbox" ? "Your mailbox is empty" : "No letters sent yet"}>
            {box === "inbox"
              ? "When someone writes to you, their letter will appear here after it finishes its journey."
              : "Write to someone whose words stayed with you. There's no rush to reply, for either of you."}
          </EmptyState>
        </div>
      ) : (
        <ul className="space-y-3">
          {letters.data.items.map((letter) => {
            const person = letter.direction === "sent" ? letter.to : letter.from;
            const unread = letter.direction === "received" && !letter.readAt;
            return (
              <li key={letter.id}>
                <Link
                  to={`/letters/${letter.id}`}
                  className={clsx(
                    "card flex gap-4 p-4 transition-transform hover:-translate-y-0.5 sm:p-5",
                    unread && "ring-2 ring-clay/40",
                  )}
                >
                  <Avatar user={person} showBattery />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate">
                        <span className="text-muted">{letter.direction === "sent" ? "To " : "From "}</span>
                        <span className="font-semibold">{person.displayName}</span>
                      </p>
                      <span className="shrink-0 text-xs text-muted">
                        {letter.direction === "sent" ? timeAgo(letter.sentAt) : timeAgo(letter.deliverAt)}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-2 font-serif text-[15px] leading-relaxed text-ink-soft">{letter.body}</p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs">
                      {letter.direction === "sent" ? (
                        letter.arrived ? (
                          <span className="inline-flex items-center gap-1 text-accent">
                            <MailOpen className="size-3.5" /> Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-clay">
                            <Clock className="size-3.5" /> In transit · arrives in {timeUntil(letter.deliverAt)}
                          </span>
                        )
                      ) : unread ? (
                        <span className="inline-flex items-center gap-1 font-medium text-clay">
                          <Mail className="size-3.5" /> Unopened
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted">
                          <MailOpen className="size-3.5" /> Read
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
