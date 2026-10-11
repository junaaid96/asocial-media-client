import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { ThemeCycle } from "../components/AppShell";
import { CreditPill } from "../components/CreditPill";
import { Logo } from "../components/Logo";
import { Button } from "../components/ui/Button";
import { api, errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { Me } from "../lib/types";

const QUOTES = [
  ["Quiet people have the loudest minds.", "Stephen Hawking"],
  ["Solitude is where I place my chaos to rest and awaken my inner peace.", "Nikki Rowe"],
  ["The quieter you become, the more you are able to hear.", "Rumi"],
];

function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]!);
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-accent p-12 text-on-accent lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-40 size-[30rem] rounded-full bg-black/15 blur-3xl" />
        <Link to="/" className="relative font-serif text-2xl font-semibold">
          aSocial
        </Link>
        <blockquote className="relative mt-auto max-w-md">
          <p className="font-serif text-4xl leading-tight">“{quote[0]}”</p>
          <footer className="mt-4 text-sm opacity-80">— {quote[1]}</footer>
        </blockquote>
        <p className="relative mt-12 text-sm opacity-75">No follower counts on display · Letters that take their time · A feed that ends</p>
      </aside>
      {/* Bottom padding keeps the form clear of the fixed credit pill on short screens. */}
      <main className="flex flex-col px-5 pt-6 pb-24 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
            <ArrowLeft className="size-4" /> <span className="lg:hidden">
              <Logo small />
            </span>
            <span className="hidden lg:inline">Back to aSocial</span>
          </Link>
          <ThemeCycle />
        </div>
        <div className="mx-auto my-auto w-full max-w-sm py-10">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
      {/* Centered under the form: across the screen on mobile, within the form column on large screens. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:left-1/2">
        <CreditPill className="pointer-events-auto max-w-full shadow-sm backdrop-blur-md" />
      </div>
    </div>
  );
}

function useAfterAuth() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";
  return (token: string, user: Me, message: string) => {
    signIn(token, user);
    toast.success(message);
    navigate(from, { replace: true });
  };
}

export function Login() {
  const { me } = useAuth();
  const done = useAfterAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const login = useMutation({
    mutationFn: () => api<{ token: string; user: Me }>("/auth/login", { method: "POST", body: { identifier, password } }),
    onSuccess: ({ token, user }) => done(token, user, `Welcome back, ${user.displayName.split(" ")[0]}`),
    onError: (error) => toast.error(errorMessage(error)),
  });
  if (me) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle={
        <>
          New here?{" "}
          <Link to="/join" className="font-medium text-accent hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          login.mutate();
        }}
      >
        <div>
          <label className="label" htmlFor="identifier">
            Email or username
          </label>
          <input id="identifier" className="field" value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}

export function Join() {
  const { me } = useAuth();
  const done = useAfterAuth();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const register = useMutation({
    mutationFn: () => api<{ token: string; user: Me }>("/auth/register", { method: "POST", body: form }),
    onSuccess: ({ token, user }) => done(token, user, "Welcome to your quiet corner"),
    onError: (error) => toast.error(errorMessage(error)),
  });
  if (me) return <Navigate to="/" replace />;

  return (
    <AuthLayout
      title="Find your quiet corner"
      subtitle={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          register.mutate();
        }}
      >
        <div>
          <label className="label" htmlFor="displayName">
            What should we call you?
          </label>
          <input
            id="displayName"
            className="field"
            value={form.displayName}
            onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
            maxLength={50}
            autoComplete="name"
            required
            autoFocus
          />
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
              autoComplete="username"
              required
            />
          </div>
          <p className="mt-1 text-xs text-muted">3–24 lowercase letters, numbers or underscores.</p>
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className="field" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} autoComplete="email" required />
        </div>
        <div>
          <label className="label" htmlFor="new-password">
            Password
          </label>
          <input
            id="new-password"
            type="password"
            className="field"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            minLength={8}
            autoComplete="new-password"
            required
          />
          <p className="mt-1 text-xs text-muted">At least 8 characters.</p>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
          Create my account
        </Button>
        <p className="text-center text-xs text-muted">No ads. No public follower counts. No pressure.</p>
      </form>
    </AuthLayout>
  );
}
