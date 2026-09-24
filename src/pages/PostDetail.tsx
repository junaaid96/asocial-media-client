import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { PostCard } from "../components/PostCard";
import { EmptyState } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { keys } from "../lib/queries";
import type { Post } from "../lib/types";

export function PostDetail() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const post = useQuery({ queryKey: keys.post(id), queryFn: () => api<{ post: Post }>(`/posts/${id}`) });

  return (
    <div>
      <button onClick={() => (history.length > 1 ? navigate(-1) : navigate("/"))} className="mb-4 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Back
      </button>
      {post.isPending ? (
        <PageSpinner />
      ) : post.isError ? (
        <div className="card">
          <EmptyState icon="🍂" title="This post has drifted away">
            {errorMessage(post.error)}
          </EmptyState>
        </div>
      ) : (
        <PostCard post={post.data.post} expandComments />
      )}
    </div>
  );
}
