import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell, Card, StatusPill, PrimaryButton, GhostButton } from "@/components/AppShell";
import {
  UserPlus,
  CalendarPlus,
  Receipt,
  Upload,
  Users,
  CalendarDays,
  IndianRupee,
  Clock,
} from "lucide-react";
import { useAppointments, useAuth, useBills, usePatients } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Nisarg Women Healthcare" },
      {
        name: "description",
        content: "Today's clinic activity at a glance — patients, appointments, revenue.",
      },
    ],
  }),
  component: Index,
});

const quickActions = [
  { label: "Register Patient", to: "/patients", icon: UserPlus },
  { label: "Book Appointment", to: "/appointments", icon: CalendarPlus },
  { label: "Create Bill", to: "/billing", icon: Receipt },
  { label: "Upload Lab Report", to: "/lab-reports", icon: Upload },
] as const;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function statusTone(status: string) {
  if (status === "Completed") return "teal" as const;
  if (status === "In Session") return "teal" as const;
  if (status === "Waiting") return "gold" as const;
  if (status === "Cancelled") return "danger" as const;
  return "neutral" as const;
}

function Index() {
  const navigate = useNavigate();
  const auth = useAuth();
  const patients = usePatients();
  const appointments = useAppointments();
  const bills = useBills();
  const today = todayKey();

  const todaysAppointments = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.date === today)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, today],
  );

  const todaysBills = useMemo(
    () => bills.filter((bill) => bill.date.startsWith(today)),
    [bills, today],
  );

  const revenueToday = todaysBills
    .filter((bill) => bill.status === "Paid")
    .reduce((sum, bill) => sum + bill.total, 0);
  const waiting = todaysAppointments.filter(
    (appointment) => appointment.status === "Waiting",
  ).length;
  const pending = todaysAppointments.filter((appointment) =>
    ["Confirmed", "Waiting", "In Session"].includes(appointment.status),
  ).length;
  const recentPatients = [...patients]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const dateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const firstName = auth?.name?.replace(/^Dr\.\s+/i, "").split(" ")[0] || "team";
  const kpis = [
    {
      label: "Total Patients",
      value: patients.length.toLocaleString("en-IN"),
      trend: `${recentPatients.length} recent records`,
      tone: "teal" as const,
      icon: Users,
    },
    {
      label: "Today's Appointments",
      value: todaysAppointments.length.toLocaleString("en-IN"),
      trend: `${waiting} waiting`,
      tone: "amber" as const,
      icon: CalendarDays,
    },
    {
      label: "Revenue Today",
      value: `₹${revenueToday.toLocaleString("en-IN")}`,
      trend: `${todaysBills.length} bills`,
      tone: "blue" as const,
      icon: IndianRupee,
    },
    {
      label: "Pending Appointments",
      value: pending.toLocaleString("en-IN"),
      trend: "Confirmed, waiting, in session",
      tone: "neutral" as const,
      icon: Clock,
    },
  ];

  return (
    <AppShell
      title={`Good morning, ${firstName}`}
      subtitle={`${dateLabel} · ${todaysAppointments.length} booked · ${waiting} waiting`}
      actions={
        <PrimaryButton onClick={() => navigate({ to: "/appointments" })}>
          <CalendarPlus className="size-4" /> Book Appointment
        </PrimaryButton>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {k.label}
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                  {k.value}
                </div>
              </div>
              <div
                className={
                  "flex size-9 items-center justify-center rounded-md " +
                  (k.tone === "teal"
                    ? "bg-teal-pale text-teal-full"
                    : k.tone === "amber"
                      ? "bg-amber-light text-amber-full"
                      : k.tone === "blue"
                        ? "bg-blue-lighter text-blue-deep"
                        : "bg-neutral-canvas text-text-secondary")
                }
              >
                <k.icon className="size-4" />
              </div>
            </div>
            <div className="mt-3 text-xs text-text-secondary">{k.trend}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Today's Schedule</h3>
            <Link to="/appointments" className="text-xs font-medium text-teal-full hover:underline">
              View all
            </Link>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
                  <th className="w-20 px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {todaysAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-text-secondary">
                      No appointments scheduled today.
                    </td>
                  </tr>
                ) : (
                  todaysAppointments.map((row) => (
                    <tr
                      key={row.id}
                      className={
                        "transition-colors hover:bg-neutral-canvas " +
                        (row.status === "In Session" ? "bg-teal-pale/40" : "")
                      }
                    >
                      <td className="px-4 py-3 font-medium tabular-nums text-text-primary">
                        {row.time}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-text-primary">{row.patientName}</div>
                        <div className="text-xs text-text-secondary">{row.patientId}</div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{row.purpose}</td>
                      <td className="px-4 py-3 text-right">
                        <StatusPill tone={statusTone(row.status)}>{row.status}</StatusPill>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Quick Actions</h3>
          </div>
          <Card className="divide-y divide-neutral-border">
            {quickActions.map((a) => (
              <Link
                key={a.label}
                to={a.to}
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-primary transition-colors hover:bg-neutral-canvas hover:text-teal-full"
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-teal-pale text-teal-full">
                  <a.icon className="size-4" />
                </div>
                {a.label}
              </Link>
            ))}
          </Card>

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-text-primary">Recent Patients</h3>
              <Link to="/patients" className="text-xs font-medium text-teal-full hover:underline">
                View all
              </Link>
            </div>
            <Card className="divide-y divide-neutral-border">
              {recentPatients.map((p) => (
                <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-red-light text-xs font-semibold text-red-full">
                    {p.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text-primary">{p.name}</div>
                    <div className="text-xs text-text-secondary">
                      {p.id} · {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
