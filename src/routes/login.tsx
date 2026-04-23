import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Stethoscope } from "lucide-react";
import { useEffect, useState } from "react";
import { DEMO_CREDENTIALS, login as doLogin, useAuth, useEnsureSeed } from "@/lib/store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Nisarg Women Healthcare" },
      { name: "description", content: "Secure staff sign in to the clinic management system." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const ready = useEnsureSeed();
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && auth) navigate({ to: "/" });
  }, [auth, navigate, ready]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Enter username and password.");
      return;
    }
    setSubmitting(true);
    const user = await doLogin(username, password);
    setSubmitting(false);
    if (!user) {
      setError("Invalid credentials.");
      return;
    }
    navigate({ to: "/" });
  };

  const fill = (u: string) => {
    setUsername(u);
    setPassword("");
    setError(null);
  };

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-neutral-background font-sans text-text-primary lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-blue-deep p-10 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-md bg-blue-light font-semibold">
            N
          </div>
          <div>
            <div className="text-base font-semibold">Nisarg</div>
            <div className="text-xs text-white/60">Women Healthcare</div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-3xl font-semibold leading-tight">
            Calm, secure clinic operations
            <br />
            for Dr. Manjusha's practice.
          </h1>
          <p className="mt-3 max-w-sm text-sm text-white/70">
            Manage patients, appointments, prescriptions, lab reports and billing — all from one
            offline-ready local system.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-white/60">
            <ShieldCheck className="size-4" />
            All records stored locally on the clinic computer.
          </div>
        </div>

        <div className="text-xs text-white/40">© Nisarg Women Healthcare · Pune</div>

        {/* decorative ring */}
        <div className="pointer-events-none absolute -right-32 -top-32 size-[420px] rounded-full bg-red-light/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-20 size-[320px] rounded-full bg-teal-full/30 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-sm text-text-secondary lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-md bg-blue-deep font-semibold text-white">
              N
            </div>
            <span className="font-semibold text-text-primary">Nisarg Women Healthcare</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-text-primary">Sign in</h2>
          <p className="mt-1 text-sm text-text-secondary">Enter your clinic credentials to continue.</p>

          <form className="mt-6 space-y-4 text-sm" onSubmit={handleSubmit}>
            <div>
              <label className="text-xs font-medium text-text-secondary">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2.5 focus:border-teal-full focus:outline-none focus:ring-1 focus:ring-teal-full-full"
                placeholder="admin / reception / doctor"
                autoComplete="username"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary">Password</label>
                <button type="button" className="text-xs font-medium text-teal-full hover:underline">
                  Forgot?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2.5 focus:border-teal-full focus:outline-none focus:ring-1 focus:ring-teal-full-full"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div className="rounded-md border border-red-light bg-red-light px-3 py-2 text-xs text-red-text">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-teal-full py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-deep"
            >
              <Stethoscope className="size-4" />
              {submitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 rounded-md border border-neutral-border bg-neutral-surface p-3 text-xs">
            <div className="mb-2 font-medium text-text-primary">Seeded staff accounts</div>
            <ul className="space-y-1.5">
              {DEMO_CREDENTIALS.map((c) => (
                <li key={c.username} className="flex items-center justify-between gap-2">
                  <div className="text-text-secondary">
                    <span className="font-mono text-text-primary">{c.username}</span>
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-text-tertiary">
                      {c.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => fill(c.username)}
                    className="rounded border border-neutral-border px-2 py-0.5 text-[11px] font-medium text-teal-full hover:border-teal-full hover:bg-teal-pale"
                  >
                    Use username
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-text-tertiary">
              Passwords are verified by the local server and are not bundled in the browser app.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-background px-3 py-2 text-xs text-text-secondary">
            <ShieldCheck className="size-3.5 text-teal-full" />
            Secure local access · No internet required
          </div>

          <div className="mt-8 text-center text-xs text-text-tertiary">
            For account help contact your clinic admin.
          </div>
        </div>
      </div>
    </div>
  );
}

