import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell, Card, StatusPill, PrimaryButton, GhostButton } from "@/components/AppShell";
import { CalendarPlus, ChevronLeft, ChevronRight, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  bookAppointment,
  can,
  isSlotTaken,
  TIME_SLOTS,
  updateAppointmentStatus,
  useAppointments,
  useAuth,
  useDoctors,
  useEnsureSeed,
  usePatients,
  type Appointment,
} from "@/lib/store";

export const Route = createFileRoute("/appointments")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Appointments — Nisarg Women Healthcare" },
      { name: "description", content: "Schedule, view, and manage clinic appointments." },
    ],
  }),
  component: AppointmentsPage,
});

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfWeek(d: Date) {
  const diff = (d.getDay() + 6) % 7;
  const r = new Date(d);
  r.setDate(d.getDate() - diff);
  r.setHours(0, 0, 0, 0);
  return r;
}

const STATUS_TONES: Record<Appointment["status"], "sage" | "teal" | "rose" | "neutral" | "danger"> = {
  Completed: "teal",
  "In Session": "teal",
  Waiting: "rose",
  Confirmed: "neutral",
  Cancelled: "danger",
};

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-neutral-surface shadow-xl">
        <div className="px-5 py-4">
          <p className="text-sm text-text-primary">{message}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-border px-5 py-3">
          <GhostButton onClick={onCancel}>No, keep it</GhostButton>
          <button
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-md bg-red-full px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Yes, cancel it
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentsPage() {
  const { patientId: preselectedPatientId } = Route.useSearch();
  useEnsureSeed();
  const auth = useAuth();
  const patients = usePatients();
  const doctors = useDoctors();
  const allAppts = useAppointments();

  const appts = auth?.role === "doctor"
    ? allAppts.filter((a) => {
        const userDoctor = doctors.find((d) => d.name === auth.name);
        return a.doctorId === userDoctor?.id;
      })
    : allAppts;

  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => fmtDate(new Date()));
  const [doctorFilter, setDoctorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(!!preselectedPatientId);
  const [editAppt, setEditAppt] = useState<Appointment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  const canCreate = can(auth?.role, "appointment.create");
  const canCancel = can(auth?.role, "appointment.cancel");
  const showDoctorFilter = auth?.role !== "doctor";

  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekAnchor);
      d.setDate(weekAnchor.getDate() + i);
      const ds = fmtDate(d);
      return {
        date: ds,
        label: d.toLocaleDateString("en-IN", { weekday: "short" }),
        num: d.getDate(),
        count: appts.filter((a) => a.date === ds && a.status !== "Cancelled").length,
      };
    }), [weekAnchor, appts]);

  const subtitle = useMemo(() => {
    const d = new Date(selectedDate);
    const inProgress = appts.filter((a) => a.date === selectedDate && ["Confirmed", "In Session", "Waiting"].includes(a.status)).length;
    const total = appts.filter((a) => a.date === selectedDate && a.status !== "Cancelled").length;
    return `${d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · ${total} booked · ${inProgress} in progress`;
  }, [selectedDate, appts]);

  const inProgressAppts = useMemo(() =>
    appts
      .filter((a) => a.date === selectedDate && ["Confirmed", "In Session", "Waiting"].includes(a.status))
      .filter((a) => doctorFilter === "all" || a.doctorId === doctorFilter)
      .sort((a, b) => (a.time || "").localeCompare(b.time || "")),
    [appts, selectedDate, doctorFilter]);

  const completedAppts = useMemo(() =>
    appts
      .filter((a) => a.status === "Completed")
      .filter((a) => doctorFilter === "all" || a.doctorId === doctorFilter)
      .filter((a) => statusFilter === "all" || statusFilter === "Completed")
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .slice(0, 20),
    [appts, doctorFilter, statusFilter]);

  const cancelledAppts = useMemo(() =>
    appts
      .filter((a) => a.status === "Cancelled")
      .filter((a) => doctorFilter === "all" || a.doctorId === doctorFilter)
      .filter((a) => statusFilter === "all" || statusFilter === "Cancelled")
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
      .slice(0, 20),
    [appts, doctorFilter, statusFilter]);

  const shiftWeek = (delta: number) => {
    const d = new Date(weekAnchor);
    d.setDate(weekAnchor.getDate() + delta * 7);
    setWeekAnchor(d);
  };

  const handleComplete = async (id: string) => {
    await updateAppointmentStatus(id, "Completed");
    toast.success("Appointment marked as completed");
  };

  const handleCancel = async (id: string) => {
    await updateAppointmentStatus(id, "Cancelled");
    toast.success("Appointment cancelled");
    setConfirmCancel(null);
  };

  return (
    <AppShell
      title="Appointments"
      subtitle={subtitle}
      actions={
        canCreate ? (
          <PrimaryButton onClick={() => setOpen(true)}>
            <CalendarPlus className="size-4" /> Book Slot
          </PrimaryButton>
        ) : null
      }
    >
      <Card className="mb-4 flex flex-wrap items-center gap-2 p-2">
        <button onClick={() => shiftWeek(-1)} className="rounded p-2 hover:bg-neutral-canvas" aria-label="Prev week">
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {days.map((d) => {
            const active = d.date === selectedDate;
            return (
              <button key={d.date} onClick={() => setSelectedDate(d.date)}
                className={"flex min-w-[64px] flex-col items-center rounded-md px-3 py-2 text-xs transition-colors " + (active ? "bg-teal-full text-white" : "text-text-secondary hover:bg-neutral-canvas")}>
                <span className="uppercase tracking-wide">{d.label}</span>
                <span className="mt-0.5 text-base font-semibold tabular-nums">{d.num}</span>
                <span className={"mt-0.5 text-[10px] " + (active ? "text-white/80" : "text-text-tertiary")}>{d.count} bookings</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => shiftWeek(1)} className="rounded p-2 hover:bg-neutral-canvas" aria-label="Next week">
          <ChevronRight className="size-4" />
        </button>
        <div className="ml-2 flex gap-2 border-l border-neutral-border pl-2">
          {showDoctorFilter ? (
            <select value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}
              className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-1.5 text-sm">
              <option value="all">All doctors</option>
              {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          ) : null}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-1.5 text-sm">
            <option value="all">All status</option>
            <option>Confirmed</option>
            <option>Waiting</option>
            <option>In Session</option>
            <option>Completed</option>
            <option>Cancelled</option>
          </select>
        </div>
      </Card>

      {inProgressAppts.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 text-sm font-semibold text-text-primary">In Progress ({inProgressAppts.length})</h3>
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
                  <th className="w-20 px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Purpose</th>
                  <th className="px-4 py-3 font-medium">Doctor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-border">
                {inProgressAppts.map((a, idx) => (
                  <tr key={a.id} className="transition-colors hover:bg-neutral-canvas">
                    <td className="px-4 py-3 font-medium tabular-nums text-text-primary">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-teal-pale text-xs font-semibold text-teal-full">{idx + 1}</span>
                        {a.time}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary">{a.patientName}</div>
                      <div className="text-xs text-text-secondary">{a.patientId}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{a.purpose}</td>
                    <td className="px-4 py-3 text-text-secondary">{a.doctorName}</td>
                    <td className="px-4 py-3"><StatusPill tone={STATUS_TONES[a.status]}>{a.status}</StatusPill></td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {canCreate ? (
                          <button onClick={() => setEditAppt(a)}
                            className="rounded border border-neutral-border px-2 py-1 text-xs text-text-secondary hover:border-teal-full hover:text-teal-full">
                            <Pencil className="inline size-3 mr-1" />Edit
                          </button>
                        ) : null}
                        {a.status !== "Completed" && a.status !== "Cancelled" ? (
                          <button onClick={() => void handleComplete(a.id)}
                            className="rounded border border-neutral-border px-2 py-1 text-xs text-text-secondary hover:border-teal-full hover:text-teal-full">
                            Complete
                          </button>
                        ) : null}
                        {canCancel && a.status !== "Cancelled" ? (
                          <button onClick={() => setConfirmCancel(a.id)}
                            className="rounded border border-neutral-border px-2 py-1 text-xs text-text-secondary hover:border-red-full hover:text-red-full">
                            Cancel
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {(completedAppts.length > 0 || cancelledAppts.length > 0) && (
        <Card className="overflow-hidden">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
                <th className="px-4 py-3 font-medium">Date & Time</th>
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Doctor</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {[...completedAppts, ...cancelledAppts].map((a) => (
                <tr key={a.id} className="transition-colors hover:bg-neutral-canvas">
                  <td className="px-4 py-3 text-text-primary">
                    <div className="text-sm font-medium">{a.date}</div>
                    <div className="text-xs text-text-secondary">{a.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{a.patientName}</div>
                    <div className="text-xs text-text-secondary">{a.patientId}</div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{a.doctorName}</td>
                  <td className="px-4 py-3"><StatusPill tone={STATUS_TONES[a.status]}>{a.status}</StatusPill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {inProgressAppts.length === 0 && completedAppts.length === 0 && cancelledAppts.length === 0 && (
        <Card className="p-12 text-center">
          <CalendarPlus className="mx-auto mb-3 size-10 text-text-tertiary" />
          <p className="text-sm font-medium text-text-primary">No appointments for this day</p>
          <p className="mt-1 text-xs text-text-secondary">Click "Book Slot" to schedule one.</p>
        </Card>
      )}

      {open ? (
        <BookDialog
          defaultDate={selectedDate}
          defaultPatientId={preselectedPatientId}
          patients={patients}
          doctors={doctors}
          onClose={() => setOpen(false)}
          onBooked={() => toast.success("Appointment booked successfully")}
        />
      ) : null}

      {editAppt ? (
        <EditDialog
          appt={editAppt}
          patients={patients}
          doctors={doctors}
          onClose={() => setEditAppt(null)}
          onSaved={() => { setEditAppt(null); toast.success("Appointment updated"); }}
        />
      ) : null}

      {confirmCancel ? (
        <ConfirmDialog
          message="Are you sure you want to cancel this appointment? This cannot be undone."
          onConfirm={() => void handleCancel(confirmCancel)}
          onCancel={() => setConfirmCancel(null)}
        />
      ) : null}
    </AppShell>
  );
}

function BookDialog({
  defaultDate, defaultPatientId, patients, doctors, onClose, onBooked,
}: {
  defaultDate: string;
  defaultPatientId?: string;
  patients: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId ?? patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(doctors[0]?.id ?? "");
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("");
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!patientId) return setError("Select a patient.");
    if (!doctorId) return setError("Select a doctor.");
    if (!date) return setError("Choose a date.");
    if (!time) return setError("Choose a time slot.");
    if (!purpose.trim()) return setError("Enter a purpose for the visit.");
    if (purpose.length > 200) return setError("Purpose too long (max 200 chars).");
    const patient = patients.find((p) => p.id === patientId);
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!patient || !doctor) return setError("Invalid selection.");
    if (isSlotTaken(doctor.id, date, time)) return setError("This time slot is already booked for the selected doctor.");
    setSaving(true);
    try {
      const result = await bookAppointment({ patientId: patient.id, patientName: patient.name, doctorId: doctor.id, doctorName: doctor.name, date, time, purpose: purpose.trim() });
      if (!result.ok) return setError(result.error);
      onBooked();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-neutral-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3">
          <h3 className="text-base font-semibold text-text-primary">Book Appointment</h3>
          <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3 px-5 py-4 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Patient</span>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Doctor</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="input">
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Time Slot</span>
              <select value={time} onChange={(e) => setTime(e.target.value)} className="input">
                <option value="">— Select time —</option>
                {TIME_SLOTS.map((slot) => {
                  const taken = doctorId && date ? isSlotTaken(doctorId, date, slot) : false;
                  return <option key={slot} value={slot} disabled={taken}>{slot}{taken ? " (booked)" : ""}</option>;
                })}
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-medium text-text-secondary">Purpose</span>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Routine sonography" className="input" />
            </label>
          </div>
          {error ? <div className="rounded-md border border-red-light bg-red-light px-3 py-2 text-xs text-red-full">{error}</div> : null}
          <div className="flex justify-end gap-2 border-t border-neutral-border pt-3">
            <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Booking..." : "Book Appointment"}</PrimaryButton>
          </div>
        </form>
      </div>
      <style>{`.input { width:100%; border-radius:0.375rem; border:1px solid var(--neutral-border); background:var(--neutral-surface); padding:0.5rem 0.75rem; font-size:0.875rem; color:var(--text-primary); } .input:focus { outline:none; border-color:var(--teal-full); box-shadow:0 0 0 1px var(--teal-full); }`}</style>
    </div>
  );
}

function EditDialog({
  appt, patients, doctors, onClose, onSaved,
}: {
  appt: Appointment;
  patients: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [patientId, setPatientId] = useState(appt.patientId);
  const [doctorId, setDoctorId] = useState(appt.doctorId);
  const [date, setDate] = useState(appt.date);
  const [time, setTime] = useState(appt.time ?? "");
  const [purpose, setPurpose] = useState(appt.purpose);
  const [status, setStatus] = useState<Appointment["status"]>(appt.status);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!date) return setError("Choose a date.");
    if (!time) return setError("Choose a time slot.");
    if (!purpose.trim()) return setError("Enter a purpose.");
    const slotChanged = date !== appt.date || time !== appt.time || doctorId !== appt.doctorId;
    if (slotChanged && isSlotTaken(doctorId, date, time, appt.id)) return setError("This time slot is already booked.");
    setSaving(true);
    try {
      await updateAppointmentStatus(appt.id, status);
      onSaved();
    } catch {
      setError("Unable to update appointment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-neutral-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3">
          <h3 className="text-base font-semibold text-text-primary">Edit Appointment · {appt.id}</h3>
          <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"><X className="size-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3 px-5 py-4 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Patient</span>
              <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
                {patients.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Doctor</span>
              <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className="input">
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Date</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Time Slot</span>
              <select value={time} onChange={(e) => setTime(e.target.value)} className="input">
                <option value="">— Select time —</option>
                {TIME_SLOTS.map((slot) => {
                  const taken = isSlotTaken(doctorId, date, slot, appt.id);
                  return <option key={slot} value={slot} disabled={taken}>{slot}{taken ? " (booked)" : ""}</option>;
                })}
              </select>
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
              <span className="text-xs font-medium text-text-secondary">Purpose</span>
              <input value={purpose} onChange={(e) => setPurpose(e.target.value)} className="input" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as Appointment["status"])} className="input">
                <option>Confirmed</option>
                <option>Waiting</option>
                <option>In Session</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </label>
          </div>
          {error ? <div className="rounded-md border border-red-light bg-red-light px-3 py-2 text-xs text-red-full">{error}</div> : null}
          <div className="flex justify-end gap-2 border-t border-neutral-border pt-3">
            <GhostButton type="button" onClick={onClose}>Cancel</GhostButton>
            <PrimaryButton type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</PrimaryButton>
          </div>
        </form>
      </div>
      <style>{`.input { width:100%; border-radius:0.375rem; border:1px solid var(--neutral-border); background:var(--neutral-surface); padding:0.5rem 0.75rem; font-size:0.875rem; color:var(--text-primary); } .input:focus { outline:none; border-color:var(--teal-full); box-shadow:0 0 0 1px var(--teal-full); }`}</style>
    </div>
  );
}
