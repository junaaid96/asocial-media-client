import { format, parseISO } from "date-fns";
import { Sparkles } from "lucide-react";
import { Link, useParams } from "react-router";
import { FeedList, defaultEmpty } from "../components/FeedList";
import { EmptyState } from "../components/ui/misc";
import { useAuth } from "../lib/auth";
import { usePrompt, usePromptAnswers, usePromptOn } from "../lib/queries";

export function PromptAnswers() {
  const date = useParams().date ?? "";
  const { me } = useAuth();
  const prompt = usePromptOn(date);
  const today = usePrompt();
  const answers = usePromptAnswers(date);
  const isToday = today.data?.date === date;

  if (prompt.isError) {
    return (
      <div className="card">
        <EmptyState icon="🗓️" title="No prompt for that day">
          That prompt hasn't been asked yet. <Link to="/" className="text-accent hover:underline">Back home</Link>
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <section className="card relative mb-5 overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute -top-10 -right-10 size-40 rounded-full bg-accent/10 blur-2xl" />
        <p className="flex items-center gap-1.5 text-xs font-semibold tracking-[0.12em] text-accent uppercase">
          <Sparkles className="size-3.5" aria-hidden /> {isToday ? "Today's prompt" : "Daily prompt"}
          {/^\d{4}-\d{2}-\d{2}$/.test(date) ? <span className="font-normal tracking-normal text-muted normal-case">· {format(parseISO(date), "MMMM d, yyyy")}</span> : null}
        </p>
        <h1 className="mt-2.5 font-serif text-2xl leading-snug font-semibold sm:text-3xl">{prompt.data?.text ?? "…"}</h1>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">
            {prompt.data ? (prompt.data.answers ? `${prompt.data.answers} public ${prompt.data.answers === 1 ? "answer" : "answers"}` : "No public answers yet") : ""}
          </span>
          {isToday ? (
            <Link to={me ? "/?answer=1" : "/join"} className="font-medium text-accent hover:underline">
              Write yours
            </Link>
          ) : null}
        </div>
      </section>
      <FeedList query={answers} empty={defaultEmpty("No answers here yet", "When people answer this prompt, their words gather here.", "✨")} />
    </div>
  );
}
