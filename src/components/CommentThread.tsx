import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Send, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { fullDate, timeAgo } from "../lib/format";
import { keys, patchPostEverywhere } from "../lib/queries";
import type { Comment, Post } from "../lib/types";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";

export function CommentThread({ post }: { post: Post }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const comments = useQuery({
    queryKey: keys.comments(post.id),
    queryFn: () => api<{ items: Comment[] }>(`/posts/${post.id}/comments`).then((r) => r.items),
  });

  const setCount = (delta: number) => patchPostEverywhere(queryClient, post.id, { commentCount: Math.max(0, post.commentCount + delta) });

  const add = useMutation({
    mutationFn: () => api<{ comment: Comment }>(`/posts/${post.id}/comments`, { method: "POST", body: { body: draft } }),
    onSuccess: ({ comment }) => {
      queryClient.setQueryData<Comment[]>(keys.comments(post.id), (old = []) => [...old, comment]);
      setCount(1);
      setDraft("");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <section className="border-t border-line bg-surface-2/40 px-4 py-4 sm:px-5" aria-label="Replies">
      {comments.isPending ? (
        <div className="flex justify-center py-3 text-muted">
          <Spinner className="size-4" />
        </div>
      ) : comments.data?.length ? (
        <ul className="space-y-3.5">
          {comments.data.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={post.id} onDeleted={() => setCount(-1)} />
          ))}
        </ul>
      ) : (
        <p className="py-1 text-sm text-muted">No replies yet. Be the first gentle voice.</p>
      )}

      {me ? (
        <form
          className="mt-4 flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draft.trim()) add.mutate();
          }}
        >
          <Avatar user={me} size="sm" />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && draft.trim()) add.mutate();
            }}
            rows={1}
            maxLength={1000}
            placeholder="Write a kind reply…"
            aria-label="Write a reply"
            className="field min-h-10 flex-1 resize-none py-2 [field-sizing:content]"
          />
          <Button type="submit" size="icon" loading={add.isPending} disabled={!draft.trim()} aria-label="Send reply">
            {!add.isPending ? <Send className="size-4" /> : null}
          </Button>
        </form>
      ) : (
        <p className="mt-3 text-sm text-muted">
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>{" "}
          to reply.
        </p>
      )}
    </section>
  );
}

function CommentItem({ comment, postId, onDeleted }: { comment: Comment; postId: string; onDeleted: () => void }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(comment.body);

  const update = useMutation({
    mutationFn: () => api<{ comment: Comment }>(`/comments/${comment.id}`, { method: "PATCH", body: { body: text } }),
    onSuccess: (data) => {
      queryClient.setQueryData<Comment[]>(keys.comments(postId), (old = []) => old.map((c) => (c.id === comment.id ? data.comment : c)));
      setEditing(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => api(`/comments/${comment.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.setQueryData<Comment[]>(keys.comments(postId), (old = []) => old.filter((c) => c.id !== comment.id));
      onDeleted();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <li className="group flex gap-2.5">
      {comment.author ? (
        <Link to={`/u/${comment.author.username}`}>
          <Avatar user={comment.author} size="sm" />
        </Link>
      ) : (
        <Avatar user={null} size="sm" />
      )}
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-surface px-3.5 py-2.5 ring-1 ring-line">
          <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
            {comment.author ? (
              <Link to={`/u/${comment.author.username}`} className="font-semibold hover:underline">
                {comment.author.displayName}
              </Link>
            ) : (
              <span className="font-semibold">A quiet soul</span>
            )}
            {comment.isOriginalPoster ? (
              <span className="rounded-full bg-accent-soft px-1.5 py-px text-[11px] font-medium text-accent-strong">author</span>
            ) : null}
            <span className="text-xs text-muted" title={fullDate(comment.createdAt)}>
              {timeAgo(comment.createdAt)}
              {comment.editedAt ? " · edited" : ""}
            </span>
          </div>
          {editing ? (
            <form
              className="mt-2 space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate();
              }}
            >
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} maxLength={1000} className="field text-sm" autoFocus />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => (setEditing(false), setText(comment.body))}>
                  Cancel
                </Button>
                <Button size="sm" type="submit" loading={update.isPending} disabled={!text.trim()}>
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <p className="mt-0.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap">{comment.body}</p>
          )}
        </div>
        {comment.isMine && !editing ? (
          <div className="mt-1 flex gap-3 pl-2 text-xs text-muted opacity-100 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 hover:text-ink">
              <Pencil className="size-3" /> Edit
            </button>
            <button
              onClick={() => confirm("Delete this reply?") && remove.mutate()}
              className="inline-flex items-center gap-1 hover:text-clay"
            >
              <Trash2 className="size-3" /> Delete
            </button>
          </div>
        ) : null}
      </div>
    </li>
  );
}
