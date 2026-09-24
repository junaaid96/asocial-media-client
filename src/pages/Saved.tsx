import { PageHeader } from "../components/AppShell";
import { FeedList, defaultEmpty } from "../components/FeedList";
import { useBookmarks } from "../lib/queries";

export function Saved() {
  const query = useBookmarks();
  return (
    <div>
      <PageHeader title="Saved" subtitle="Posts you kept for a quieter moment. Only you can see this list." />
      <FeedList query={query} empty={defaultEmpty("Nothing saved yet", "Tap the bookmark on any post to keep it here for later.", "🔖")} />
    </div>
  );
}
