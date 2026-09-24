import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { Bookmark, EyeOff, Link2, MessageCircle, MoreHorizontal, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { api, assetUrl, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fullDate, timeAgo } from "../lib/format";
import { MOOD_KEYS, REACTIONS, REACTION_KEYS } from "../lib/meta";
import { patchPostEverywhere, removePostEverywhere, updatePostEverywhere } from "../lib/queries";
import type { Mood, Post, ReactionKind } from "../lib/types";
import { CommentThread } from "./CommentThread";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { Menu, MenuItem } from "./ui/Menu";
import { MoodChip } from "./ui/misc";

const LONG_POST = 600;

export function PostCard({ post, expandComments = false }: { post: Post; expandComments?: boolean }) {
  const { me } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [revealed, setRevealed] = useState(!post.contentWarning || post.isMine);
  const [expanded, setExpanded] = useState(post.body.length <= LONG_POST);
  const [showComments, setShowComments] = useState(expandComments);
  const [editing, setEditing] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const requireSignIn = () => {
    toast("Join aSocial to respond", { action: { label: "Sign in", onClick: () => navigate("/login") } });
  };

  const react = useMutation({
    mutationFn: (kind: ReactionKind | null) =>
      kind
        ? api<{ post: Post }>(`/posts/${post.id}/reaction`, { method: "PUT", body: { kind } })
        : api<{ post: Post }>(`/posts/${post.id}/reaction`, { method: "DELETE" }),
    onMutate: (kind) => {
      const previous = post.myReaction;
      patchPostEverywhere(queryClient, post.id, { myReaction: kind });
      return { previous };
    },
    onSuccess: (data) => updatePostEverywhere(queryClient, data.post),
    onError: (error, _kind, context) => {
      patchPostEverywhere(queryClient, post.id, { myReaction: context?.previous ?? null });
      toast.error(errorMessage(error));
    },
  });

  const bookmark = useMutation({
    mutationFn: (save: boolean) => api(`/posts/${post.id}/bookmark`, { method: save ? "POST" : "DELETE" }),
    onMutate: (save) => patchPostEverywhere(queryClient, post.id, { bookmarked: save }),
    onSuccess: (_data, save) => {
      toast(save ? "Saved for a quieter moment" : "Removed from saved");
      queryClient.invalidateQueries({ queryKey: ["posts", "bookmarks"] });
    },
    onError: (error, save) => {
      patchPostEverywhere(queryClient, post.id, { bookmarked: !save });
      toast.error(errorMessage(error));
    },
  });

  const remove = useMutation({
    mutationFn: () => api(`/posts/${post.id}`, { method: "DELETE" }),
    onSuccess: () => {
      removePostEverywhere(queryClient, post.id);
      queryClient.invalidateQueries({ queryKey: ["prompt"] });
      toast("Post deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const copyLink = async () => {
    await navigator.clipboard?.writeText(`${location.origin}/post/${post.id}`).catch(() => undefined);
    toast("Link copied");
  };

  const body = expanded ? post.body : `${post.body.slice(0, LONG_POST).trimEnd()}…`;

  return (
    <article className="card animate-rise overflow-hidden" aria-label={`Post by ${post.author?.displayName ?? "a quiet soul"}`}>
      <div className="p-4 sm:p-5">
        <header className="flex items-start gap-3">
          {post.author ? (
            <Link to={`/u/${post.author.username}`} className="rounded-full">
              <Avatar user={post.author} showBattery />
            </Link>
          ) : (
            <Avatar user={null} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 leading-tight">
              {post.author ? (
                <Link to={`/u/${post.author.username}`} className="truncate font-semibold hover:underline">
                  {post.author.displayName}
                </Link>
              ) : (
                <span className="font-semibold">A quiet soul</span>
              )}
              {post.author ? <span className="truncate text-sm text-muted">@{post.author.username}</span> : null}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              <Link to={`/post/${post.id}`} title={fullDate(post.createdAt)} className="hover:underline">
                {timeAgo(post.createdAt)}
              </Link>
              {post.editedAt ? <span title={fullDate(post.editedAt)}>· edited</span> : null}
              {post.isAnonymous && post.isMine ? (
                <span className="inline-flex items-center gap-1" title="Only you can see that this is yours">
                  · <EyeOff className="size-3.5" /> posted anonymously
                </span>
              ) : null}
            </div>
          </div>
          {post.mood ? <MoodChip mood={post.mood} /> : null}
          <Menu label="Post options" trigger={<MoreHorizontal className="size-5" />}>
            {(close) => (
              <>
                <MenuItem onClick={() => (copyLink(), close())}>
                  <Link2 className="size-4" /> Copy link
                </MenuItem>
                {post.isMine ? (
                  <>
                    <MenuItem onClick={() => (setEditing(true), close())}>
                      <Pencil className="size-4" /> Edit
                    </MenuItem>
                    <MenuItem
                      danger
                      onClick={() => {
                        close();
                        if (confirm("Delete this post? This can't be undone.")) remove.mutate();
                      }}
                    >
                      <Trash2 className="size-4" /> Delete
                    </MenuItem>
                  </>
                ) : null}
              </>
            )}
          </Menu>
        </header>

        {post.promptDate ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
            <Sparkles className="size-3.5" /> Answering the daily prompt
          </p>
        ) : null}

        <div className="relative mt-3">
          {!revealed ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface-2/60 p-5 text-center">
              <p className="text-sm text-ink-soft">
                <span className="font-medium">Content note:</span> {post.contentWarning}
              </p>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => setRevealed(true)}>
                Show post
              </Button>
            </div>
          ) : (
            <>
              {post.contentWarning ? (
                <p className="mb-2 text-xs font-medium text-muted">Content note: {post.contentWarning}</p>
              ) : null}
              {post.body ? (
                <p className="text-[16px] leading-relaxed break-words whitespace-pre-wrap text-ink">
                  {body}
                  {!expanded ? (
                    <button onClick={() => setExpanded(true)} className="ml-1 font-medium text-accent hover:underline">
                      Read more
                    </button>
                  ) : null}
                </p>
              ) : null}
              {post.imageUrl ? (
                <button onClick={() => setLightbox(true)} className="mt-3 block w-full overflow-hidden rounded-2xl border border-line bg-surface-2">
                  <img
                    src={assetUrl(post.imageUrl)}
                    alt={post.body ? `Image shared with: ${post.body.slice(0, 80)}` : "Shared image"}
                    className="max-h-[32rem] w-full object-cover transition-transform duration-500 hover:scale-[1.01]"
                    loading="lazy"
                    decoding="async"
                  />
                </button>
              ) : null}
            </>
          )}
        </div>

        <footer className="mt-4 flex items-center gap-1 border-t border-line pt-3">
          <ReactionControl
            current={post.myReaction}
            onReact={(kind) => (me ? react.mutate(kind) : requireSignIn())}
          />
          <button
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <MessageCircle className="size-[18px]" />
            {post.commentCount ? `${post.commentCount} ${post.commentCount === 1 ? "reply" : "replies"}` : "Reply"}
          </button>
          <div className="ml-auto flex items-center gap-2">
            {post.reactionTotal !== null && post.reactionTotal > 0 ? (
              <span
                className="text-xs whitespace-nowrap text-muted"
                title={REACTION_KEYS.filter((k) => post.reactionCounts?.[k])
                  .map((k) => `${REACTIONS[k].emoji} ${post.reactionCounts?.[k]}`)
                  .join("  ")}
              >
                {post.isMine ? <span className="hidden sm:inline">Resonated with </span> : null}
                {post.reactionTotal} <span className="hidden sm:inline">{post.reactionTotal === 1 ? "person" : "people"}</span>
                <span className="sm:hidden" aria-hidden>
                  {" "}🤍
                </span>
              </span>
            ) : null}
            <button
              onClick={() => (me ? bookmark.mutate(!post.bookmarked) : requireSignIn())}
              aria-pressed={post.bookmarked}
              aria-label={post.bookmarked ? "Remove from saved" : "Save for later"}
              className={clsx(
                "rounded-full p-2 transition-colors hover:bg-surface-2",
                post.bookmarked ? "text-accent" : "text-muted hover:text-ink",
              )}
            >
              <Bookmark className="size-[18px]" fill={post.bookmarked ? "currentColor" : "none"} />
            </button>
          </div>
        </footer>
      </div>

      {showComments ? <CommentThread post={post} /> : null}

      {post.imageUrl ? (
        <Dialog open={lightbox} onClose={() => setLightbox(false)} title="Image" hideTitle className="w-[min(100%-1.5rem,64rem)]">
          <img src={assetUrl(post.imageUrl)} alt="" className="w-full rounded-xl" />
        </Dialog>
      ) : null}
      {editing ? <EditPostDialog post={post} onClose={() => setEditing(false)} /> : null}
    </article>
  );
}

function ReactionControl({ current, onReact }: { current: ReactionKind | null; onReact: (kind: ReactionKind | null) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const meta = current ? REACTIONS[current] : null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref} onMouseLeave={() => setOpen(false)}>
      <button
        // Tapping opens the picker (never toggles it shut, since touch also fires mouseenter).
        onClick={() => (current ? onReact(null) : setOpen(true))}
        onMouseEnter={() => setOpen(true)}
        aria-label={meta ? `Remove reaction: ${meta.label}` : "React"}
        aria-pressed={!!current}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
          current ? "bg-accent-soft font-medium text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-ink",
        )}
      >
        <span className="text-base leading-none" aria-hidden>
          {meta?.emoji ?? "🤍"}
        </span>
        {meta?.label ?? "Resonate"}
      </button>
      {open ? (
        <div className="absolute bottom-full left-0 z-20 pb-2">
          <div role="group" aria-label="Choose a reaction" className="card flex animate-rise gap-0.5 p-1.5">
            {REACTION_KEYS.map((kind) => (
              <button
                key={kind}
                onClick={() => {
                  onReact(kind === current ? null : kind);
                  setOpen(false);
                }}
                title={REACTIONS[kind].label}
                aria-label={REACTIONS[kind].label}
                className={clsx(
                  "grid size-10 place-items-center rounded-xl text-xl transition-transform hover:-translate-y-0.5 hover:scale-110 hover:bg-surface-2",
                  kind === current && "bg-accent-soft",
                )}
              >
                {REACTIONS[kind].emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditPostDialog({ post, onClose }: { post: Post; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState(post.body);
  const [mood, setMood] = useState<Mood | null>(post.mood);
  const [warning, setWarning] = useState(post.contentWarning ?? "");

  const save = useMutation({
    mutationFn: () => api<{ post: Post }>(`/posts/${post.id}`, { method: "PATCH", body: { body, mood, contentWarning: warning } }),
    onSuccess: (data) => {
      updatePostEverywhere(queryClient, data.post);
      toast("Post updated");
      onClose();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open onClose={onClose} title="Edit post">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} maxLength={3000} className="field resize-y leading-relaxed" autoFocus />
        <div className="flex flex-wrap gap-1.5">
          {MOOD_KEYS.map((m) => (
            <MoodChip key={m} mood={m} active={mood === m} onClick={() => setMood(mood === m ? null : m)} />
          ))}
        </div>
        <div>
          <label className="label" htmlFor="edit-cw">
            Content note <span className="font-normal text-muted">(optional)</span>
          </label>
          <input id="edit-cw" value={warning} onChange={(e) => setWarning(e.target.value)} maxLength={80} className="field" placeholder="e.g. grief, anxiety" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending} disabled={!body.trim() && !post.imageUrl}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
