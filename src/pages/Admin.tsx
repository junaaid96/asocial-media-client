import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { format, parseISO } from "date-fns";
import { EyeOff, Flag, MessageCircle, Search, ShieldCheck, UserX, Users } from "lucide-react";
import { type ReactNode, useEffect, useId, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { toast } from "sonner";
import { PageHeader } from "../components/AppShell";
import { REPORT_REASONS } from "../components/ReportDialog";
import { VISIBILITY } from "../components/VisibilityPicker";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { EmptyState } from "../components/ui/misc";
import { PageSpinner, Spinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { fullDate, timeAgo } from "../lib/format";
import type { PublicUser, ReportReason, ReportTarget, Visibility } from "../lib/types";

type Tab = "overview" | "reports" | "users" | "posts";
const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "reports", label: "Reports" },
  { key: "users", label: "People" },
  { key: "posts", label: "Posts" },
];

interface Stats {
  totals: Record<
    | "users"
    | "users_7d"
    | "suspended"
    | "admins"
    | "posts"
    | "posts_7d"
    | "hidden_posts"
    | "comments"
    | "messages"
    | "messages_7d"
    | "open_reports"
    | "reports"
    | "active_today"
    | "active_7d",
    number
  >;
  series: { day: string; signups: number; posts: number; messages: number; active: number }[];
}

interface AdminReport {
  id: string;
  targetType: ReportTarget["targetType"];
  reason: ReportReason;
  details: string;
  excerpt: string | null;
  status: "open" | "resolved" | "dismissed";
  action: "none" | "hide_post" | "suspend_user" | null;
  resolutionNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  reporter: PublicUser | null;
  target: {
    userId: string | null;
    user: PublicUser | null;
    userSuspended: boolean;
    postId: string | null;
    postHidden: boolean | null;
    messageId: string | null;
    reportsOnTarget: number;
  };
}

interface AdminUser extends PublicUser {
  id: string;
  email: string;
  role: "user" | "admin";
  joinedAt: string;
  suspendedAt: string | null;
  suspendedReason: string | null;
  lastSeenAt: string | null;
  posts: number;
  reportsAgainst: number;
}

interface AdminPost {
  id: string;
  excerpt: string;
  visibility: Visibility;
  isAnonymous: boolean;
  createdAt: string;
  hiddenAt: string | null;
  hiddenReason: string | null;
  author: PublicUser & { id: string };
  openReports: number;
}

export function Admin() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.key === params.get("tab"))?.key ?? "overview") as Tab;
  const id = useId();
  const stats = useQuery({ queryKey: ["admin", "stats"], queryFn: () => api<Stats>("/admin/stats"), refetchInterval: 60_000 });

  return (
    <div>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-7 text-accent" aria-hidden /> Moderation
          </span>
        }
        subtitle="Keep aSocial gentle. Every action here is visible only to moderators."
      />
      <div role="tablist" aria-label="Moderation sections" className="mb-5 flex gap-1 overflow-x-auto rounded-full bg-surface-2 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`${id}-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`${id}-panel`}
            onClick={() => setParams(t.key === "overview" ? {} : { tab: t.key }, { replace: true })}
            className={clsx(
              "flex-1 rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
              tab === t.key ? "bg-surface font-semibold text-ink shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            {t.label}
            {t.key === "reports" && stats.data?.totals.open_reports ? (
              <span className="ml-1.5 rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white">{stats.data.totals.open_reports}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${tab}`}>
        {tab === "overview" ? <Overview stats={stats.data} /> : null}
        {tab === "reports" ? <Reports /> : null}
        {tab === "users" ? <UsersPanel /> : null}
        {tab === "posts" ? <PostsPanel /> : null}
      </div>
    </div>
  );
}

// --- Overview ------------------------------------------------------------------

const SERIES = [
  { key: "active", label: "Active people" },
  { key: "posts", label: "Posts" },
  { key: "messages", label: "Messages" },
  { key: "signups", label: "Sign-ups" },
] as const;

function Overview({ stats }: { stats: Stats | undefined }) {
  const [metric, setMetric] = useState<(typeof SERIES)[number]["key"]>("active");
  if (!stats) return <PageSpinner />;
  const t = stats.totals;
  const cards: { label: string; value: number; hint?: string; icon: ReactNode; tab?: Tab }[] = [
    { label: "People", value: t.users, hint: `+${t.users_7d} this week`, icon: <Users className="size-4" /> },
    { label: "Active today", value: t.active_today, hint: `${t.active_7d} this week`, icon: <span aria-hidden>🌿</span> },
    { label: "Posts", value: t.posts, hint: `+${t.posts_7d} this week`, icon: <span aria-hidden>✍️</span> },
    { label: "Messages", value: t.messages, hint: `+${t.messages_7d} this week`, icon: <MessageCircle className="size-4" /> },
    { label: "Open reports", value: t.open_reports, hint: `${t.reports} all time`, icon: <Flag className="size-4" />, tab: "reports" },
    { label: "Hidden posts", value: t.hidden_posts, icon: <EyeOff className="size-4" />, tab: "posts" },
    { label: "Suspended", value: t.suspended, icon: <UserX className="size-4" />, tab: "users" },
    { label: "Moderators", value: t.admins, icon: <ShieldCheck className="size-4" /> },
  ];
  const max = Math.max(1, ...stats.series.map((d) => d[metric]));
  const label = SERIES.find((s) => s.key === metric)!.label;

  return (
    <div className="space-y-5">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((card) => (
          <li key={card.label} className="card p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
              {card.icon} {card.label}
            </p>
            <p className={clsx("mt-1 font-serif text-3xl font-semibold tabular-nums", card.label === "Open reports" && card.value > 0 && "text-clay")}>
              {card.value.toLocaleString()}
            </p>
            {card.hint ? <p className="text-xs text-muted">{card.hint}</p> : null}
          </li>
        ))}
      </ul>
      <section className="card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold">Last 14 days</h2>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Metric">
            {SERIES.map((s) => (
              <button
                key={s.key}
                role="radio"
                aria-checked={metric === s.key}
                onClick={() => setMetric(s.key)}
                className={clsx("rounded-full px-2.5 py-1 text-xs", metric === s.key ? "bg-accent-soft font-medium text-accent-strong" : "text-muted hover:bg-surface-2")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex h-40 items-end gap-1.5" aria-hidden>
          {stats.series.map((d) => (
            <div key={d.day} className="group flex h-full flex-1 flex-col justify-end" title={`${format(parseISO(d.day), "MMM d")}: ${d[metric]}`}>
              <div
                className="min-h-[3px] rounded-t-md bg-accent/70 transition-all group-hover:bg-accent"
                style={{ height: `${(d[metric] / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted" aria-hidden>
          <span>{format(parseISO(stats.series[0]!.day), "MMM d")}</span>
          <span>Today</span>
        </div>
        <table className="sr-only">
          <caption>{label} per day, last 14 days</caption>
          <tbody>
            {stats.series.map((d) => (
              <tr key={d.day}>
                <th scope="row">{d.day}</th>
                <td>{d[metric]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

// --- Reports -------------------------------------------------------------------

const REPORT_STATUSES = ["open", "resolved", "dismissed", "all"] as const;

function Reports() {
  const [status, setStatus] = useState<(typeof REPORT_STATUSES)[number]>("open");
  const reports = useQuery({
    queryKey: ["admin", "reports", status],
    queryFn: () => api<{ items: AdminReport[] }>("/admin/reports", { query: { status } }).then((r) => r.items),
  });
  return (
    <div className="space-y-4">
      <FilterPills value={status} options={REPORT_STATUSES} onChange={setStatus} label="Report status" />
      {reports.isPending ? (
        <PageSpinner />
      ) : reports.data?.length ? (
        <ul className="space-y-3">
          {reports.data.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </ul>
      ) : (
        <div className="card">
          <EmptyState icon="🕊️" title={status === "open" ? "No open reports" : "Nothing here"}>
            {status === "open" ? "All quiet. Thank you for keeping watch." : "No reports with this status yet."}
          </EmptyState>
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: AdminReport }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const act = useMutation({
    mutationFn: (action: "dismiss" | "none" | "hide_post" | "suspend_user") =>
      action === "dismiss"
        ? api(`/admin/reports/${report.id}/dismiss`, { method: "POST", body: { note } })
        : api(`/admin/reports/${report.id}/resolve`, { method: "POST", body: { action, note } }),
    onSuccess: (_d, action) => {
      toast(
        action === "dismiss" ? "Report dismissed" : action === "hide_post" ? "Post hidden and report resolved" : action === "suspend_user" ? "Account suspended and report resolved" : "Report resolved",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const t = report.target;
  const open = report.status === "open";

  return (
    <li className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start gap-2">
        <span className="rounded-full bg-clay-soft px-2.5 py-0.5 text-xs font-semibold text-clay">{REPORT_REASONS[report.reason]?.label ?? report.reason}</span>
        <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-ink-soft capitalize">{report.targetType}</span>
        {t.reportsOnTarget > 1 ? <span className="text-xs text-muted">{t.reportsOnTarget} reports about this account</span> : null}
        <span className="ml-auto text-xs text-muted" title={fullDate(report.createdAt)}>
          {timeAgo(report.createdAt)}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {t.user ? (
          <Link to={`/u/${t.user.username}`} className="inline-flex items-center gap-2 font-medium hover:underline">
            <Avatar user={t.user} size="xs" /> {t.user.displayName} <span className="text-muted">@{t.user.username}</span>
          </Link>
        ) : (
          <span className="text-muted">Account deleted</span>
        )}
        {t.userSuspended ? <Badge tone="clay">suspended</Badge> : null}
        {t.postHidden ? <Badge tone="clay">post hidden</Badge> : null}
      </div>
      {report.excerpt ? (
        <blockquote className="mt-3 rounded-xl border-l-4 border-line bg-surface-2/70 px-3 py-2 text-sm whitespace-pre-wrap text-ink-soft">
          {report.excerpt}
        </blockquote>
      ) : null}
      {report.details ? (
        <p className="mt-2 text-sm">
          <span className="font-medium">Reporter's note:</span> {report.details}
        </p>
      ) : null}
      <p className="mt-2 text-xs text-muted">
        Reported by {report.reporter ? `@${report.reporter.username}` : "a deleted account"}
        {t.postId ? (
          <>
            {" · "}
            <Link to={`/post/${t.postId}`} className="text-accent hover:underline">
              Open post
            </Link>
          </>
        ) : null}
      </p>

      {open ? (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <label className="sr-only" htmlFor={`note-${report.id}`}>
            Moderator note
          </label>
          <input
            id={`note-${report.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
            className="field py-2 text-sm"
            placeholder="Moderator note (optional, private)"
          />
          <div className="flex flex-wrap gap-2">
            {t.postId && !t.postHidden ? (
              <Button size="sm" variant="danger" loading={act.isPending && act.variables === "hide_post"} onClick={() => act.mutate("hide_post")}>
                <EyeOff className="size-4" /> Hide post
              </Button>
            ) : null}
            {t.userId && !t.userSuspended ? (
              <Button
                size="sm"
                variant="danger"
                loading={act.isPending && act.variables === "suspend_user"}
                onClick={() => confirm(`Suspend @${t.user?.username}? They won't be able to sign in or post.`) && act.mutate("suspend_user")}
              >
                <UserX className="size-4" /> Suspend account
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" loading={act.isPending && act.variables === "none"} onClick={() => act.mutate("none")}>
              Resolve, no action
            </Button>
            <Button size="sm" variant="ghost" loading={act.isPending && act.variables === "dismiss"} onClick={() => act.mutate("dismiss")}>
              Dismiss
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
          <span className="font-medium text-ink-soft capitalize">{report.status}</span>
          {report.action && report.action !== "none" ? ` · ${report.action === "hide_post" ? "post hidden" : "account suspended"}` : ""}
          {report.resolvedBy ? ` by @${report.resolvedBy}` : ""}
          {report.resolvedAt ? ` · ${timeAgo(report.resolvedAt)}` : ""}
          {report.resolutionNote ? ` · “${report.resolutionNote}”` : ""}
        </p>
      )}
    </li>
  );
}

// --- People --------------------------------------------------------------------

function useDebounced(value: string, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

const USER_STATUSES = ["all", "suspended", "admins"] as const;

function UsersPanel() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const q = useDebounced(text.trim());
  const [status, setStatus] = useState<(typeof USER_STATUSES)[number]>("all");
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const users = useInfiniteQuery({
    queryKey: ["admin", "users", q, status],
    queryFn: ({ pageParam }) => api<{ items: AdminUser[]; nextCursor: string | null }>("/admin/users", { query: { q, status, cursor: pageParam ?? undefined } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const unsuspend = useMutation({
    mutationFn: (user: AdminUser) => api(`/admin/users/${user.id}/unsuspend`, { method: "POST" }),
    onSuccess: () => {
      toast("Account restored");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const items = users.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <SearchField value={text} onChange={setText} label="Search people by name, username or email" />
      <FilterPills value={status} options={USER_STATUSES} onChange={setStatus} label="Filter people" />
      {users.isPending ? (
        <PageSpinner />
      ) : items.length ? (
        <ul className="card divide-y divide-line">
          {items.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center gap-3 p-4">
              <Link to={`/u/${user.username}`}>
                <Avatar user={user} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-1.5">
                  <Link to={`/u/${user.username}`} className="font-semibold hover:underline">
                    {user.displayName}
                  </Link>
                  <span className="text-sm text-muted">@{user.username}</span>
                  {user.role === "admin" ? <Badge tone="accent">moderator</Badge> : null}
                  {user.suspendedAt ? <Badge tone="clay">suspended</Badge> : null}
                </p>
                <p className="truncate text-xs text-muted">
                  {user.email} · joined {timeAgo(user.joinedAt)} · {user.posts} posts
                  {user.reportsAgainst ? ` · ${user.reportsAgainst} reports` : ""}
                </p>
                {user.suspendedReason ? <p className="mt-0.5 text-xs text-clay">Reason: {user.suspendedReason}</p> : null}
              </div>
              {user.role !== "admin" ? (
                user.suspendedAt ? (
                  <Button size="sm" variant="secondary" loading={unsuspend.isPending && unsuspend.variables?.id === user.id} onClick={() => unsuspend.mutate(user)}>
                    Restore
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => setSuspending(user)}>
                    Suspend
                  </Button>
                )
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="card">
          <EmptyState icon="🔍" title="No one found" />
        </div>
      )}
      <LoadMore query={users} />
      <ReasonDialog
        title={suspending ? `Suspend @${suspending.username}` : ""}
        description="They won't be able to sign in, post or message, and their profile and posts are hidden until restored."
        confirmLabel="Suspend account"
        target={suspending}
        endpoint={(u) => `/admin/users/${u.id}/suspend`}
        onDone={() => {
          toast("Account suspended");
          setSuspending(null);
          void queryClient.invalidateQueries({ queryKey: ["admin"] });
        }}
        onClose={() => setSuspending(null)}
      />
    </div>
  );
}

// --- Posts ---------------------------------------------------------------------

const POST_STATUSES = ["all", "reported", "hidden"] as const;

function PostsPanel() {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const q = useDebounced(text.trim());
  const [status, setStatus] = useState<(typeof POST_STATUSES)[number]>("all");
  const [hiding, setHiding] = useState<AdminPost | null>(null);
  const posts = useInfiniteQuery({
    queryKey: ["admin", "posts", q, status],
    queryFn: ({ pageParam }) => api<{ items: AdminPost[]; nextCursor: string | null }>("/admin/posts", { query: { q, status, cursor: pageParam ?? undefined } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });
  const unhide = useMutation({
    mutationFn: (post: AdminPost) => api(`/admin/posts/${post.id}/unhide`, { method: "POST" }),
    onSuccess: () => {
      toast("Post visible again");
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const items = posts.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <SearchField value={text} onChange={setText} label="Search posts by words or @username" />
      <FilterPills value={status} options={POST_STATUSES} onChange={setStatus} label="Filter posts" />
      {posts.isPending ? (
        <PageSpinner />
      ) : items.length ? (
        <ul className="space-y-3">
          {items.map((post) => (
            <li key={post.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Avatar user={post.author} size="xs" />
                <Link to={`/u/${post.author.username}`} className="font-medium hover:underline">
                  @{post.author.username}
                </Link>
                {post.isAnonymous ? <Badge>posted anonymously</Badge> : null}
                <Badge>{VISIBILITY[post.visibility].label}</Badge>
                {post.openReports ? <Badge tone="clay">{post.openReports} open reports</Badge> : null}
                {post.hiddenAt ? <Badge tone="clay">hidden</Badge> : null}
                <span className="ml-auto text-xs text-muted">{timeAgo(post.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm whitespace-pre-wrap text-ink-soft">{post.excerpt || <em className="text-muted">Photo only</em>}</p>
              {post.hiddenReason ? <p className="mt-1 text-xs text-clay">Hidden: {post.hiddenReason}</p> : null}
              <div className="mt-3 flex gap-2">
                <Link to={`/post/${post.id}`}>
                  <Button size="sm" variant="ghost">
                    Open
                  </Button>
                </Link>
                {post.hiddenAt ? (
                  <Button size="sm" variant="secondary" loading={unhide.isPending && unhide.variables?.id === post.id} onClick={() => unhide.mutate(post)}>
                    Unhide
                  </Button>
                ) : (
                  <Button size="sm" variant="danger" onClick={() => setHiding(post)}>
                    <EyeOff className="size-4" /> Hide
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card">
          <EmptyState icon="🔍" title="No posts found" />
        </div>
      )}
      <LoadMore query={posts} />
      <ReasonDialog
        title="Hide this post"
        description="Only the author will still see it, with a note that moderators hid it."
        confirmLabel="Hide post"
        target={hiding}
        endpoint={(p) => `/admin/posts/${p.id}/hide`}
        onDone={() => {
          toast("Post hidden");
          setHiding(null);
          void queryClient.invalidateQueries({ queryKey: ["admin"] });
          void queryClient.invalidateQueries({ queryKey: ["posts"] });
        }}
        onClose={() => setHiding(null)}
      />
    </div>
  );
}

// --- Bits ----------------------------------------------------------------------

function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "clay" | "accent" }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2 py-px text-[11px] font-medium",
        tone === "clay" && "bg-clay-soft text-clay",
        tone === "accent" && "bg-accent-soft text-accent-strong",
        tone === "muted" && "bg-surface-2 text-ink-soft",
      )}
    >
      {children}
    </span>
  );
}

function FilterPills<T extends string>({ value, options, onChange, label }: { value: T; options: readonly T[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={clsx(
            "rounded-full px-3 py-1 text-sm capitalize transition-colors",
            value === option ? "bg-accent-soft font-medium text-accent-strong ring-1 ring-accent/40" : "bg-surface text-ink-soft ring-1 ring-line hover:bg-surface-2",
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function SearchField({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={label} aria-label={label} className="field rounded-full pl-10" />
    </div>
  );
}

function LoadMore({ query }: { query: { hasNextPage: boolean; isFetchingNextPage: boolean; fetchNextPage: () => unknown } }) {
  if (!query.hasNextPage) return null;
  return (
    <div className="flex justify-center">
      <Button variant="secondary" size="sm" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
        {query.isFetchingNextPage ? <Spinner className="size-4" /> : null} Load more
      </Button>
    </div>
  );
}

function ReasonDialog<T>({
  title,
  description,
  confirmLabel,
  target,
  endpoint,
  onDone,
  onClose,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  target: T | null;
  endpoint: (t: T) => string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const submit = useMutation({
    mutationFn: () => api(endpoint(target!), { method: "POST", body: { reason } }),
    onSuccess: () => {
      setReason("");
      onDone();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <Dialog open={!!target} onClose={onClose} title={title || "Confirm"}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <p className="text-sm text-muted">{description}</p>
        <div>
          <label className="label" htmlFor="moderation-reason">
            Reason <span className="font-normal text-muted">(kept on record for moderators)</span>
          </label>
          <input id="moderation-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className="field" placeholder="e.g. Repeated harassment" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submit.isPending}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
