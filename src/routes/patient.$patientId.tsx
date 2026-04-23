import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell, Card, StatusPill, PrimaryButton, GhostButton } from "@/components/AppShell";
import {
  ArrowLeft,
  FileText,
  Receipt,
  FlaskConical,
  CalendarDays,
  StickyNote,
  Trash2,
  Plus,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAppointments,
  useAuth,
  useBills,
  useEnsureSeed,
  useLabReports,
  useNotes,
  usePatient,
  usePrescriptions,
  saveNote,
  deleteNote,
  can,
  updateAppointmentStatus,
  updateBillStatus,
  type Appointment,
} from "@/lib/store";

export const Route = createFileRoute("/patient/$patientId")({
  head: ({ params }) => ({
    meta: [
      { title: `Patient ${params.patientId} — Nisarg Women Healthcare` },
      { name: "description", content: "Patient profile with full medical history." },
    ],
  }),
  component: PatientProfilePage,
});

type Tab = "overview" | "appointments" | "prescriptions" | "bills" | "reports" | "notes";

function PatientProfilePage() {
  useEnsureSeed();
  const { patientId } = Route.useParams();
  const navigate = useNavigate();
  const auth = useAuth();
  const patient = usePatient(patientId);
  const allAppts = useAppointments();
  const allRx = usePrescriptions();
  const allBills = useBills();
  const allLabs = useLabReports();
  const allNotes = useNotes();
  const [tab, setTab] = useState<Tab>("overview");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rxPreview, setRxPreview] = useState<any>(null);

  const bookAppointment = () =>
    navigate({ to: "/appointments", search: { patientId: patient?.id ?? "", patientName: patient?.name ?? "" } as never });
  const createBill = () =>
    navigate({ to: "/billing", search: { patientId: patient?.id ?? "", patientName: patient?.name ?? "" } as never });
  const addPrescription = () =>
    navigate({ to: "/prescriptions", search: { patientId: patient?.id ?? "", patientName: patient?.name ?? "" } as never });

  const appts = useMemo(
    () =>
      allAppts
        .filter((a) => a.patientId === patientId)
        .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [allAppts, patientId],
  );
  const rx = useMemo(() => allRx.filter((r) => r.patientId === patientId), [allRx, patientId]);
  const bills = useMemo(
    () => allBills.filter((b) => b.patientId === patientId),
    [allBills, patientId],
  );
  const labs = useMemo(
    () => allLabs.filter((l) => l.patientId === patientId),
    [allLabs, patientId],
  );
  const notes = useMemo(
    () => allNotes.filter((n) => n.patientId === patientId),
    [allNotes, patientId],
  );

  if (!patient) {
    return (
      <AppShell title="Patient not found" subtitle={`No record for ${patientId}`}>
        <Card className="p-8 text-center">
          <p className="text-sm text-text-secondary">This patient could not be located.</p>
          <div className="mt-4">
            <GhostButton onClick={() => navigate({ to: "/patients" })}>
              <ArrowLeft className="size-4" /> Back to patients
            </GhostButton>
          </div>
        </Card>
      </AppShell>
    );
  }

  const tabs: { id: Tab; label: string; count?: number; icon: typeof FileText }[] = [
    { id: "overview", label: "Overview", icon: StickyNote },
    { id: "appointments", label: "Appointments", count: appts.length, icon: CalendarDays },
    { id: "prescriptions", label: "Prescriptions", count: rx.length, icon: FileText },
    { id: "bills", label: "Bills", count: bills.length, icon: Receipt },
    { id: "reports", label: "Lab Reports", count: labs.length, icon: FlaskConical },
    { id: "notes", label: "Doctor Notes", count: notes.length, icon: StickyNote },
  ];

  return (
    <AppShell
      title={patient.name}
      subtitle={`${patient.id} · ${patient.age}y · ${patient.gender} · ${patient.phone}`}
      actions={
        <div className="flex gap-2">
          <GhostButton onClick={bookAppointment}>
            <CalendarDays className="size-4" /> Book Appointment
          </GhostButton>
          <GhostButton onClick={createBill}>
            <Receipt className="size-4" /> Create Bill
          </GhostButton>
          <GhostButton onClick={addPrescription}>
            <FileText className="size-4" /> Add Prescription
          </GhostButton>
          <Link
            to="/patients"
            className="inline-flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-surface px-4 py-2 text-sm font-medium text-text-primary hover:border-teal hover:text-teal-full"
          >
            <ArrowLeft className="size-4" /> All patients
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <Card className="p-5 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-light text-lg font-semibold text-red-full">
              {patient.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div className="mt-3 text-base font-semibold text-text-primary">{patient.name}</div>
            <div className="font-mono text-xs text-text-secondary">{patient.id}</div>
          </div>
          <dl className="mt-5 space-y-2 border-t border-neutral-border pt-4 text-xs">
            <Info k="Age" v={`${patient.age} years`} />
            <Info k="Gender" v={patient.gender} />
            <Info k="Phone" v={patient.phone} />
            <Info k="Blood group" v={patient.bloodGroup || "—"} />
            <Info k="Allergies" v={patient.allergies || "None"} />
            <Info k="Address" v={patient.address || "—"} />
            <Info k="Registered" v={new Date(patient.createdAt).toLocaleDateString("en-IN")} />
          </dl>
          <div className="mt-4 border-t border-neutral-border pt-4 text-xs">
            <div className="font-medium uppercase tracking-wide text-text-secondary">Medical history</div>
            <p className="mt-1.5 whitespace-pre-wrap text-text-primary">
              {patient.medicalHistory || "No history recorded."}
            </p>
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="flex flex-wrap gap-1 p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors " +
                  (tab === t.id ? "bg-teal-full text-white" : "text-text-secondary hover:bg-neutral-canvas")
                }
              >
                <t.icon className="size-4" />
                {t.label}
                {typeof t.count === "number" ? (
                  <span
                    className={
                      "rounded-full px-1.5 text-[10px] " +
                      (tab === t.id ? "bg-white/20 text-white" : "bg-neutral-canvas text-text-secondary")
                    }
                  >
                    {t.count}
                  </span>
                ) : null}
              </button>
            ))}
          </Card>

          {tab === "overview" ? (
            <OverviewPanel
              rxCount={rx.length}
              apptCount={appts.length}
              billCount={bills.length}
              labCount={labs.length}
            />
          ) : null}
          {tab === "appointments" ? <AppointmentsPanel rows={appts} canUpdate={can(auth?.role, "appointment.cancel") || auth?.role === "doctor"} /> : null}
          {tab === "prescriptions" ? <PrescriptionsPanel rows={rx} onPrint={(r) => setRxPreview(r)} /> : null}
          {tab === "bills" ? <BillsPanel rows={bills} canUpdate={can(auth?.role, "billing.create")} /> : null}
          {tab === "reports" ? <ReportsPanel rows={labs} /> : null}
          {tab === "notes" ? (
            <NotesPanel
              patientId={patientId}
              notes={notes}
              canWrite={can(auth?.role, "prescription.create") || auth?.role === "admin"}
              doctorId={auth?.id || "U-?"}
              doctorName={auth?.name || "Doctor"}
              onDeleteConfirm={(id) => setConfirmDelete(id)}
            />
          ) : null}
        </div>
      </div>

      {confirmDelete ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-neutral-surface shadow-xl">
            <div className="px-5 py-4">
              <p className="text-sm text-text-primary">Are you sure you want to delete this note? This cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-2 border-t border-neutral-border px-5 py-3">
              <GhostButton onClick={() => setConfirmDelete(null)}>Cancel</GhostButton>
              <button
                onClick={() => {
                  void deleteNote(confirmDelete);
                  toast.success("Note deleted");
                  setConfirmDelete(null);
                }}
                className="inline-flex items-center gap-2 rounded-md bg-red-full px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rxPreview ? <PrescriptionPreview rx={rxPreview} onClose={() => setRxPreview(null)} /> : null}
    </AppShell>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-secondary">{k}</dt>
      <dd className="text-right font-medium text-text-primary">{v}</dd>
    </div>
  );
}

function Empty({ msg }: { msg: string }) {
  return <Card className="p-8 text-center text-sm text-text-secondary">{msg}</Card>;
}

function OverviewPanel({
  rxCount,
  apptCount,
  billCount,
  labCount,
}: {
  rxCount: number;
  apptCount: number;
  billCount: number;
  labCount: number;
}) {
  const items = [
    { label: "Appointments", value: apptCount, icon: CalendarDays },
    { label: "Prescriptions", value: rxCount, icon: FileText },
    { label: "Bills", value: billCount, icon: Receipt },
    { label: "Lab reports", value: labCount, icon: FlaskConical },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((i) => (
        <Card key={i.label} className="p-4">
          <i.icon className="size-4 text-teal-full" />
          <div className="mt-2 text-2xl font-semibold tabular-nums text-text-primary">{i.value}</div>
          <div className="text-xs text-text-secondary">{i.label}</div>
        </Card>
      ))}
    </div>
  );
}

function AppointmentsPanel({ rows, canUpdate }: { rows: ReturnType<typeof useAppointments>; canUpdate: boolean }) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: Appointment["status"]) => {
    setUpdating(id);
    try {
      await updateAppointmentStatus(id, status);
      toast.success(`Appointment marked as ${status}`);
    } catch {
      toast.error("Failed to update appointment");
    } finally {
      setUpdating(null);
    }
  };

  if (rows.length === 0) return <Empty msg="No appointments yet." />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Doctor</th>
            <th className="px-4 py-3 font-medium">Purpose</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canUpdate ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-neutral-canvas">
              <td className="px-4 py-2.5 tabular-nums text-text-primary">{a.date}</td>
              <td className="px-4 py-2.5 tabular-nums text-text-secondary">{a.time}</td>
              <td className="px-4 py-2.5 text-text-secondary">{a.doctorName}</td>
              <td className="px-4 py-2.5 text-text-secondary">{a.purpose}</td>
              <td className="px-4 py-2.5">
                <StatusPill tone={a.status === "Completed" ? "sage" : a.status === "Cancelled" ? "danger" : "teal"}>
                  {a.status}
                </StatusPill>
              </td>
              {canUpdate ? (
                <td className="px-4 py-2.5 text-right">
                  <div className="inline-flex gap-1">
                    {a.status === "Confirmed" || a.status === "Waiting" ? (
                      <button
                        onClick={() => void handleStatusUpdate(a.id, "In Session")}
                        disabled={updating === a.id}
                        className="rounded border border-neutral-border px-2 py-1 text-xs text-text-secondary hover:border-teal-full hover:text-teal-full disabled:opacity-50"
                      >
                        Start
                      </button>
                    ) : null}
                    {a.status !== "Completed" && a.status !== "Cancelled" ? (
                      <button
                        onClick={() => void handleStatusUpdate(a.id, "Completed")}
                        disabled={updating === a.id}
                        className="rounded border border-neutral-border px-2 py-1 text-xs text-text-secondary hover:border-teal-full hover:text-teal-full disabled:opacity-50"
                      >
                        Complete
                      </button>
                    ) : null}
                  </div>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function PrescriptionsPanel({ rows, onPrint }: { rows: ReturnType<typeof usePrescriptions>; onPrint: (rx: any) => void }) {
  if (rows.length === 0) return <Empty msg="No prescriptions issued yet." />;
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <Card key={r.id} className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-text-primary">{r.diagnosis}</div>
              <div className="text-xs text-text-secondary">
                {r.doctorName} · {new Date(r.date).toLocaleString("en-IN")}
              </div>
            </div>
            <span className="font-mono text-xs text-text-tertiary">{r.id}</span>
          </div>
          <ul className="mt-3 space-y-1 rounded-md border border-neutral-border bg-neutral-canvas p-3 text-sm">
            {r.meds.map((m, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span className="size-1 shrink-0 rounded-full bg-teal" />
                <span className="text-text-primary">
                  <strong>{m.name}</strong> — {m.dosage}
                  {m.frequency ? ` · ${m.frequency}x daily` : ""}
                  {m.timing ? ` · ${m.timing}` : ""}
                  {m.duration ? ` · ${m.duration}` : ""}
                  {m.notes ? ` · ${m.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {r.advice ? (
            <p className="mt-2 text-xs text-text-secondary">
              <strong>Advice:</strong> {r.advice}
            </p>
          ) : null}
          <div className="mt-3">
            <button
              onClick={() => onPrint(r)}
              className="inline-flex items-center gap-1.5 rounded border border-neutral-border px-3 py-1.5 text-xs font-medium hover:border-teal hover:text-teal-full"
            >
              <Printer className="size-3.5" /> Print
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function BillsPanel({ rows, canUpdate }: { rows: ReturnType<typeof useBills>; canUpdate: boolean }) {
  const [updating, setUpdating] = useState<string | null>(null);

  const handleMarkPaid = async (id: string) => {
    setUpdating(id);
    try {
      await updateBillStatus(id, "Paid");
      toast.success("Bill marked as paid");
    } catch {
      toast.error("Failed to update bill");
    } finally {
      setUpdating(null);
    }
  };

  if (rows.length === 0) return <Empty msg="No bills issued yet." />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
            <th className="px-4 py-3 font-medium">Bill</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Mode</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            {canUpdate ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-border">
          {rows.map((b) => (
            <tr key={b.id} className="hover:bg-neutral-canvas">
              <td className="px-4 py-2.5 font-mono text-xs text-text-secondary">{b.id}</td>
              <td className="px-4 py-2.5 text-text-secondary">{new Date(b.date).toLocaleDateString("en-IN")}</td>
              <td className="px-4 py-2.5 text-text-secondary">{b.paymentMode}</td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums text-text-primary">₹{b.total.toLocaleString("en-IN")}</td>
              <td className="px-4 py-2.5">
                <StatusPill tone={b.status === "Paid" ? "sage" : "rose"}>{b.status}</StatusPill>
              </td>
              {canUpdate ? (
                <td className="px-4 py-2.5 text-right">
                  {b.status === "Pending" ? (
                    <button
                      onClick={() => void handleMarkPaid(b.id)}
                      disabled={updating === b.id}
                      className="rounded border border-teal-full px-2 py-1 text-xs text-teal-full hover:bg-teal-pale disabled:opacity-50"
                    >
                      {updating === b.id ? "Updating..." : "Mark Paid"}
                    </button>
                  ) : null}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ReportsPanel({ rows }: { rows: ReturnType<typeof useLabReports> }) {
  if (rows.length === 0) return <Empty msg="No lab reports uploaded yet." />;
  return (
    <Card className="divide-y divide-stone-line">
      {rows.map((r) => (
        <div key={r.id} className="flex items-center gap-3 px-4 py-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-teal-pale text-teal-full">
            <FlaskConical className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-text-primary">{r.name}</div>
            <div className="font-mono text-xs text-text-secondary">
              {r.type} · {r.fileName} · {(r.fileSize / 1024).toFixed(0)} KB
            </div>
          </div>
          <div className="text-xs text-text-secondary">{r.date}</div>
          {r.downloadUrl ? (
            <a
              href={r.downloadUrl}
              download={r.fileName}
              className="rounded border border-neutral-border px-2 py-1 text-xs text-text-secondary hover:border-teal hover:text-teal-full"
            >
              Download
            </a>
          ) : null}
        </div>
      ))}
    </Card>
  );
}

function NotesPanel({
  patientId,
  notes,
  canWrite,
  doctorId,
  doctorName,
  onDeleteConfirm,
}: {
  patientId: string;
  notes: ReturnType<typeof useNotes>;
  canWrite: boolean;
  doctorId: string;
  doctorName: string;
  onDeleteConfirm: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const t = text.trim();
    if (!t || t.length > 2000) return;
    setSaving(true);
    try {
      await saveNote({ patientId, doctorId, doctorName, text: t });
      setText("");
      toast.success("Note saved");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save note.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-3">
      {canWrite ? (
        <Card className="p-4">
          <form onSubmit={submit} className="space-y-2">
            <label className="text-xs font-medium text-text-secondary">Add a clinical note</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Observations, follow-up plan, allergies noted today…"
              className="w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2 text-sm focus:border-teal-full focus:outline-none focus:ring-1 focus:ring-teal-full"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-text-tertiary">
                {text.length}/2000 · saved as {doctorName}
              </span>
              <PrimaryButton type="submit" disabled={!text.trim() || saving}>
                <Plus className="size-4" /> {saving ? "Saving..." : "Save note"}
              </PrimaryButton>
            </div>
            {error ? (
              <div className="rounded-md border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">
                {error}
              </div>
            ) : null}
          </form>
        </Card>
      ) : null}

      {notes.length === 0 ? (
        <Empty msg="No notes recorded yet." />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-text-primary">{n.doctorName}</div>
                  <div className="text-[11px] text-text-secondary">
                    {new Date(n.createdAt).toLocaleString("en-IN")}
                  </div>
                </div>
                {canWrite ? (
                  <button
                    onClick={() => onDeleteConfirm(n.id)}
                    className="rounded p-1 text-text-tertiary hover:text-red-full"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">{n.text}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



function PrescriptionPreview({ rx, onClose }: { rx: ReturnType<typeof usePrescriptions>[number]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4 print:static print:bg-transparent print:p-0">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-neutral-surface shadow-xl print:shadow-none print:max-w-full">
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3 print:hidden">
          <h3 className="text-base font-semibold text-text-primary">Prescription · {rx.id}</h3>
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </PrimaryButton>
            <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-neutral-canvas" aria-label="Close">
              <ArrowLeft className="size-4 rotate-180" />
            </button>
          </div>
        </div>
        <div className="px-8 py-8 text-sm text-text-primary">
          <div className="flex items-start justify-between border-b border-neutral-border pb-4">
            <div>
              <div className="text-lg font-semibold">Nisarg Women Healthcare</div>
              <div className="text-xs text-text-secondary">{rx.doctorName}</div>
            </div>
            <div className="text-right text-xs">
              <div className="font-mono">{rx.id}</div>
              <div className="text-text-secondary">{new Date(rx.date).toLocaleString("en-IN")}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-text-secondary">Patient</div>
              <div className="font-medium">{rx.patientName}</div>
              <div className="font-mono text-text-secondary">{rx.patientId}</div>
            </div>
            <div className="text-right">
              <div className="text-text-secondary">Diagnosis</div>
              <div className="font-medium">{rx.diagnosis}</div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">Rx</div>
            <ol className="mt-2 space-y-1.5">
              {rx.meds.map((m, i) => (
                <li key={i} className="flex gap-3 border-b border-neutral-border/60 pb-1.5">
                  <span className="w-6 text-right tabular-nums text-text-tertiary">{i + 1}.</span>
                  <div>
                    <div className="font-medium">{m.name}</div>
                    <div className="text-xs text-text-secondary">
                      {m.dosage}{m.duration ? ` · ${m.duration}` : ""}{m.notes ? ` · ${m.notes}` : ""}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          {rx.advice ? (
            <div className="mt-6 text-xs">
              <div className="font-medium uppercase tracking-wide text-text-secondary">Advice</div>
              <p className="mt-1 whitespace-pre-wrap">{rx.advice}</p>
            </div>
          ) : null}
          <p className="mt-12 text-right text-xs text-text-secondary">— {rx.doctorName}</p>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } .fixed, .fixed * { visibility: visible; } .fixed { position: absolute; inset: 0; } }`}</style>
    </div>
  );
}
