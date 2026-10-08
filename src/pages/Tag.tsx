import { Hash } from "lucide-react";
import { useParams } from "react-router";
import { PageHeader } from "../components/AppShell";
import { FeedList, defaultEmpty } from "../components/FeedList";
import { useTagPosts } from "../lib/queries";

export function Tag() {
  const tag = (useParams().tag ?? "").toLowerCase();
  const query = useTagPosts(tag);
  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-1">
            <Hash className="size-7 text-accent" aria-hidden />
            <span className="sr-only">Hashtag </span>
            {tag}
          </span>
        }
        subtitle="Posts you can see that carry this tag, newest first."
      />
      <FeedList query={query} empty={defaultEmpty(`Nothing tagged #${tag} yet`, "Add the tag to a post and it'll show up here.", "🏷️")} />
    </div>
  );
}
