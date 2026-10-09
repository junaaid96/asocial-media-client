import clsx from "clsx";
import { Bell, Bookmark, Compass, Home, LogOut, Mail, MessageCircle, Moon, PenLine, Settings, ShieldCheck, Sun, SunMoon, User, Wind } from "lucide-react";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { useSummary } from "../lib/queries";
import { type ThemeChoice, useTheme } from "../lib/theme";
import { BatteryPicker } from "./BatteryPicker";
import { BreatheDialog } from "./BreatheDialog";
import { Composer } from "./Composer";
import { CreditPill } from "./CreditPill";
import { LetterComposer } from "./LetterComposer";
import { KindredSpirits, PromptCard, Resonating, SearchBox } from "./Rail";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Dialog } from "./ui/Dialog";
import { SuspendedBanner, UsageNudge } from "./Wellbeing";

interface LetterDraft {
  to?: string;
  replyTo?: string;
}

interface ShellActions {
  openWrite: () => void;
  openLetter: (draft?: LetterDraft) => void;
  openBreathe: () => void;
}

const ShellContext = createContext<ShellActions | null>(null);

export function useShell() {
  const value = useContext(ShellContext);
  if (!value) throw new Error("useShell must be used inside AppShell");
  return value;
}

export function AppShell() {
  const { me } = useAuth();
  const location = useLocation();
  const [writing, setWriting] = useState(false);
  const [letter, setLetter] = useState<LetterDraft | null>(null);
  const [breathing, setBreathing] = useState(false);

  // Close any open dialog when navigating.
  useEffect(() => {
    setWriting(false);
  }, [location.pathname]);

  const actions = useMemo<ShellActions>(
    () => ({
      openWrite: () => setWriting(true),
      openLetter: (draft) => setLetter(draft ?? {}),
      openBreathe: () => setBreathing(true),
    }),
    [],
  );

  return (
    <ShellContext.Provider value={actions}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
        Skip to content
      </a>
      <MobileTopBar />
      <SuspendedBanner />
      <UsageNudge />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-0 sm:px-4 lg:px-6">
        <Sidebar />
        <main id="main" className="min-w-0 flex-1 px-3 pt-4 pb-28 sm:px-0 lg:max-w-2xl lg:pt-8 lg:pb-16">
          <Outlet />
          <footer className="mt-10 flex justify-center border-t border-line pt-6 xl:hidden">
            <CreditPill />
          </footer>
        </main>
        <aside className="hidden w-80 shrink-0 space-y-4 pt-8 pb-10 xl:block">
          <div className="sticky top-8 space-y-4">
            <SearchBox />
            <PromptCard />
            {me ? <KindredSpirits /> : null}
            <Resonating />
            <footer className="space-y-3 px-2 text-xs leading-relaxed text-muted">
              <p>aSocial is a quiet place. Be gentle, take breaks, and write like no one is counting — because no one is.</p>
              <CreditPill />
            </footer>
          </div>
        </aside>
      </div>
      <MobileNav />
      <ScrollRestoration />

      <Dialog open={writing} onClose={() => setWriting(false)} title="Write something" className="w-[min(100%-1.5rem,40rem)]">
        {writing ? <Composer autoFocus onPosted={() => setWriting(false)} /> : null}
      </Dialog>
      <LetterComposer draft={letter} onClose={() => setLetter(null)} />
      <BreatheDialog open={breathing} onClose={() => setBreathing(false)} />
    </ShellContext.Provider>
  );
}

function useNavItems() {
  const { me } = useAuth();
  const summary = useSummary();
  const hushed = me?.battery === "recharging";
  const items: { to: string; label: string; icon: typeof Home; badge?: number; auth?: boolean }[] = [
    { to: "/", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/messages", label: "Messages", icon: MessageCircle, badge: hushed ? 0 : summary.data?.messages, auth: true },
    { to: "/letters", label: "Letters", icon: Mail, badge: hushed ? 0 : summary.data?.letters, auth: true },
    { to: "/notifications", label: "Notifications", icon: Bell, badge: hushed ? 0 : summary.data?.unread, auth: true },
    { to: "/saved", label: "Saved", icon: Bookmark, auth: true },
    { to: me ? `/u/${me.username}` : "/login", label: "Profile", icon: User, auth: true },
    { to: "/settings", label: "Settings", icon: Settings, auth: true },
  ];
  if (me?.role === "admin") items.push({ to: "/admin", label: "Moderation", icon: ShieldCheck, auth: true });
  return { items: items.filter((item) => !item.auth || me), hushed };
}

function Sidebar() {
  const { me } = useAuth();
  const { openWrite, openBreathe } = useShell();
  const signOutNow = useSignOutNow();
  const { items, hushed } = useNavItems();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto overscroll-contain py-8 [scrollbar-width:thin] lg:flex [@media(max-height:860px)]:py-4">
      <Link to="/" className="mb-8 px-3 [@media(max-height:860px)]:mb-4" aria-label="aSocial home">
        <Logo />
      </Link>
      <nav aria-label="Main" className="space-y-1 [@media(max-height:860px)]:space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-3.5 rounded-full px-4 py-2.5 text-[15px] transition-colors [@media(max-height:860px)]:py-1.5",
                isActive ? "bg-surface font-semibold text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            <item.icon className="size-5" />
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="grid min-w-5 place-items-center rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {me ? (
        <Button size="lg" className="mt-6 w-full shrink-0 [@media(max-height:860px)]:mt-3" onClick={openWrite}>
          <PenLine className="size-4" /> Write
        </Button>
      ) : (
        <div className="mt-6 space-y-2">
          <Link to="/join" className="block">
            <Button size="lg" className="w-full">
              Join aSocial
            </Button>
          </Link>
          <Link to="/login" className="block">
            <Button size="lg" variant="secondary" className="w-full">
              Sign in
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-auto space-y-2 pt-6 [@media(max-height:860px)]:space-y-1.5 [@media(max-height:860px)]:pt-3">
        {hushed ? (
          <p className="flex items-center gap-2 px-3 text-xs text-muted">
            <Moon className="size-3.5" /> Notifications hushed while you recharge
          </p>
        ) : null}
        {me ? <BatteryPicker direction="up" /> : null}
        <div className="flex items-center gap-1">
          <button onClick={openBreathe} className="flex flex-1 items-center gap-2 rounded-full px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink">
            <Wind className="size-4" /> Breathe
          </button>
          <ThemeCycle />
        </div>
        {me ? (
          <div className="flex items-center gap-1 border-t border-line pt-2">
            <Link to={`/u/${me.username}`} className="flex min-w-0 flex-1 items-center gap-2.5 rounded-2xl px-2 py-2 hover:bg-surface-2">
              <Avatar user={me} size="sm" showBattery />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{me.displayName}</span>
                <span className="block truncate text-xs text-muted">@{me.username}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={signOutNow}
              title="Sign out"
              className="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-muted ring-1 ring-line transition-colors hover:bg-clay-soft hover:text-clay hover:ring-clay/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <LogOut className="size-3.5" aria-hidden /> Sign out
            </button>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

const THEME_ORDER: ThemeChoice[] = ["system", "light", "dark"];
const THEME_ICON = { system: SunMoon, light: Sun, dark: Moon };

export function ThemeCycle() {
  const { theme, setTheme } = useTheme();
  const Icon = THEME_ICON[theme];
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]!;
  return (
    <button
      onClick={() => setTheme(next)}
      className="rounded-full p-2 text-muted hover:bg-surface-2 hover:text-ink"
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={`Theme: ${theme}`}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

function MobileTopBar() {
  const { me } = useAuth();
  const { openBreathe } = useShell();
  const signOutNow = useSignOutNow();
  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
      <Link to="/" aria-label="aSocial home" className="mr-auto">
        <Logo small />
      </Link>
      <button onClick={openBreathe} className="rounded-full p-2 text-muted hover:bg-surface-2" aria-label="Take a breath">
        <Wind className="size-[18px]" />
      </button>
      <ThemeCycle />
      {me ? (
        <>
          <MobileLettersLink />
          <BatteryPicker compact />
          <Link to={`/u/${me.username}`} aria-label="Your profile" className="ml-1 rounded-full focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none">
            <Avatar user={me} size="sm" />
          </Link>
          <button
            type="button"
            onClick={signOutNow}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-full p-2 text-muted hover:bg-clay-soft hover:text-clay focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <LogOut className="size-[18px]" aria-hidden />
          </button>
        </>
      ) : (
        <Link to="/login">
          <Button size="sm">Sign in</Button>
        </Link>
      )}
    </header>
  );
}

/** Signs out right away (no confirmation) and lands on the welcome page. */
function useSignOutNow() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  return () => {
    signOut();
    navigate("/", { replace: true });
    toast("Signed out. Come back whenever you like.");
  };
}

function MobileLettersLink() {
  const { items } = useNavItems();
  const letters = items.find((i) => i.label === "Letters");
  if (!letters) return null;
  return (
    <NavLink to="/letters" aria-label="Letters" className={({ isActive }) => clsx("relative rounded-full p-2 hover:bg-surface-2", isActive ? "text-accent" : "text-muted")}>
      <Mail className="size-[18px]" />
      {letters.badge ? <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-clay ring-2 ring-bg" /> : null}
    </NavLink>
  );
}

function MobileNav() {
  const { me } = useAuth();
  const { openWrite } = useShell();
  const { items } = useNavItems();
  if (!me) return null;
  const pick = (label: string) => items.find((i) => i.label === label)!;
  const left = [pick("Home"), pick("Explore")];
  const right = [pick("Messages"), pick("Notifications")];

  const renderItem = (item: (typeof items)[number]) => (
    <NavLink
      key={item.label}
      to={item.to}
      end={item.to === "/"}
      aria-label={item.label}
      className={({ isActive }) => clsx("relative grid flex-1 place-items-center py-2.5", isActive ? "text-accent" : "text-muted")}
    >
      <item.icon className="size-6" />
      {item.badge ? <span className="absolute top-2 right-[calc(50%-16px)] size-2 rounded-full bg-clay ring-2 ring-surface" /> : null}
    </NavLink>
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      {left.map(renderItem)}
      <div className="grid flex-1 place-items-center">
        <button onClick={openWrite} className="grid size-12 place-items-center rounded-full bg-accent text-on-accent shadow-lg active:scale-95" aria-label="Write">
          <PenLine className="size-5" />
        </button>
      </div>
      {right.map(renderItem)}
    </nav>
  );
}

export function PageHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4 px-1">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-[15px] text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
