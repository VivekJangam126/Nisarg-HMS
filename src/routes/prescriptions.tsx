import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell, Card, StatusPill, PrimaryButton, GhostButton } from "@/components/AppShell";
import { Plus, Printer, FileText, Trash2, X } from "lucide-react";
import {
  can,
  MEDICINES,
  savePrescription,
  useAuth,
  useDoctors,
  useEnsureSeed,
  usePatients,
  usePrescriptions,
  type Prescription,
  type PrescriptionMed,
} from "@/lib/store";

export const Route = createFileRoute("/prescriptions")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Prescriptions — Nisarg Women Healthcare" },
      {
        name: "description",
        content: "Digital prescriptions, printable PDFs, and reusable templates.",
      },
    ],
  }),
  component: PrescriptionsPage,
});

const TEMPLATES: { name: string; diagnosis: string; meds: PrescriptionMed[] }[] = [
  {
    name: "PCOS — Standard",
    diagnosis: "Polycystic Ovary Syndrome",
    meds: [
      { name: "Metformin 500mg", dosage: "1 tab BD", duration: "30 days" },
      { name: "Myo-Inositol Sachet", dosage: "1 sachet OD", duration: "30 days" },
    ],
  },
  {
    name: "Antenatal — Trimester 2",
    diagnosis: "Antenatal care — 2nd trimester",
    meds: [
      { name: "Iron + Folic Acid (Orofer XT)", dosage: "1 tab BD", duration: "30 days" },
      { name: "Calcium + Vitamin D3", dosage: "1 tab OD", duration: "30 days" },
    ],
  },
  {
    name: "Iron Deficiency",
    diagnosis: "Iron deficiency anaemia",
    meds: [
      { name: "Iron + Folic Acid (Orofer XT)", dosage: "1 tab BD", duration: "60 days" },
      { name: "Vitamin B12", dosage: "1 tab OD", duration: "30 days" },
    ],
  },
];

function PrescriptionsPage() {
  useEnsureSeed();
  const auth = useAuth();
  const list = usePrescriptions();
  const patients = usePatients();
  const doctors = useDoctors();
  const { patientId: preselectedPatientId } = Route.useSearch();
  const [open, setOpen] = useState(!!preselectedPatientId);
  const [seed, setSeed] = useState<{ diagnosis: string; meds: PrescriptionMed[] } | null>(null);
  const [preview, setPreview] = useState<Prescription | null>(null);

  const canCreate = can(auth?.role, "prescription.create") || auth?.role === "admin";
  const recent = useMemo(() => list.slice(0, 25), [list]);

  return (
    <AppShell
      title="Prescriptions"
      subtitle="Recent digital prescriptions. Each is printable and exportable as PDF."
      actions={
        canCreate ? (
          <PrimaryButton
            onClick={() => {
              setSeed(null);
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> New Prescription
          </PrimaryButton>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 space-y-3">
          {recent.length === 0 ? (
            <Card className="p-10 text-center text-sm text-text-secondary">
              No prescriptions yet. Click <strong>New Prescription</strong> to create one.
            </Card>
          ) : (
            recent.map((r) => (
              <Card key={r.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/patient/$patientId"
                        params={{ patientId: r.patientId }}
                        className="text-base font-semibold text-text-primary hover:text-teal-full hover:underline"
                      >
                        {r.patientName}
                      </Link>
                      <span className="font-mono text-xs text-text-tertiary">{r.patientId}</span>
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">{r.diagnosis}</p>
                    <p className="text-[11px] text-text-tertiary">{r.doctorName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-tertiary">{r.id}</span>
                    <StatusPill tone="teal">
                      {new Date(r.date).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </StatusPill>
                  </div>
                </div>
                <div className="mt-4 rounded-md border border-neutral-border bg-neutral-canvas p-3 text-sm">
                  <div className="text-[11px] font-medium uppercase tracking-wide text-text-secondary">
                    Medications
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-text-primary">
                    {r.meds.map((m, i) => (
                      <li key={i} className="flex items-baseline gap-2">
                        <span className="size-1 rounded-full bg-teal" />
                        <span>
                          <strong>{m.name}</strong> — {m.dosage}
                          {m.frequency ? ` · ${m.frequency}x daily` : ""}
                          {m.timing ? ` · ${m.timing}` : ""}
                          {m.duration ? ` · ${m.duration}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-3 flex gap-2 text-xs">
                  <button
                    onClick={() => setPreview(r)}
                    className="inline-flex items-center gap-1.5 rounded border border-neutral-border px-3 py-1.5 font-medium hover:border-teal hover:text-teal-full"
                  >
                    <Printer className="size-3.5" /> Print
                  </button>
                </div>
              </Card>
            ))
          )}
        </section>

        <aside>
          <h3 className="mb-3 text-base font-semibold text-text-primary">Templates</h3>
          <Card className="divide-y divide-stone-line">
            {TEMPLATES.map((t) => (
              <button
                key={t.name}
                onClick={() => {
                  setSeed({ diagnosis: t.diagnosis, meds: t.meds.map((m) => ({ ...m })) });
                  setOpen(true);
                }}
                disabled={!canCreate}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-text-primary transition-colors hover:bg-neutral-canvas hover:text-teal-full disabled:opacity-50"
              >
                <span className="flex items-center gap-2">
                  <FileText className="size-4 text-text-tertiary" />
                  {t.name}
                </span>
                <span className="text-text-tertiary">›</span>
              </button>
            ))}
          </Card>
        </aside>
      </div>

      {open ? (
        <NewPrescriptionDialog
          patients={patients}
          doctors={doctors}
          defaultDoctorId={
            auth?.role === "doctor" ? doctors.find((d) => d.name === auth.name)?.id : undefined
          }
          defaultPatientId={preselectedPatientId}
          seed={seed}
          onClose={() => setOpen(false)}
          onSaved={(rx) => {
            setOpen(false);
            setPreview(rx);
          }}
        />
      ) : null}
      {preview ? <PrescriptionPreview rx={preview} onClose={() => setPreview(null)} /> : null}
    </AppShell>
  );
}

function NewPrescriptionDialog({
  patients,
  doctors,
  defaultDoctorId,
  defaultPatientId,
  seed,
  onClose,
  onSaved,
}: {
  patients: { id: string; name: string }[];
  doctors: { id: string; name: string }[];
  defaultDoctorId?: string;
  defaultPatientId?: string;
  seed: { diagnosis: string; meds: PrescriptionMed[] } | null;
  onClose: () => void;
  onSaved: (rx: Prescription) => void;
}) {
  const [patientId, setPatientId] = useState(defaultPatientId ?? patients[0]?.id ?? "");
  const [doctorId, setDoctorId] = useState(defaultDoctorId ?? doctors[0]?.id ?? "");
  const [diagnosis, setDiagnosis] = useState(seed?.diagnosis ?? "");
  const [meds, setMeds] = useState<PrescriptionMed[]>(
    seed?.meds ?? [{ name: "", dosage: "", duration: "" }],
  );
  const [advice, setAdvice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateMed = (i: number, patch: Partial<PrescriptionMed>) =>
    setMeds(meds.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  const addMed = () => setMeds([...meds, { name: "", dosage: "", duration: "" }]);
  const removeMed = (i: number) =>
    setMeds(meds.length > 1 ? meds.filter((_, idx) => idx !== i) : meds);

  const onPickMedicine = (i: number, name: string) => {
    const found = MEDICINES.find((m) => m.name === name);
    updateMed(i, { name, dosage: meds[i].dosage || found?.defaultDosage || "" });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const patient = patients.find((p) => p.id === patientId);
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!patient) return setError("Select a patient.");
    if (!doctor) return setError("Select a doctor.");
    if (!diagnosis.trim()) return setError("Enter a diagnosis.");
    if (diagnosis.length > 200) return setError("Diagnosis too long.");
    const valid = meds.filter((m) => m.name.trim() && m.dosage.trim());
    if (valid.length === 0) return setError("Add at least one medicine with dosage.");
    setSaving(true);
    try {
      const rx = await savePrescription({
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        diagnosis: diagnosis.trim(),
        meds: valid,
        advice: advice.trim() || undefined,
      });
      onSaved(rx);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save prescription.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink-900/40 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-neutral-surface shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-border bg-neutral-surface px-5 py-3">
          <h3 className="text-base font-semibold text-text-primary">New Prescription</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4 px-5 py-4 text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Patient</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Doctor</span>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Diagnosis</span>
            <input
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. PCOS with iron deficiency"
              className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
            />
          </label>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">Medicines</span>
              <button
                type="button"
                onClick={addMed}
                className="inline-flex items-center gap-1 text-xs font-medium text-teal-full hover:underline"
              >
                <Plus className="size-3.5" /> Add medicine
              </button>
            </div>
            <datalist id="medicines-list">
              {MEDICINES.map((m) => (
                <option key={m.name} value={m.name} />
              ))}
            </datalist>
            <div className="space-y-3">
              {meds.map((m, i) => (
                <div
                  key={i}
                  className="rounded-md border border-neutral-border bg-neutral-canvas p-3"
                >
                  <div className="grid grid-cols-12 gap-2 mb-2">
                    <input
                      list="medicines-list"
                      value={m.name}
                      onChange={(e) => onPickMedicine(i, e.target.value)}
                      placeholder="Medicine name"
                      className="col-span-12 rounded border border-neutral-border bg-neutral-surface px-2 py-1.5 sm:col-span-5"
                    />
                    <input
                      value={m.dosage}
                      onChange={(e) => updateMed(i, { dosage: e.target.value })}
                      placeholder="Dosage (e.g. 1 tab)"
                      className="col-span-7 rounded border border-neutral-border bg-neutral-surface px-2 py-1.5 sm:col-span-3"
                    />
                    <input
                      value={m.duration}
                      onChange={(e) => updateMed(i, { duration: e.target.value })}
                      placeholder="Duration"
                      className="col-span-4 rounded border border-neutral-border bg-neutral-surface px-2 py-1.5 sm:col-span-3"
                    />
                    <button
                      type="button"
                      onClick={() => removeMed(i)}
                      className="col-span-1 flex items-center justify-center text-text-tertiary hover:text-red-full"
                      aria-label="Remove"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <label className="flex flex-col gap-1">
                      <span className="text-[11px] font-medium text-text-secondary">Frequency</span>
                      <select
                        value={m.frequency || ""}
                        onChange={(e) => updateMed(i, { frequency: e.target.value ? Number(e.target.value) as 1|2|3|4|5 : undefined })}
                        className="rounded border border-neutral-border bg-neutral-surface px-2 py-1 text-xs"
                      >
                        <option value="">—</option>
                        <option value="1">Once daily</option>
                        <option value="2">Twice daily</option>
                        <option value="3">Thrice daily</option>
                        <option value="4">4 times daily</option>
                        <option value="5">5 times daily</option>
                      </select>
                    </label>
                    <label className="flex flex-col gap-1 sm:col-span-2">
                      <span className="text-[11px] font-medium text-text-secondary">Timing</span>
                      <select
                        value={m.timing || ""}
                        onChange={(e) => updateMed(i, { timing: e.target.value as "before eating" | "after eating" | "anytime" | undefined })}
                        className="rounded border border-neutral-border bg-neutral-surface px-2 py-1 text-xs"
                      >
                        <option value="">Anytime</option>
                        <option value="before eating">Before eating</option>
                        <option value="after eating">After eating</option>
                      </select>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-text-tertiary">
              Start typing to search the medicine catalog or enter custom names. Set frequency and timing for each medicine.
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Advice / follow-up</span>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              rows={2}
              maxLength={500}
              className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
            />
          </label>

          {error ? (
            <div className="rounded-md border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-neutral-border pt-3">
            <GhostButton type="button" onClick={onClose}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Prescription"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

function PrescriptionPreview({ rx, onClose }: { rx: Prescription; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink-900/50 p-4 print:static print:bg-transparent print:p-0">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-neutral-surface shadow-xl print:shadow-none print:max-w-full">
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3 print:hidden">
          <h3 className="text-base font-semibold text-text-primary">Prescription · {rx.id}</h3>
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </PrimaryButton>
            <button
              onClick={onClose}
              className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"
              aria-label="Close"
            >
              <X className="size-4" />
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
                      {m.dosage}
                      {m.duration ? ` · ${m.duration}` : ""}
                      {m.notes ? ` · ${m.notes}` : ""}
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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .fixed, .fixed * { visibility: visible; }
          .fixed { position: absolute; inset: 0; }
        }
      `}</style>
    </div>
  );
}


