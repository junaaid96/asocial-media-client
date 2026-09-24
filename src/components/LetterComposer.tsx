import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Feather, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { PACES } from "../lib/meta";
import type { Pace, PersonSummary } from "../lib/types";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

const PACE_KEYS = Object.keys(PACES) as Pace[];

export function LetterComposer({ draft, onClose }: { draft: { to?: string; replyTo?: string } | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [to, setTo] = useState("");
  const [body, setBody] = useState("");
  const [pace, setPace] = useState<Pace>("afternoon");

  useEffect(() => {
    if (draft) {
      setTo(draft.to ?? "");
      setBody("");
      setPace("afternoon");
    }
  }, [draft]);

  const lookup = to.replace(/^@/, "").trim();
  const people = useQuery({
    queryKey: ["search-people", lookup],
    queryFn: () => api<{ people: PersonSummary[] }>("/search", { query: { q: lookup } }).then((r) => r.people),
    enabled: !!draft && !draft.to && lookup.length >= 2,
    staleTime: 30_000,
  });
  const exact = people.data?.some((p) => p.username === lookup.toLowerCase());

  const send = useMutation({
    mutationFn: () => api<{ id: string; deliverAt: string }>("/letters", { method: "POST", body: { to: lookup, body, pace, replyTo: draft?.replyTo } }),
    onSuccess: () => {
      toast.success("Your letter is on its way", { description: `It will arrive ${PACES[pace].label.toLowerCase()} (${PACES[pace].eta}).` });
      queryClient.invalidateQueries({ queryKey: ["letters"] });
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={!!draft} onClose={onClose} title={draft?.replyTo ? "Write back" : "Write a letter"} className="w-[min(100%-1.5rem,36rem)]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send.mutate();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-muted">
          Letters travel slowly on purpose. No read receipts, no typing bubbles — just time to say what you mean.
        </p>
        <div>
          <label className="label" htmlFor="letter-to">
            To
          </label>
          <input
            id="letter-to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="@username"
            className="field"
            readOnly={!!draft?.to}
            autoComplete="off"
            required
          />
          {people.data?.length && !exact ? (
            <ul className="mt-2 space-y-1" aria-label="Matching people">
              {people.data.slice(0, 4).map((person) => (
                <li key={person.username}>
                  <button
                    type="button"
                    onClick={() => setTo(person.username)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-surface-2"
                  >
                    <Avatar user={person} size="xs" showBattery />
                    <span className="text-sm font-medium">{person.displayName}</span>
                    <span className="text-xs text-muted">@{person.username}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="letter-body">
            Your letter
          </label>
          <textarea
            id="letter-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            maxLength={5000}
            required
            placeholder="Dear friend,"
            className="field paper resize-y font-serif text-[17px] leading-8"
          />
        </div>
        <fieldset>
          <legend className="label">How fast should it travel?</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {PACE_KEYS.map((key) => (
              <label
                key={key}
                className={clsx(
                  "cursor-pointer rounded-2xl border p-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-accent",
                  pace === key ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2",
                )}
              >
                <input type="radio" name="pace" value={key} checked={pace === key} onChange={() => setPace(key)} className="sr-only" />
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Feather className="size-3.5 text-accent" /> {PACES[key].label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {PACES[key].eta} · {PACES[key].description}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>
            Not now
          </Button>
          <Button type="submit" loading={send.isPending} disabled={!lookup || !body.trim()}>
            <Send className="size-4" /> Send letter
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
