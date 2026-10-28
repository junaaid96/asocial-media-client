import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { BadgeCheck, Camera, Heart, Hourglass, Monitor, Moon, ShieldCheck, Sun, Timer } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { PageHeader } from "../components/AppShell";
import { useSetBattery } from "../components/BatteryPicker";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { Avatar } from "../components/ui/Avatar";
import { Button } from "../components/ui/Button";
import { Dialog } from "../components/ui/Dialog";
import { BatteryIcon } from "../components/ui/misc";
import { PageSpinner } from "../components/ui/Spinner";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { timeAgo } from "../lib/format";
import { uploadImage } from "../lib/image";
import { BATTERY, BATTERY_KEYS, RELATIONSHIPS, RELATIONSHIP_KEYS, relationshipLabel } from "../lib/meta";
import { useRelationship, useVerification } from "../lib/queries";
import { type ThemeChoice, useTheme } from "../lib/theme";
import type { LettersFrom, Me, PublicUser, RelationshipDetail, RelationshipLabel } from "../lib/types";
import { type UsageDay, formatDuration, localDay, usageKey, useUsage } from "../lib/usage";

function Section({ title, description, children, id }: { title: string; description?: string; children: ReactNode; id?: string }) {
  return (
    <section className="card scroll-mt-20 p-5 sm:p-6" id={id}>
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Me> & { avatarKey?: string | null }) => api<{ user: Me }>("/me", { method: "PATCH", body: patch }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(["me"], user);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function Settings() {
  const { me } = useAuth();
  const usage = useUsage();
  const { hash } = useLocation();
  // Links like /settings#time (from the session timer) land on that section.
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(hash.slice(1));
    el?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [hash, usage.available]);
  if (!me) return null;
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Make aSocial feel like your own quiet room." />
      <ProfileForm me={me} />
      <VerificationSettings me={me} />
      <RelationshipSettings />
      <PresenceSettings me={me} />
      {usage.available ? <TimeSettings me={me} /> : null}
      <AppearanceSettings />
      <Section title="Account" description={`Signed in as ${me.email}. Sign out with the button next to your name (on phones, the icon at the top right).`}>
        <div className="flex flex-wrap gap-2">
          {me.role === "admin" ? (
            <Link to="/admin">
              <Button variant="secondary">
                <ShieldCheck className="size-4" /> Moderation
              </Button>
            </Link>
          ) : null}
          <DeleteAccount />
        </div>
      </Section>
    </div>
  );
}

function ProfileForm({ me }: { me: Me }) {
  const update = useUpdateMe();
  const fileInput = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    displayName: me.displayName,
    username: me.username,
    bio: me.bio,
    institute: me.institute,
    location: me.location,
  });
  const [uploading, setUploading] = useState(false);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const dirty = (Object.keys(form) as (keyof typeof form)[]).some((key) => form[key] !== me[key]);

  const changeAvatar = async (file: File) => {
    setUploading(true);
    try {
      const { key } = await uploadImage(file, "avatar");
      await update.mutateAsync({ avatarKey: key });
      toast.success("New photo saved");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Section title="Profile">
      <div className="mb-6 flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          className="group relative rounded-full"
          aria-label="Change profile photo"
          disabled={uploading}
        >
          <Avatar user={me} size="lg" />
          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera className="size-5" />
          </span>
        </button>
        <div>
          <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()} loading={uploading}>
            {uploading ? "Uploading…" : "Change photo"}
          </Button>
          {me.avatarUrl ? (
            <button className="ml-3 text-sm text-muted hover:text-clay" onClick={() => update.mutate({ avatarKey: null })}>
              Remove
            </button>
          ) : null}
          <p className="mt-1.5 text-xs text-muted">Square crop, resized in your browser. Location data is stripped.</p>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) changeAvatar(file);
          }}
        />
      </div>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          update.mutate(form, { onSuccess: () => toast.success("Profile saved") });
        }}
      >
        <div>
          <label className="label" htmlFor="displayName">
            Display name
          </label>
          <input id="displayName" className="field" value={form.displayName} onChange={set("displayName")} maxLength={50} required />
        </div>
        <div>
          <label className="label" htmlFor="username">
            Username
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">@</span>
            <input
              id="username"
              className="field pl-8"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "") }))}
              minLength={3}
              maxLength={24}
              required
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="bio">
            Bio <span className="font-normal text-muted">({form.bio.length}/280)</span>
          </label>
          <textarea id="bio" className="field resize-y" rows={3} value={form.bio} onChange={set("bio")} maxLength={280} placeholder="A few words about you, if you'd like." />
        </div>
        <div>
          <label className="label" htmlFor="institute">
            School or work
          </label>
          <input id="institute" className="field" value={form.institute} onChange={set("institute")} maxLength={80} />
        </div>
        <div>
          <label className="label" htmlFor="location">
            Location
          </label>
          <input id="location" className="field" value={form.location} onChange={set("location")} maxLength={80} />
        </div>
        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" disabled={!dirty} loading={update.isPending && dirty}>
            Save profile
          </Button>
        </div>
      </form>
    </Section>
  );
}

function VerificationSettings({ me }: { me: Me }) {
  const queryClient = useQueryClient();
  const state = useVerification();
  const [note, setNote] = useState("");
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["verification", "me"] });
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };
  const request = useMutation({
    mutationFn: () => api("/me/verification", { method: "POST", body: { note } }),
    onSuccess: () => {
      setNote("");
      refresh();
      toast("Request sent. Moderators review by hand, so it may take a little while.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const cancel = useMutation({
    mutationFn: () => api("/me/verification", { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast("Request withdrawn");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Section
      id="verification"
      title="Verification"
      description="A small badge next to your name that tells people you're really you. Only moderators can grant it."
    >
      {me.role === "admin" ? (
        <p className="flex items-center gap-2 rounded-xl bg-accent-soft/60 px-3 py-2.5 text-sm text-ink-soft">
          <BadgeCheck className="size-4 shrink-0 text-accent" aria-hidden />
          You're a moderator, so you're verified automatically.
        </p>
      ) : state.isPending ? (
        <PageSpinner />
      ) : state.data?.verified ? (
        <div className="flex items-start gap-3 rounded-xl bg-accent-soft/60 px-3 py-2.5 text-sm">
          <VerifiedBadge user={state.data} size="md" className="mt-0.5" />
          <div>
            <p className="font-medium">
              You're verified{state.data.verifiedLabel ? ` · ${state.data.verifiedLabel}` : ""}
            </p>
            <p className="mt-0.5 text-muted">The badge appears next to your name everywhere on aSocial. It stays unless moderators remove it.</p>
          </div>
        </div>
      ) : state.data?.pending ? (
        <div className="space-y-3">
          <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-ink-soft">
            Request sent {timeAgo(state.data.pending.createdAt)}. We'll notify you as soon as moderators decide — nothing to do meanwhile.
          </p>
          <Button size="sm" variant="ghost" loading={cancel.isPending} onClick={() => cancel.mutate()}>
            Withdraw request
          </Button>
        </div>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            request.mutate();
          }}
        >
          {state.data?.lastDecision?.status === "rejected" ? (
            <p className="rounded-xl bg-surface-2 px-3 py-2.5 text-sm text-ink-soft">
              Your last request wasn't approved. You're welcome to try again — a little context about who you are helps a lot.
            </p>
          ) : null}
          <div>
            <label className="label" htmlFor="verify-note">
              Who are you? <span className="font-normal text-muted">(optional, only moderators see this)</span>
            </label>
            <textarea
              id="verify-note"
              className="field resize-y"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. I write under this name elsewhere, here's my website…"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" loading={request.isPending}>
              Request verification
            </Button>
          </div>
        </form>
      )}
    </Section>
  );
}

function RelationshipSettings() {
  const queryClient = useQueryClient();
  const state = useRelationship();
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["relationship", "me"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    queryClient.invalidateQueries({ queryKey: ["summary"] });
  };
  const solo = useMutation({
    mutationFn: (label: "single" | null) => api("/me/relationship/solo", { method: "PUT", body: { label } }),
    onSuccess: (_d, label) => {
      refresh();
      toast(label ? "Profile updated" : "Relationship status hidden");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const confirmReq = useMutation({
    mutationFn: (id: string) => api(`/me/relationship/${id}/confirm`, { method: "POST" }),
    onSuccess: () => {
      refresh();
      toast("It now shows on both profiles");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const decline = useMutation({
    mutationFn: (id: string) => api(`/me/relationship/${id}/decline`, { method: "POST" }),
    onSuccess: () => {
      refresh();
      toast("Request declined — nothing is shown");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: () => api("/me/relationship", { method: "DELETE" }),
    onSuccess: () => {
      refresh();
      toast("Removed from both profiles");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const data = state.data;
  const busy = data?.confirmed ?? data?.outgoing;

  return (
    <Section
      id="relationship"
      title="Relationship status"
      description="Solo statuses show right away. Partnered ones only appear once you both confirm — either of you can remove them at any time."
    >
      {state.isPending || !data ? (
        <PageSpinner />
      ) : (
        <div className="space-y-5">
          {data.incoming.length ? (
            <div className="space-y-2">
              <p className="label">Waiting for your answer</p>
              <ul className="space-y-2">
                {data.incoming.map((req) => (
                  <IncomingRequest
                    key={req.id}
                    req={req}
                    confirming={confirmReq.isPending && confirmReq.variables === req.id}
                    declining={decline.isPending && decline.variables === req.id}
                    onConfirm={() => confirmReq.mutate(req.id)}
                    onDecline={() => decline.mutate(req.id)}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {data.confirmed ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
              <Avatar user={data.confirmed.other} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-1.5 text-[15px]">
                  <Heart className="size-4 text-clay" aria-hidden />
                  <span>
                    {relationshipLabel(data.confirmed.label)} with{" "}
                    <Link to={`/u/${data.confirmed.other.username}`} className="font-medium text-accent hover:underline">
                      @{data.confirmed.other.username}
                    </Link>
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-muted">Showing on both profiles.</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                loading={remove.isPending}
                onClick={() => window.confirm("Remove this from both profiles? The other person will be told.") && remove.mutate()}
              >
                Remove
              </Button>
            </div>
          ) : data.outgoing ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line p-4">
              <Avatar user={data.outgoing.other} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px]">
                  {relationshipLabel(data.outgoing.label)} with{" "}
                  <span className="font-medium">@{data.outgoing.other.username}</span> — waiting for them to confirm.
                </p>
                <p className="mt-0.5 text-sm text-muted">Nothing shows on either profile until you both agree.</p>
              </div>
              <Button size="sm" variant="ghost" loading={remove.isPending} onClick={() => remove.mutate()}>
                Withdraw
              </Button>
            </div>
          ) : (
            <NewRelationshipRequest
              onSent={() => {
                refresh();
                toast("Request sent. They can confirm or decline.");
              }}
            />
          )}

          <div>
            <p className="label">Or show a solo status</p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Solo relationship status">
              {(
                [
                  { value: null, label: "Not shown" },
                  { value: "single", label: "Single" },
                ] as const
              ).map((option) => (
                <button
                  key={option.label}
                  role="radio"
                  aria-checked={data.solo === option.value}
                  disabled={!!busy || !!data.incoming.length || solo.isPending}
                  onClick={() => data.solo !== option.value && solo.mutate(option.value)}
                  className={clsx(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    data.solo === option.value
                      ? "border-accent bg-accent-soft text-accent-strong"
                      : "border-line hover:bg-surface-2 disabled:opacity-50",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {busy || data.incoming.length ? (
              <p className="mt-2 text-xs text-muted">Available once your current request is settled.</p>
            ) : (
              <p className="mt-2 text-xs text-muted">Solo statuses appear on your profile immediately.</p>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}

function IncomingRequest({
  req,
  confirming,
  declining,
  onConfirm,
  onDecline,
}: {
  req: RelationshipDetail;
  confirming: boolean;
  declining: boolean;
  onConfirm: () => void;
  onDecline: () => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl bg-accent-soft/60 p-4">
      <Avatar user={req.other} />
      <div className="min-w-0 flex-1">
        <p className="text-[15px]">
          <Link to={`/u/${req.other.username}`} className="font-medium hover:underline">
            @{req.other.username}
          </Link>{" "}
          wants to show “{relationshipLabel(req.label)}” with you.
        </p>
        <p className="mt-0.5 text-sm text-muted">Sent {timeAgo(req.createdAt)} · only accept if you both agree.</p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" loading={confirming} onClick={onConfirm}>
          Confirm
        </Button>
        <Button size="sm" variant="secondary" loading={declining} onClick={onDecline}>
          Decline
        </Button>
      </div>
    </li>
  );
}

function NewRelationshipRequest({ onSent }: { onSent: () => void }) {
  const [label, setLabel] = useState<RelationshipLabel>("in_a_relationship");
  const [username, setUsername] = useState("");
  const send = useMutation({
    mutationFn: () => api("/me/relationship", { method: "POST", body: { label, partnerUsername: username } }),
    onSuccess: () => {
      setUsername("");
      onSent();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (username.trim()) send.mutate();
      }}
    >
      <div>
        <p className="label">Share a status with someone</p>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Relationship status">
          {RELATIONSHIP_KEYS.filter((key) => RELATIONSHIPS[key].needsPartner).map((key) => (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={label === key}
              onClick={() => setLabel(key)}
              className={clsx(
                "rounded-2xl border p-3 text-left text-sm font-medium transition-colors",
                label === key ? "border-accent bg-accent-soft text-accent-strong" : "border-line hover:bg-surface-2",
              )}
            >
              {RELATIONSHIPS[key].label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="partner-username">
          With whom?
        </label>
        <PartnerPicker value={username} onChange={setUsername} />
        <p className="mt-2 text-xs text-muted">They'll get a notification and can confirm or decline. Nothing appears until you both agree.</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={send.isPending} disabled={!username.trim()}>
          Send request
        </Button>
      </div>
    </form>
  );
}

/** Username field with autocomplete, so requests rarely go to the wrong person. */
function PartnerPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setQuery(value.trim().replace(/^@/, "")), 250);
    return () => clearTimeout(timer);
  }, [value]);
  const lookup = useQuery({
    queryKey: ["users", "lookup", query],
    queryFn: () => api<{ items: PublicUser[] }>("/users/lookup", { query: { q: query } }).then((r) => r.items),
    enabled: open && query.length >= 2,
    staleTime: 30_000,
  });
  const items = lookup.data ?? [];
  return (
    <div className="relative">
      <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted">@</span>
      <input
        id="partner-username"
        className="field pl-8"
        value={value}
        onChange={(e) => {
          onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="username"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && items.length > 0}
        aria-controls="partner-options"
        aria-autocomplete="list"
      />
      {open && items.length > 0 ? (
        <ul id="partner-options" role="listbox" className="card absolute inset-x-0 z-20 mt-1 max-h-60 overflow-auto p-1.5">
          {items.map((person) => (
            <li key={person.username}>
              <button
                type="button"
                role="option"
                aria-selected={value === person.username}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(person.username);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-surface-2"
              >
                <Avatar user={person} size="xs" />
                <span className="min-w-0">
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <span className="truncate">{person.displayName}</span>
                    <VerifiedBadge user={person} size="xs" />
                  </span>
                  <span className="block truncate text-xs text-muted">@{person.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const LETTER_OPTIONS: { value: LettersFrom; label: string; hint: string }[] = [
  { value: "everyone", label: "Anyone", hint: "Anyone on aSocial can write to you" },
  { value: "following", label: "People I follow", hint: "Only people you've chosen to follow" },
  { value: "nobody", label: "No one", hint: "Pause incoming letters entirely" },
];

function PresenceSettings({ me }: { me: Me }) {
  const update = useUpdateMe();
  const setBattery = useSetBattery();
  return (
    <Section title="Presence & privacy" description="You decide how reachable you are. Change it as often as your energy changes.">
      <p className="label">Social battery</p>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Social battery">
        {BATTERY_KEYS.map((key) => (
          <button
            key={key}
            role="radio"
            aria-checked={me.battery === key}
            onClick={() => me.battery !== key && setBattery.mutate(key)}
            className={clsx(
              "flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors",
              me.battery === key ? "border-accent bg-accent-soft" : "border-line hover:bg-surface-2",
            )}
          >
            <span className="mt-1" style={{ color: BATTERY[key].color }}>
              <BatteryIcon level={BATTERY[key].level} className="h-3.5 w-6" />
            </span>
            <span>
              <span className="block text-sm font-semibold">{BATTERY[key].label}</span>
              <span className="block text-xs text-muted">{BATTERY[key].hint}</span>
            </span>
          </button>
        ))}
      </div>

      <p className="label mt-6">Who can send you letters and messages</p>
      <div className="space-y-2" role="radiogroup" aria-label="Who can send you letters and messages">
        {LETTER_OPTIONS.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-1.5">
            <input
              type="radio"
              name="lettersFrom"
              checked={me.lettersFrom === option.value}
              onChange={() => update.mutate({ lettersFrom: option.value })}
              className="mt-1 size-4 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-[15px] font-medium">{option.label}</span>
              <span className="block text-sm text-muted">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>

    </Section>
  );
}

const THEMES: { value: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Daylight", icon: Sun },
  { value: "dark", label: "Candlelight", icon: Moon },
  { value: "system", label: "Match device", icon: Monitor },
];

function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <Section title="Appearance">
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
        {THEMES.map((option) => (
          <button
            key={option.value}
            role="radio"
            aria-checked={theme === option.value}
            onClick={() => setTheme(option.value)}
            className={clsx(
              "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-medium transition-colors",
              theme === option.value ? "border-accent bg-accent-soft text-accent-strong" : "border-line hover:bg-surface-2",
            )}
          >
            <option.icon className="size-5" />
            {option.label}
          </button>
        ))}
      </div>
    </Section>
  );
}

function DeleteAccount() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const remove = useMutation({
    mutationFn: () => api("/me", { method: "DELETE", body: { password } }),
    onSuccess: () => {
      signOut();
      navigate("/");
      toast("Your account and everything in it has been deleted. Take care.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
  return (
    <>
      <Button variant="ghost" className="text-clay hover:text-clay" onClick={() => setOpen(true)}>
        Delete account
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Delete your account?">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            remove.mutate();
          }}
          className="space-y-4"
        >
          <p className="text-sm text-muted">This permanently removes your profile, posts, replies, letters and photos. It can't be undone.</p>
          <div>
            <label className="label" htmlFor="confirm-password">
              Confirm with your password
            </label>
            <input id="confirm-password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep my account
            </Button>
            <Button type="submit" variant="danger" loading={remove.isPending} disabled={!password}>
              Delete forever
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

const LIMITS = [null, 15, 30, 45, 60, 90, 120, 180] as const;
const REMINDERS = [null, 10, 15, 20, 30, 45, 60, 90] as const;

function lastDays(days: UsageDay[], today: number) {
  const map = new Map(days.map((d) => [d.day, d.seconds]));
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (6 - i));
    const key = localDay(date);
    return {
      key,
      label: i === 6 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" }),
      seconds: i === 6 ? Math.max(today, map.get(key) ?? 0) : (map.get(key) ?? 0),
    };
  });
}

function TimeSettings({ me }: { me: Me }) {
  const queryClient = useQueryClient();
  const update = useUpdateMe();
  const usage = useUsage();
  const week = lastDays(usage.days, usage.today);
  const limit = me.dailyLimitMinutes;
  const max = Math.max(limit ? limit * 60 : 0, ...week.map((d) => d.seconds), 60);
  const average = week.reduce((sum, d) => sum + d.seconds, 0) / 7;

  return (
    <Section id="time" title="Time well spent" description="Time counts only while aSocial is open and you're active. Daily totals are saved to your account.">
      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "Today", value: usage.today },
          { label: "This session", value: usage.session },
          { label: "Daily average", value: average },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-surface-2 p-3">
            <dt className="text-xs text-muted">{item.label}</dt>
            <dd className="mt-0.5 font-serif text-xl font-semibold">{formatDuration(item.value)}</dd>
          </div>
        ))}
      </dl>
      {usage.sessionStartedAt ? (
        <p className="mt-2 text-xs text-muted">
          Session started at {new Date(usage.sessionStartedAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.
        </p>
      ) : null}

      <figure className="mt-5">
        <div className="relative flex h-28 items-end gap-2" aria-hidden>
          {limit ? (
            <div className="absolute inset-x-0 border-t border-dashed border-clay/60" style={{ bottom: `${((limit * 60) / max) * 100}%` }}>
              <span className="absolute -top-4 right-0 text-[10px] text-clay">limit</span>
            </div>
          ) : null}
          {week.map((d) => (
            <div key={d.key} className="flex h-full flex-1 flex-col justify-end" title={`${d.label}: ${formatDuration(d.seconds)}`}>
              <div
                className={clsx("min-h-[3px] rounded-t-md", limit && d.seconds >= limit * 60 ? "bg-clay/70" : "bg-accent/70")}
                style={{ height: `${(d.seconds / max) * 100}%` }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-2 text-center text-[11px] text-muted" aria-hidden>
          {week.map((d) => (
            <span key={d.key} className="flex-1">
              {d.label}
            </span>
          ))}
        </div>
        <figcaption className="sr-only">
          Time spent over the last 7 days: {week.map((d) => `${d.label} ${formatDuration(d.seconds)}`).join(", ")}
        </figcaption>
      </figure>

      <div className="mt-6 border-t border-line pt-5">
        <label className="label flex items-center gap-1.5" htmlFor="daily-limit">
          <Hourglass className="size-4 text-muted" aria-hidden /> Daily limit
        </label>
        <p className="mb-2 text-sm text-muted">We'll send one gentle reminder when you pass it. Nothing gets locked.</p>
        <select
          id="daily-limit"
          value={limit ?? ""}
          onChange={(e) => {
            const dailyLimitMinutes = e.target.value ? Number(e.target.value) : null;
            update.mutate(
              { dailyLimitMinutes },
              {
                onSuccess: () => {
                  void queryClient.invalidateQueries({ queryKey: usageKey });
                  localStorage.removeItem("asocial.limitNudge");
                  toast(dailyLimitMinutes ? `Daily limit set to ${formatDuration(dailyLimitMinutes * 60)}` : "Daily limit turned off");
                },
              },
            );
          }}
          className="field w-auto pr-8"
        >
          {LIMITS.map((value) => (
            <option key={value ?? "off"} value={value ?? ""}>
              {value ? formatDuration(value * 60) : "No limit"}
            </option>
          ))}
        </select>
      </div>

      {me.sessionReminderMinutes !== undefined ? (
      <div className="mt-5">
        <label className="label flex items-center gap-1.5" htmlFor="session-reminder">
          <Timer className="size-4 text-muted" aria-hidden /> Session reminder
        </label>
        <p className="mb-2 text-sm text-muted">A quiet note each time this session reaches the interval you pick. Your session timer sits next to Breathe.</p>
        <select
          id="session-reminder"
          value={me.sessionReminderMinutes ?? ""}
          onChange={(e) => {
            const sessionReminderMinutes = e.target.value ? Number(e.target.value) : null;
            update.mutate(
              { sessionReminderMinutes },
              {
                onSuccess: () =>
                  toast(sessionReminderMinutes ? `We'll remind you every ${formatDuration(sessionReminderMinutes * 60)}` : "Session reminders turned off"),
              },
            );
          }}
          className="field w-auto pr-8"
        >
          {REMINDERS.map((value) => (
            <option key={value ?? "off"} value={value ?? ""}>
              {value ? `Every ${formatDuration(value * 60)}` : "Off"}
            </option>
          ))}
        </select>
      </div>
      ) : null}
    </Section>
  );
}
