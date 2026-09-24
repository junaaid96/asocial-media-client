import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, CornerUpLeft, Feather } from "lucide-react";
import { useEffect } from "react";
import { Link, useParams } from "react-router";
import { useShell } from "../components/AppShell";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { fullDate, timeUntil } from "../lib/format";
import type { Letter } from "../lib/types";

export function LetterView() {
  const { id = "" } = useParams();
  const { openLetter } = useShell();
  const queryClient = useQueryClient();
  const letter = useQuery({ queryKey: ["letter", id], queryFn: () => api<{ letter: Letter }>(`/letters/${id}`).then((r) => r.letter) });

  useEffect(() => {
    if (letter.data?.direction === "received") {
      queryClient.invalidateQueries({ queryKey: ["summary"] });
      queryClient.invalidateQueries({ queryKey: ["letters", "inbox"] });
    }
  }, [letter.data, queryClient]);

  return (
    <div>
      <Link to="/letters" className="mb-4 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All letters
      </Link>
      {letter.isPending ? (
        <PageSpinner />
      ) : letter.isError ? (
        <div className="card">
          <EmptyState icon="📭" title="Letter not found">
            {errorMessage(letter.error)}
          </EmptyState>
        </div>
      ) : (
        <article className="card paper animate-rise overflow-hidden px-6 py-8 sm:px-10 sm:py-10">
          <header className="flex items-center gap-3 border-b border-line pb-5">
            <Avatar user={letter.data.from} size="lg" showBattery />
            <div className="min-w-0">
              <p className="text-sm text-muted">
                From{" "}
                <Link to={`/u/${letter.data.from.username}`} className="font-semibold text-ink hover:underline">
                  {letter.data.from.displayName}
                </Link>{" "}
                to{" "}
                <Link to={`/u/${letter.data.to.username}`} className="font-semibold text-ink hover:underline">
                  {letter.data.to.displayName}
                </Link>
              </p>
              <p className="mt-0.5 text-xs text-muted">Written {fullDate(letter.data.sentAt)}</p>
              {letter.data.direction === "sent" && !letter.data.arrived ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-clay">
                  <Clock className="size-3.5" /> Still travelling · arrives in {timeUntil(letter.data.deliverAt)}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted">Arrived {fullDate(letter.data.deliverAt)}</p>
              )}
            </div>
          </header>
          {letter.data.replyTo ? (
            <Link to={`/letters/${letter.data.replyTo.id}`} className="mt-5 flex items-start gap-2 rounded-xl bg-surface-2/70 px-3 py-2 text-sm text-muted hover:text-ink">
              <CornerUpLeft className="mt-0.5 size-4 shrink-0" />
              <span className="line-clamp-2 italic">In reply to: “{letter.data.replyTo.excerpt}”</span>
            </Link>
          ) : null}
          <p className="mt-6 font-serif text-[18px] leading-8 break-words whitespace-pre-wrap">{letter.data.body}</p>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-3">
            <p className="font-serif text-lg italic text-muted">— {letter.data.from.displayName}</p>
            {letter.data.direction === "received" ? (
              <Button onClick={() => openLetter({ to: letter.data.from.username, replyTo: letter.data.id })}>
                <Feather className="size-4" /> Write back
              </Button>
            ) : null}
          </footer>
        </article>
      )}
    </div>
  );
}
