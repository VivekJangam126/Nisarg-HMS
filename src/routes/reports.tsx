import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, Card, StatusPill } from "@/components/AppShell";
import { Users, CalendarCheck, IndianRupee, FlaskConical } from "lucide-react";
import { useAppointments, useBills, useLabReports, usePatients } from "@/lib/store";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports - Nisarg Women Healthcare" },
      {
        name: "description",
        content: "Daily and weekly clinic reports - patients, appointments, revenue.",
      },
    ],
  }),
  component: ReportsPage,
});

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getRangeDays(range: string): Date[] {
  const now = new Date();
  if (range === "This month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const days: Date[] = [];
    let d = new Date(start);
    while (d <= now) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return days;
  }
  if (range === "Last month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    const days: Date[] = [];
    let d = new Date(start);
    while (d <= end) { days.push(new Date(d)); d.setDate(d.getDate() + 1); }
    return days;
  }
  // Last 7 days
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    return d;
  });
}

function ReportsPage() {
  const patients = usePatients();
  const appointments = useAppointments();
  const bills = useBills();
  const labReports = useLabReports();
  const [selectedRange, setSelectedRange] = useState("Last 7 days");

  const days = getRangeDays(selectedRange);
  const rangeKeys = new Set(days.map(dateKey));

  const rangeAppointments = appointments.filter((a) => rangeKeys.has(a.date));
  const completed = rangeAppointments.filter((a) => a.status === "Completed").length;
  const rangeBills = bills.filter((b) => rangeKeys.has(b.date.slice(0, 10)));
  const rangeRevenue = rangeBills
    .filter((b) => b.status === "Paid")
    .reduce((sum, b) => sum + b.total, 0);
  const rangeReports = labReports.filter((r) => rangeKeys.has(r.date)).length;
  const completionRate = rangeAppointments.length
    ? `${Math.round((completed / rangeAppointments.length) * 100)}%`
    : "0%";

  const weekly = days.map((day) => {
    const key = dateKey(day);
    return {
      day: day.toLocaleDateString("en-IN", { weekday: "short" }),
      patients: new Set(
        appointments.filter((a) => a.date === key).map((a) => a.patientId),
      ).size,
      revenue: bills
        .filter((b) => b.date.startsWith(key) && b.status === "Paid")
        .reduce((sum, b) => sum + b.total, 0),
    };
  });
  const maxPatients = Math.max(1, ...weekly.map((w) => w.patients));

  const revenueByLabel = rangeBills.reduce<Record<string, number>>((acc, bill) => {
    for (const item of bill.items) {
      const key = item.desc.toLowerCase().includes("sono")
        ? "Sonography"
        : item.desc.toLowerCase().includes("procedure")
          ? "Procedures"
          : item.desc.toLowerCase().includes("consult")
            ? "Consultation"
            : "Other";
      acc[key] = (acc[key] || 0) + item.qty * item.price;
    }
    return acc;
  }, {});
  const totalRevenue = Object.values(revenueByLabel).reduce((sum, v) => sum + v, 0);
  const revenueRows = ["Consultation", "Sonography", "Procedures", "Other"].map((label) => ({
    label,
    value: revenueByLabel[label] || 0,
    pct: totalRevenue ? Math.round(((revenueByLabel[label] || 0) / totalRevenue) * 100) : 0,
  }));

  const dateRangeLabel = `${days[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${days[
    days.length - 1
  ].toLocaleDateString("en-IN", { month: "short", day: "numeric" })}`;

  const summary = [
    {
      label: "Total patients",
      value: patients.length.toLocaleString("en-IN"),
      trend: `${rangeAppointments.length} appointments`,
      tone: "teal" as const,
      icon: Users,
    },
    {
      label: "Appointments completed",
      value: `${completed} / ${rangeAppointments.length}`,
      trend: completionRate,
      tone: "sage" as const,
      icon: CalendarCheck,
    },
    {
      label: "Revenue",
      value: `₹${rangeRevenue.toLocaleString("en-IN")}`,
      trend: `${rangeBills.length} bills`,
      tone: "gold" as const,
      icon: IndianRupee,
    },
    {
      label: "Reports uploaded",
      value: rangeReports.toLocaleString("en-IN"),
      trend: `${labReports.length} total reports`,
      tone: "rose" as const,
      icon: FlaskConical,
    },
  ];

  return (
    <AppShell
      title="Reports"
      subtitle="Operational summaries filtered by date range"
      actions={
        <select
          value={selectedRange}
          onChange={(e) => setSelectedRange(e.target.value)}
          className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-1.5 text-sm"
        >
          <option>Last 7 days</option>
          <option>This month</option>
          <option>Last month</option>
        </select>
      }
    >
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {s.label}
                </div>
                <div className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">
                  {s.value}
                </div>
              </div>
              <div
                className={
                  "flex size-9 items-center justify-center rounded-md " +
                  (s.tone === "teal"
                    ? "bg-teal-pale text-teal-full"
                    : s.tone === "rose"
                      ? "bg-red-light text-red-full"
                      : s.tone === "gold"
                        ? "bg-amber-light text-amber-full"
                        : "bg-emerald-50 text-emerald-700")
                }
              >
                <s.icon className="size-4" />
              </div>
            </div>
            <div className="mt-3">
              <StatusPill tone={s.tone}>{s.trend}</StatusPill>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-text-primary">Patient Activity</h3>
            <span className="text-xs text-text-secondary">{dateRangeLabel}</span>
          </div>
          <div className="flex h-48 items-end gap-3">
            {weekly.map((w) => (
              <div key={w.day} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t bg-teal/80 transition-colors hover:bg-teal"
                    style={{ height: `${(w.patients / maxPatients) * 100}%` }}
                    title={`${w.patients} patients`}
                  />
                </div>
                <div className="text-xs font-medium text-text-secondary">{w.day}</div>
                <div className="text-[11px] tabular-nums text-text-tertiary">{w.patients}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-semibold text-text-primary">Revenue Breakdown</h3>
          <div className="space-y-3 text-sm">
            {revenueRows.map((r) => (
              <div key={r.label}>
                <div className="flex justify-between text-text-secondary">
                  <span>{r.label}</span>
                  <span className="tabular-nums text-text-primary">
                    ₹{r.value.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-canvas">
                  <div className="h-full bg-gold" style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-border pt-3 text-sm">
            <span className="font-medium text-text-primary">Total</span>
            <span className="font-semibold tabular-nums text-text-primary">
              ₹{totalRevenue.toLocaleString("en-IN")}
            </span>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
