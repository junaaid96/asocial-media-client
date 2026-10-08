import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import type { ReportReason, ReportTarget } from "../lib/types";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";

export const REPORT_REASONS: Record<ReportReason, { label: string; hint: string }> = {
  spam: { label: "Spam or scam", hint: "Ads, repeated content, suspicious links" },
  harassment: { label: "Harassment or bullying", hint: "Targeting, insulting or threatening someone" },
  hate: { label: "Hate", hint: "Attacks on people for who they are" },
  self_harm: { label: "Self-harm or suicide", hint: "Someone may be at risk" },
  sexual: { label: "Sexual content", hint: "Explicit or unwanted sexual content" },
  violence: { label: "Violence", hint: "Threats or glorifying violence" },
  misinformation: { label: "False information", hint: "Misleading claims that could cause harm" },
  impersonation: { label: "Impersonation", hint: "Pretending to be someone else" },
  other: { label: "Something else", hint: "Tell us what's wrong" },
};

const KEYS = Object.keys(REPORT_REASONS) as ReportReason[];

const NOUN: Record<ReportTarget["targetType"], string> = { user: "account", post: "post", message: "message" };

/** Report a user, post or message to the moderators with a reason. */
export function ReportDialog({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const noun = target ? NOUN[target.targetType] : "content";

  const submit = useMutation({
    mutationFn: () => api("/reports", { method: "POST", body: { ...target, reason, details } }),
    onSuccess: () => {
      toast("Thank you. Our moderators will take a look.");
      close();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const close = () => {
    setReason(null);
    setDetails("");
    onClose();
  };

  const needsDetails = reason === "other" && details.trim().length < 3;

  return (
    <Dialog open={!!target} onClose={close} title={`Report this ${noun}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (reason && !needsDetails) submit.mutate();
        }}
        className="space-y-4"
      >
        <p className="text-sm text-muted">Reports are private. The person you report won't know it was you.</p>
        <fieldset>
          <legend className="label">What's the problem?</legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {KEYS.map((key) => (
              <label
                key={key}
                className={clsx(
                  "flex cursor-pointer flex-col rounded-xl border px-3 py-2 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                  reason === key ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2",
                )}
              >
                <input type="radio" name="report-reason" value={key} checked={reason === key} onChange={() => setReason(key)} className="sr-only" />
                <span className="text-sm font-medium">{REPORT_REASONS[key].label}</span>
                <span className="text-xs text-muted">{REPORT_REASONS[key].hint}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label className="label" htmlFor="report-details">
            Anything else we should know? <span className="font-normal text-muted">{reason === "other" ? "(required)" : "(optional)"}</span>
          </label>
          <textarea
            id="report-details"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={3}
            maxLength={1000}
            className="field resize-y"
            placeholder="Add context that helps a moderator understand"
          />
        </div>
        {reason === "self_harm" ? (
          <p className="rounded-xl bg-clay-soft px-3 py-2 text-sm text-ink-soft">
            If someone is in immediate danger, please contact local emergency services as well.
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submit.isPending} disabled={!reason || needsDetails}>
            Send report
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
