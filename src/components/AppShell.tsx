import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { canAccess, logout, useAuth, useEnsureSeed, usePatients, useAppointments, type AppPath, type Role } from "@/lib/store";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  FileText,
  FlaskConical,
  Receipt,
  BarChart3,
  UserCircle,
  Settings as SettingsIcon,
  Search,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";

const navItems: { to: AppPath; label: string; icon: typeof LayoutDashboard }[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/doctors", label: "Doctors", icon: Stethoscope },
  { to: "/prescriptions", label: "Prescriptions", icon: FileText },
  { to: "/lab-reports", label: "Lab Reports", icon: FlaskConical },
  { to: "/billing", label: "Billing", icon: Receipt },
  { to: "/reports", label: "Reports", icon: BarChart3 },
];

const secondaryNav: { to: AppPath; label: string; icon: typeof UserCircle }[] = [
  { to: "/profile", label: "Profile", icon: UserCircle },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function AppShell({ title, subtitle, children, actions }: AppShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const ready = useEnsureSeed();
  const auth = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const patients = usePatients();
  const appointments = useAppointments();

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const todayAppts = appointments.filter(
    (a) => a.date === today && (a.status === "Waiting" || a.status === "Confirmed" || a.status === "In Session"),
  );

  const searchResults = searchQuery.trim().length > 1
    ? patients
        .filter((p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.phone.includes(searchQuery),
        )
        .slice(0, 6)
    : [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!auth) {
      navigate({ to: "/login" });
      return;
    }
    if (!canAccess(auth.role, pathname)) {
      navigate({ to: "/" });
    }
  }, [auth, pathname, navigate, ready]);

  if (!ready || !auth) return null;

  const role: Role = auth.role;
  const visibleNav = navItems.filter((n) => canAccess(role, n.to));
  const visibleSecondary = secondaryNav.filter((n) => canAccess(role, n.to));

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-dvh bg-neutral-canvas font-sans text-text-primary antialiased">
      <nav className="hidden md:flex w-60 shrink-0 flex-col bg-blue-deep text-white">
        <Link to="/" className="flex items-center gap-2.5 px-5 py-5 border-b border-blue-mid">
          <div className="flex size-9 items-center justify-center rounded-md bg-blue-light text-white font-semibold text-sm">
            N
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Nisarg</div>
            <div className="text-[11px] text-white/60">Women Healthcare</div>
          </div>
        </Link>
        <ul className="flex flex-col gap-0.5 p-3">
          {visibleNav.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                    (active
                      ? "bg-blue-mid text-white"
                      : "text-white/70 hover:bg-blue-mid/60 hover:text-white")
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-auto border-t border-blue-mid p-3">
          <ul className="flex flex-col gap-0.5">
            {visibleSecondary.map(({ to, label, icon: Icon }) => {
              const active = isActive(to);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    className={
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                      (active
                        ? "bg-blue-deep-accent text-white"
                        : "text-white/70 hover:bg-blue-mid/60 hover:text-white")
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 px-3 text-[11px] text-white/40">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Offline-ready · Local
            </span>
          </div>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            className="absolute inset-0 bg-ink-900/45"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <nav className="relative flex h-full w-72 max-w-[85vw] flex-col bg-blue-deep text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-blue-mid px-5 py-4">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2.5"
              >
                <div className="flex size-9 items-center justify-center rounded-md bg-blue-light text-sm font-semibold text-white">
                  N
                </div>
                <div className="leading-tight">
                  <div className="text-sm font-semibold text-white">Nisarg</div>
                  <div className="text-[11px] text-white/60">Women Healthcare</div>
                </div>
              </Link>
              <button
                className="rounded-md p-2 text-white/70 hover:bg-blue-mid hover:text-white"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <ul className="flex flex-col gap-0.5 p-3">
              {visibleNav.map(({ to, label, icon: Icon }) => {
                const active = isActive(to);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setMobileOpen(false)}
                      className={
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                        (active
                          ? "bg-blue-deep-accent text-white"
                          : "text-white/70 hover:bg-blue-mid/60 hover:text-white")
                      }
                    >
                      <Icon className="size-4 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-auto border-t border-blue-mid p-3">
              <ul className="flex flex-col gap-0.5">
                {visibleSecondary.map(({ to, label, icon: Icon }) => {
                  const active = isActive(to);
                  return (
                    <li key={to}>
                      <Link
                        to={to}
                        onClick={() => setMobileOpen(false)}
                        className={
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                          (active
                            ? "bg-blue-mid text-white"
                            : "text-white/70 hover:bg-blue-mid/60 hover:text-white")
                        }
                      >
                        <Icon className="size-4 shrink-0" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </nav>
        </div>
      ) : null}

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-4 border-b border-neutral-border bg-neutral-surface px-6">
          <button
            className="flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-canvas md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-4" />
          </button>
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search patients by name, ID, or phone…"
              className="w-full rounded-md border border-neutral-border bg-neutral-canvas py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-teal-full focus:outline-none focus:ring-1 focus:ring-teal-full"
            />
            {searchOpen && searchQuery.trim().length > 1 && (
              <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg border border-neutral-border bg-neutral-surface shadow-lg">
                {searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-text-secondary">No patients found.</div>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      onMouseDown={() => {
                        setSearchQuery("");
                        setSearchOpen(false);
                        navigate({ to: "/patient/$patientId", params: { patientId: p.id } });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-neutral-canvas"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-light text-xs font-semibold text-red-full">
                        {p.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{p.name}</div>
                        <div className="text-xs text-text-secondary">{p.id} · {p.phone}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-canvas"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {todayAppts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex size-2 rounded-full bg-red-full" />
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border border-neutral-border bg-neutral-surface shadow-lg">
                <div className="border-b border-neutral-border px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Today's pending ({todayAppts.length})
                </div>
                {todayAppts.length === 0 ? (
                  <div className="px-4 py-4 text-sm text-text-secondary">No pending appointments today.</div>
                ) : (
                  <div className="max-h-72 divide-y divide-neutral-border overflow-y-auto">
                    {todayAppts.map((a) => (
                      <button
                        key={a.id}
                        onMouseDown={() => {
                          setNotifOpen(false);
                          navigate({ to: "/appointments" });
                        }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-neutral-canvas"
                      >
                        <div className="mt-1.5 size-2 shrink-0 rounded-full bg-amber-full" />
                        <div>
                          <div className="text-sm font-medium text-text-primary">{a.patientName}</div>
                          <div className="text-xs text-text-secondary">{a.time} · {a.purpose} · {a.status}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3 border-l border-neutral-border pl-4">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium text-text-primary">{auth.name}</span>
              <span className="text-[11px] text-text-secondary">{auth.title}</span>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-teal-pale text-sm font-semibold text-teal-full">
              {auth.initials}
            </div>
            <button
              onClick={() => {
                void logout().then(() => navigate({ to: "/login" }));
              }}
              className="flex size-9 items-center justify-center rounded-md text-text-secondary hover:bg-neutral-canvas hover:text-red-full"
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 px-6 py-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-text-primary">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-text-secondary">{subtitle}</p> : null}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "teal" | "rose" | "gold" | "sage" | "danger";
  children: ReactNode;
}) {
  const map: Record<string, string> = {
    teal: "bg-teal-pale text-teal-full",
    rose: "bg-red-light text-red-full",
    gold: "bg-amber-light text-amber-full",
    sage: "bg-teal-pale text-teal-full",
    danger: "bg-red-light text-red-full",
    neutral: "bg-neutral-canvas text-text-secondary border border-neutral-border",
  };
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium " +
        (map[tone] ?? map.neutral)
      }
    >
      {children}
    </span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={"rounded-lg border border-neutral-border bg-neutral-surface shadow-sm " + className}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center gap-2 rounded-md bg-teal-full px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-deep focus:outline-none focus:ring-2 focus:ring-teal-full-full/40 disabled:opacity-50 " +
        className
      }
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-teal-full hover:text-teal-full " +
        className
      }
    >
      {children}
    </button>
  );
}

