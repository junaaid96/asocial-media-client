import clsx from "clsx";
import { Bell, Bookmark, Compass, Home, LogOut, Mail, Menu, MessageCircle, Moon, PenLine, Settings, ShieldCheck, Sun, SunMoon, User, Wind, X } from "lucide-react";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { SessionReminder, SessionTimer, SuspendedBanner, UsageNudge } from "./Wellbeing";

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
      <SessionReminder />
      <div className="mx-auto flex w-full max-w-7xl gap-4 px-0 sm:px-4 md:gap-6 md:pl-0 lg:px-6">
        <Sidebar />
        <main id="main" className="min-w-0 flex-1 px-3 pt-4 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-0 md:mx-auto md:max-w-2xl md:pt-6 md:pr-2 md:pb-16 lg:mx-0 lg:pt-8">
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

  // md (tablet): a collapsed icon rail. lg+: the full labelled sidebar.
  return (
    <aside className="sticky top-0 hidden h-dvh w-[4.75rem] shrink-0 flex-col items-center overflow-y-auto overscroll-contain py-6 pl-[env(safe-area-inset-left)] [scrollbar-width:thin] md:flex lg:w-60 lg:items-stretch lg:py-8 [@media(max-height:860px)]:py-4">
      <Link to="/" className="mb-6 rounded-2xl px-1 lg:mb-8 lg:px-3 [@media(max-height:860px)]:mb-4" aria-label="aSocial home">
        <span className="lg:hidden">
          <Logo markOnly />
        </span>
        <span className="hidden lg:inline">
          <Logo />
        </span>
      </Link>
      <nav aria-label="Main" className="w-full space-y-1 px-2 lg:px-0 [@media(max-height:860px)]:space-y-0.5">
        {items.map((item) => (
          <NavLink
            key={item.label}
            to={item.to}
            end={item.to === "/"}
            title={item.label}
            aria-label={item.badge ? `${item.label} (${item.badge} new)` : item.label}
            className={({ isActive }) =>
              clsx(
                "relative flex min-h-11 items-center justify-center gap-3.5 rounded-full text-[15px] transition-colors lg:justify-start lg:px-4 lg:py-2.5 [@media(max-height:860px)]:lg:py-1.5",
                isActive ? "bg-surface font-semibold text-ink shadow-sm ring-1 ring-line" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
              )
            }
          >
            <item.icon className="size-5 shrink-0" aria-hidden />
            <span className="hidden flex-1 lg:inline">{item.label}</span>
            {item.badge ? (
              <>
                <span className="absolute top-2 right-3 size-2.5 rounded-full bg-clay ring-2 ring-bg lg:hidden" aria-hidden />
                <span className="hidden min-w-5 place-items-center rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white lg:grid" aria-hidden>
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              </>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {me ? (
        <>
          <div className="mt-6 hidden w-full shrink-0 lg:block [@media(max-height:860px)]:mt-3">
            <Button size="lg" className="w-full" onClick={openWrite}>
              <PenLine className="size-4" /> Write
            </Button>
          </div>
          <button
            type="button"
            onClick={openWrite}
            aria-label="Write"
            title="Write"
            className="mt-5 grid size-12 shrink-0 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition active:scale-95 lg:hidden"
          >
            <PenLine className="size-5" aria-hidden />
          </button>
        </>
      ) : (
        <div className="mt-6 w-full space-y-2 px-2 lg:px-0">
          <Link to="/join" className="block">
            <Button size="lg" className="w-full max-lg:px-0">
              <span className="lg:hidden">Join</span>
              <span className="hidden lg:inline">Join aSocial</span>
            </Button>
          </Link>
          <Link to="/login" className="block">
            <Button size="lg" variant="secondary" className="w-full max-lg:px-0">
              Sign in
            </Button>
          </Link>
        </div>
      )}

      <div className="mt-auto w-full space-y-2 pt-6 [@media(max-height:860px)]:space-y-1.5 [@media(max-height:860px)]:pt-3">
        {hushed ? (
          <p className="hidden items-center gap-2 px-3 text-xs text-muted lg:flex">
            <Moon className="size-3.5" /> Notifications hushed while you recharge
          </p>
        ) : null}
        {me ? (
          <>
            <div className="hidden lg:block">
              <BatteryPicker direction="up" />
            </div>
            <div className="flex justify-center lg:hidden">
              <BatteryPicker compact direction="up" />
            </div>
          </>
        ) : null}
        <div className="flex flex-col items-center gap-1 lg:flex-row">
          <button
            onClick={openBreathe}
            aria-label="Breathe"
            title="Breathe"
            className="flex min-h-11 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink max-lg:size-11 max-lg:px-0 lg:flex-1 lg:justify-start"
          >
            <Wind className="size-4" aria-hidden /> <span className="hidden lg:inline">Breathe</span>
          </button>
          {me ? (
            <>
              <span className="hidden lg:inline-flex">
                <SessionTimer />
              </span>
              <span className="lg:hidden">
                <SessionTimer compact />
              </span>
            </>
          ) : null}
          <ThemeCycle />
        </div>
        {me ? (
          <div className="flex flex-col items-center gap-1 border-t border-line pt-2 lg:flex-row">
            <Link
              to={`/u/${me.username}`}
              title="Your profile"
              className="flex min-w-0 items-center gap-2.5 rounded-2xl px-2 py-2 hover:bg-surface-2 lg:flex-1"
            >
              <Avatar user={me} size="sm" showBattery />
              <span className="hidden min-w-0 lg:block">
                <span className="block truncate text-sm font-semibold">{me.displayName}</span>
                <span className="block truncate text-xs text-muted">@{me.username}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={signOutNow}
              title="Sign out"
              aria-label="Sign out"
              className="flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-xs font-medium text-muted ring-1 ring-line transition-colors hover:bg-clay-soft hover:text-clay hover:ring-clay/30 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none max-lg:size-11 max-lg:px-0 lg:min-h-0"
            >
              <LogOut className="size-4 lg:size-3.5" aria-hidden /> <span className="hidden lg:inline">Sign out</span>
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
      className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink lg:size-9"
      aria-label={`Theme: ${theme}. Switch to ${next}`}
      title={`Theme: ${theme}`}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

function MobileTopBar() {
  const { me } = useAuth();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => setMenu(false), [location.pathname]);
  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-line bg-bg/85 px-3 pt-[max(0.375rem,env(safe-area-inset-top))] pb-1.5 backdrop-blur-md md:hidden">
        <Link to="/" aria-label="aSocial home" className="mr-auto flex min-h-11 items-center rounded-2xl px-1">
          <Logo small compact={!!me} />
        </Link>
        {me ? (
          <>
            <SessionTimer compact />
            <BatteryPicker compact />
            <button
              type="button"
              onClick={() => setMenu(true)}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menu}
              className="relative ml-0.5 flex min-h-11 items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1 ring-1 ring-line hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            >
              <Avatar user={me} size="sm" />
              <Menu className="size-[18px] text-muted" aria-hidden />
              <MoreBadge />
            </button>
          </>
        ) : (
          <>
            <ThemeCycle />
            <Link to="/login" className="ml-1">
              <Button size="sm" className="min-h-10">
                Sign in
              </Button>
            </Link>
          </>
        )}
      </header>
      {me ? <MoreDrawer open={menu} onClose={() => setMenu(false)} /> : null}
    </>
  );
}

/** Dot on the menu button when something tucked inside the drawer (e.g. letters) is waiting. */
function MoreBadge() {
  const { items } = useNavItems();
  const hidden = items.filter((i) => !["Home", "Explore", "Messages", "Notifications"].includes(i.label));
  if (!hidden.some((i) => i.badge)) return null;
  return <span className="absolute top-1 right-1 size-2.5 rounded-full bg-clay ring-2 ring-bg" aria-hidden />;
}

/** Slide-out drawer for phones: every destination plus wellbeing, theme, sign out and the credit. */
function MoreDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { me } = useAuth();
  const { openBreathe } = useShell();
  const signOutNow = useSignOutNow();
  const { items, hushed } = useNavItems();
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  if (!me) return null;
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label="Menu"
      className="drawer m-0 ml-auto h-dvh max-h-none w-[min(20rem,86vw)] max-w-none overflow-visible bg-transparent p-0 text-ink backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
    >
      {open ? (
        <div className="flex h-full flex-col overflow-y-auto overscroll-contain border-l border-line bg-bg pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-4 shadow-2xl">
          <div className="flex items-center gap-3 pb-4">
            <Link to={`/u/${me.username}`} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 hover:bg-surface-2">
              <Avatar user={me} size="md" showBattery />
              <span className="min-w-0">
                <span className="block truncate font-semibold">{me.displayName}</span>
                <span className="block truncate text-sm text-muted">@{me.username}</span>
              </span>
            </Link>
            <button onClick={onClose} aria-label="Close menu" className="grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink">
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <nav aria-label="All pages" className="space-y-0.5 border-t border-line pt-3">
            {items.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    "flex min-h-12 items-center gap-3.5 rounded-2xl px-3.5 text-[15px] transition-colors",
                    isActive ? "bg-surface font-semibold text-ink ring-1 ring-line" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
                  )
                }
              >
                <item.icon className="size-5" aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-clay px-1.5 text-[11px] font-semibold text-white">{item.badge > 9 ? "9+" : item.badge}</span>
                ) : null}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            {hushed ? (
              <p className="flex items-center gap-2 px-1 text-xs text-muted">
                <Moon className="size-3.5" /> Notifications hushed while you recharge
              </p>
            ) : null}
            <BatteryPicker />
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  onClose();
                  openBreathe();
                }}
                className="flex min-h-11 flex-1 items-center gap-2 rounded-full px-3 text-sm text-muted hover:bg-surface-2 hover:text-ink"
              >
                <Wind className="size-4" aria-hidden /> Breathe
              </button>
              <SessionTimer />
              <ThemeCycle />
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                signOutNow();
              }}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-medium text-muted ring-1 ring-line transition-colors hover:bg-clay-soft hover:text-clay hover:ring-clay/30"
            >
              <LogOut className="size-4" aria-hidden /> Sign out
            </button>
          </div>
          <div className="mt-auto flex justify-center pt-6">
            <CreditPill />
          </div>
        </div>
      ) : null}
    </dialog>
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
      className={({ isActive }) =>
        clsx("relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium", isActive ? "text-accent" : "text-muted")
      }
    >
      <item.icon className="size-[22px]" aria-hidden />
      <span aria-hidden>{item.label === "Notifications" ? "Alerts" : item.label}</span>
      {item.badge ? <span className="absolute top-2 right-[calc(50%-15px)] size-2.5 rounded-full bg-clay ring-2 ring-surface" /> : null}
    </NavLink>
  );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-line bg-surface/95 px-[max(0.5rem,env(safe-area-inset-left))] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      {left.map(renderItem)}
      <div className="grid flex-1 place-items-center">
        <button onClick={openWrite} className="-mt-5 grid size-14 ring-4 ring-bg place-items-center rounded-full bg-accent text-on-accent shadow-lg active:scale-95" aria-label="Write">
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
