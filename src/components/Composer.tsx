import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { EyeOff, ImagePlus, ShieldAlert, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { uploadImage } from "../lib/image";
import { MOOD_KEYS } from "../lib/meta";
import { usePrompt } from "../lib/queries";
import type { Mood, Post, Visibility } from "../lib/types";
import { RichEditor } from "./RichEditor";
import { VisibilityPicker } from "./VisibilityPicker";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { MoodChip } from "./ui/misc";

const MAX = 3000;

export function Composer({ answeringPrompt = false, onPosted, autoFocus }: { answeringPrompt?: boolean; onPosted?: () => void; autoFocus?: boolean }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const prompt = usePrompt();
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<Mood | null>(null);
  const [focused, setFocused] = useState(!!autoFocus);
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null);
  const [cwOn, setCwOn] = useState(false);
  const [warning, setWarning] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [forPrompt, setForPrompt] = useState(answeringPrompt);
  const [visibility, setVisibility] = useState<Visibility>("public");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => setForPrompt(answeringPrompt), [answeringPrompt]);
  useEffect(() => () => {
    if (image) URL.revokeObjectURL(image.preview);
  }, [image]);

  const publish = useMutation({
    mutationFn: async () => {
      const upload = image ? await uploadImage(image.file, "post") : null;
      return api<{ post: Post }>("/posts", {
        method: "POST",
        body: {
          body,
          imageKey: upload?.key ?? null,
          mood,
          contentWarning: cwOn ? warning : null,
          isAnonymous: anonymous,
          answersPrompt: forPrompt,
          visibility,
        },
      });
    },
    onSuccess: () => {
      setBody("");
      setMood(null);
      setImage(null);
      setCwOn(false);
      setWarning("");
      setAnonymous(false);
      setForPrompt(false);
      setVisibility("public");
      setFocused(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["prompt"] });
      toast.success(
        visibility === "private" ? "Saved privately, just for you" : anonymous ? "Shared anonymously" : visibility === "followers" ? "Shared with your followers" : "Shared with the quiet corner",
      );
      onPosted?.();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!me) return null;
  const expanded = focused || !!body || !!image;
  const canPost = (body.trim().length > 0 || !!image) && body.length <= MAX && (!cwOn || warning.trim().length > 0);

  return (
    <form
      className="card p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (canPost) publish.mutate();
      }}
    >
      {forPrompt && prompt.data ? (
        <div className="mb-3 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-sm text-accent-strong">
          <Sparkles className="mt-0.5 size-4 shrink-0" />
          <p className="flex-1 font-serif italic">{prompt.data.text}</p>
          <button type="button" onClick={() => setForPrompt(false)} aria-label="Stop answering the prompt" className="opacity-70 hover:opacity-100">
            <X className="size-4" />
          </button>
        </div>
      ) : null}
      <div className="flex gap-3">
        <Avatar user={anonymous ? null : me} showBattery={!anonymous} />
        <div className="min-w-0 flex-1">
          <RichEditor
            id="composer"
            label="Write a post"
            value={body}
            onChange={setBody}
            onFocus={() => setFocused(true)}
            onSubmit={() => canPost && publish.mutate()}
            autoFocus={autoFocus}
            rows={expanded ? 4 : 1}
            toolbar={expanded}
            placeholder={forPrompt ? "Take your time…" : "What's on your mind, quietly?"}
            className="w-full resize-none bg-transparent pt-2 text-[17px] leading-relaxed outline-none placeholder:text-muted"
          />
        </div>
      </div>

      {image ? (
        <div className="relative mt-3 ml-14 inline-block">
          <img src={image.preview} alt="Selected upload preview" className="max-h-72 rounded-2xl border border-line object-cover" />
          <button
            type="button"
            onClick={() => setImage(null)}
            className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur hover:bg-black/75"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      {expanded ? (
        <div className="mt-3 animate-fade-in space-y-3 sm:ml-14">
          <div>
            <p className="mb-2 text-xs font-medium text-muted">How are you feeling?</p>
            <div className="flex flex-wrap gap-1.5">
              {MOOD_KEYS.map((m) => (
                <MoodChip key={m} mood={m} active={mood === m} onClick={() => setMood(mood === m ? null : m)} />
              ))}
            </div>
          </div>
          <VisibilityPicker name="composer-visibility" value={visibility} onChange={setVisibility} />
          {cwOn ? (
            <input
              value={warning}
              onChange={(e) => setWarning(e.target.value)}
              maxLength={80}
              className="field py-2 text-sm"
              placeholder="Content note, e.g. grief, anxiety, loneliness"
              aria-label="Content note"
              autoFocus
            />
          ) : null}
        </div>
      ) : null}

      <div className={clsx("mt-3 flex items-center gap-1 sm:ml-14", !expanded && "hidden")}>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) setImage({ file, preview: URL.createObjectURL(file) });
          }}
        />
        <ToolButton label="Add a photo" onClick={() => fileInput.current?.click()}>
          <ImagePlus className="size-[18px]" />
        </ToolButton>
        <ToolButton label="Add a content note" active={cwOn} onClick={() => setCwOn((v) => !v)}>
          <ShieldAlert className="size-[18px]" />
        </ToolButton>
        <ToolButton label={anonymous ? "Posting anonymously" : "Post anonymously"} active={anonymous} onClick={() => setAnonymous((v) => !v)}>
          <EyeOff className="size-[18px]" />
        </ToolButton>
        {prompt.data && !forPrompt ? (
          <ToolButton label="Answer today's prompt" onClick={() => setForPrompt(true)}>
            <Sparkles className="size-[18px]" />
          </ToolButton>
        ) : null}
        <span className={clsx("ml-auto text-xs tabular-nums", body.length > MAX ? "text-clay" : "text-muted")}>
          {body.length > MAX * 0.8 ? `${body.length}/${MAX}` : ""}
        </span>
        <Button type="submit" loading={publish.isPending} disabled={!canPost} className="ml-2">
          {anonymous ? "Share anonymously" : "Share"}
        </Button>
      </div>
      {anonymous && expanded ? (
        <p className="mt-2 text-xs text-muted sm:ml-14">Your name won't be shown. Only you will know this post is yours.</p>
      ) : null}
    </form>
  );
}

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={clsx(
        "rounded-full p-2 transition-colors",
        active ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}
