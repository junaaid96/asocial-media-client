import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "./api";
import { useAuth } from "./auth";

// Time well spent: counts *active* time (tab visible and the person did something in the last
// two minutes), keeps the session total in sessionStorage and sends daily totals to the server.

const SESSION_KEY = "asocial.session";
const TICK = 5;
const IDLE_AFTER_MS = 2 * 60_000;
const FLUSH_EVERY_MS = 60_000;

export function localDay(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface Session {
  startedAt: number;
  seconds: number;
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function writeSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // storage may be unavailable (private mode); the timer still works in memory
  }
}

/** Called on sign-in so the session timer starts at login. */
export function startUsageSession() {
  writeSession({ startedAt: Date.now(), seconds: 0 });
}

export function endUsageSession() {
  writeSession(null);
}

export interface UsageDay {
  day: string;
  seconds: number;
}

interface UsageValue {
  /** False when the API doesn't support time tracking (e.g. an older server): hide the UI. */
  available: boolean;
  /** Active seconds today, including time not yet sent to the server. */
  today: number;
  /** Active seconds since signing in (or opening this tab). */
  session: number;
  sessionStartedAt: number | null;
  days: UsageDay[];
  dailyLimitMinutes: number | null;
}

const UsageContext = createContext<UsageValue>({ available: false, today: 0, session: 0, sessionStartedAt: null, days: [], dailyLimitMinutes: null });

export const usageKey = ["usage"] as const;

interface UsageData {
  days: UsageDay[];
  dailyLimitMinutes: number | null;
}

/** Accepts whatever the API sent and keeps only well-formed days. */
function normalizeUsage(raw: unknown): UsageData {
  const data = (raw && typeof raw === "object" ? raw : {}) as { days?: unknown; dailyLimitMinutes?: unknown };
  const days = Array.isArray(data.days)
    ? data.days.filter((d): d is UsageDay => !!d && typeof d.day === "string" && typeof d.seconds === "number" && Number.isFinite(d.seconds))
    : [];
  const limit = typeof data.dailyLimitMinutes === "number" && data.dailyLimitMinutes > 0 ? data.dailyLimitMinutes : null;
  return { days, dailyLimitMinutes: limit };
}

// Remember for a while (per tab) that the API has no time tracking, so reloads don't ask again.
const UNSUPPORTED_KEY = "asocial.usageUnsupported";
const UNSUPPORTED_FOR_MS = 30 * 60_000;

function knownUnsupported() {
  try {
    const at = Number(sessionStorage.getItem(UNSUPPORTED_KEY));
    return !!at && Date.now() - at < UNSUPPORTED_FOR_MS;
  } catch {
    return false;
  }
}

function rememberUnsupported() {
  try {
    sessionStorage.setItem(UNSUPPORTED_KEY, String(Date.now()));
  } catch {
    // storage unavailable: fine, we'll find out again next load
  }
}

const isMissingEndpoint = (error: unknown) => error instanceof ApiError && (error.status === 404 || error.status === 405 || error.status === 501);

export function UsageProvider({ children }: { children: ReactNode }) {
  const { me } = useAuth();
  const queryClient = useQueryClient();
  const [unsupported, setUnsupportedState] = useState(knownUnsupported);
  const setUnsupported = useCallback(() => {
    rememberUnsupported();
    setUnsupportedState(true);
  }, []);
  const usage = useQuery({
    queryKey: usageKey,
    queryFn: async () => normalizeUsage(await api<unknown>("/me/usage")),
    enabled: !!me && !me.suspended && !unsupported,
    staleTime: 5 * 60_000,
    retry: (count, error) => !isMissingEndpoint(error) && count < 2,
  });
  useEffect(() => {
    if (isMissingEndpoint(usage.error)) setUnsupported();
  }, [usage.error, setUnsupported]);
  const [session, setSession] = useState<Session | null>(null);
  const [pending, setPending] = useState(0);
  const pendingRef = useRef(0);
  const lastActivity = useRef(Date.now());
  const day = localDay();

  useEffect(() => {
    if (!me || unsupported) return;
    const existing = readSession();
    const current = existing ?? { startedAt: Date.now(), seconds: 0 };
    if (!existing) writeSession(current);
    setSession(current);

    const onActivity = () => {
      lastActivity.current = Date.now();
    };
    const events = ["pointerdown", "keydown", "scroll", "pointermove", "touchstart"] as const;
    for (const e of events) window.addEventListener(e, onActivity, { passive: true });

    const tick = setInterval(() => {
      if (document.visibilityState !== "visible" || Date.now() - lastActivity.current > IDLE_AFTER_MS) return;
      pendingRef.current += TICK;
      setPending(pendingRef.current);
      setSession((s) => {
        const next = { startedAt: s?.startedAt ?? Date.now(), seconds: (s?.seconds ?? 0) + TICK };
        writeSession(next);
        return next;
      });
    }, TICK * 1000);

    let flushing = false;
    const flush = async () => {
      const seconds = Math.min(120, pendingRef.current);
      if (flushing || seconds <= 0) return;
      flushing = true;
      try {
        const today = localDay();
        const res = await api<{ counted?: boolean; today?: number } | undefined>("/me/usage", { method: "POST", body: { day: today, seconds } });
        if (res?.counted) {
          pendingRef.current = Math.max(0, pendingRef.current - seconds);
          setPending(pendingRef.current);
          queryClient.setQueryData<UsageData>(usageKey, (data) => {
            if (!data || typeof res.today !== "number") return data;
            const others = data.days.filter((d) => d.day !== today);
            return { ...data, days: [...others, { day: today, seconds: res.today }] };
          });
        }
      } catch (error) {
        // An API without time tracking: stop sending. Anything else: keep the seconds and retry later.
        if (isMissingEndpoint(error)) setUnsupported();
      } finally {
        flushing = false;
      }
    };
    const flushTimer = setInterval(flush, FLUSH_EVERY_MS);
    const onHide = () => document.visibilityState === "hidden" && void flush();
    document.addEventListener("visibilitychange", onHide);

    return () => {
      clearInterval(tick);
      clearInterval(flushTimer);
      document.removeEventListener("visibilitychange", onHide);
      for (const e of events) window.removeEventListener(e, onActivity);
    };
  }, [me?.username, queryClient, unsupported, setUnsupported]);

  const value = useMemo<UsageValue>(() => {
    const days = usage.data?.days ?? [];
    const saved = days.find((d) => d.day === day)?.seconds ?? 0;
    return {
      available: !!me && !unsupported,
      today: saved + pending,
      session: session?.seconds ?? 0,
      sessionStartedAt: session?.startedAt ?? null,
      days,
      dailyLimitMinutes: me?.dailyLimitMinutes ?? usage.data?.dailyLimitMinutes ?? null,
    };
  }, [usage.data, day, pending, session, me, unsupported]);

  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
}

export function useUsage() {
  return useContext(UsageContext);
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "under a minute";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
