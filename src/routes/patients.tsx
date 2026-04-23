import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { AppShell, Card, StatusPill, PrimaryButton, GhostButton } from "@/components/AppShell";
import { Search, UserPlus, Pencil, X, Filter } from "lucide-react";
import { can, savePatient, useAuth, useEnsureSeed, usePatients, type Patient } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/patients")({
  head: () => ({
    meta: [
      { title: "Patients — Nisarg Women Healthcare" },
      { name: "description", content: "Search and manage patient records by name, ID, or phone." },
    ],
  }),
  component: PatientsPage,
});

type Mode = "create" | "edit" | "view" | null;

interface FormState {
  id?: string;
  name: string;
  age: string;
  gender: "F" | "M" | "Other";
  phone: string;
  address: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
}

const EMPTY: FormState = {
  name: "",
  age: "",
  gender: "F",
  phone: "",
  address: "",
  bloodGroup: "",
  allergies: "",
  medicalHistory: "",
};

function validate(f: FormState): Record<string, string> {
  const e: Record<string, string> = {};
  if (!f.name.trim() || f.name.trim().length < 2) e.name = "Enter full name (min 2 chars).";
  if (f.name.length > 100) e.name = "Name too long.";
  const age = Number(f.age);
  if (!f.age || Number.isNaN(age) || age < 0 || age > 120) e.age = "Enter a valid age (0–120).";
  if (!/^[0-9]{10}$/.test(f.phone.replace(/\s+/g, ""))) e.phone = "Enter a 10-digit phone number.";
  if (f.address.length > 200) e.address = "Address too long.";
  if (f.medicalHistory.length > 1000) e.medicalHistory = "Too long (max 1000 chars).";
  return e;
}

function PatientsPage() {
  useEnsureSeed();
  const auth = useAuth();
  const patients = usePatients();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "F" | "M" | "Other">("all");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [mode, setMode] = useState<Mode>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const canCreate = can(auth?.role, "patient.create");
  const canEdit = can(auth?.role, "patient.edit");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patients.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !p.id.toLowerCase().includes(q) && !p.phone.includes(q)) return false;
      if (genderFilter !== "all" && p.gender !== genderFilter) return false;
      if (ageMin !== "" && p.age < Number(ageMin)) return false;
      if (ageMax !== "" && p.age > Number(ageMax)) return false;
      return true;
    });
  }, [patients, query, genderFilter, ageMin, ageMax]);

  const openCreate = () => {
    setForm(EMPTY);
    setErrors({});
    setMode("create");
  };
  const openEdit = (p: Patient) => {
    setForm({
      id: p.id,
      name: p.name,
      age: String(p.age),
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      bloodGroup: p.bloodGroup,
      allergies: p.allergies,
      medicalHistory: p.medicalHistory,
    });
    setErrors({});
    setMode("edit");
  };
  const openView = (p: Patient) => {
    navigate({ to: "/patient/$patientId", params: { patientId: p.id } });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      await savePatient({
        id: form.id,
        name: form.name.trim(),
        age: Number(form.age),
        gender: form.gender,
        phone: form.phone.replace(/\s+/g, ""),
        address: form.address.trim(),
        bloodGroup: form.bloodGroup.trim(),
        allergies: form.allergies.trim(),
        medicalHistory: form.medicalHistory.trim(),
      });
      toast.success(mode === "create" ? "Patient registered successfully" : "Patient updated successfully");
      setMode(null);
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : "Unable to save patient.",
      });
    } finally {
      setSaving(false);
    }
  };

  const isOpen = mode !== null;
  const isView = mode === "view";

  return (
    <AppShell
      title="Patients"
      subtitle={`${filtered.length} of ${patients.length} records shown`}
      actions={
        canCreate ? (
          <PrimaryButton onClick={openCreate}>
            <UserPlus className="size-4" /> Register Patient
          </PrimaryButton>
        ) : null
      }
    >
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, patient ID, or phone…"
            className="w-full rounded-md border border-neutral-border bg-neutral-surface py-2 pl-9 pr-3 text-sm focus:border-teal-full focus:outline-none focus:ring-1 focus:ring-teal-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-text-tertiary" />
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as typeof genderFilter)}
            className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2 text-sm"
          >
            <option value="all">All genders</option>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="Other">Other</option>
          </select>
          <input
            type="number" min={0} max={120} placeholder="Age min"
            value={ageMin}
            onChange={(e) => setAgeMin(e.target.value)}
            className="w-24 rounded-md border border-neutral-border bg-neutral-surface px-3 py-2 text-sm"
          />
          <span className="text-text-tertiary text-sm">–</span>
          <input
            type="number" min={0} max={120} placeholder="Age max"
            value={ageMax}
            onChange={(e) => setAgeMax(e.target.value)}
            className="w-24 rounded-md border border-neutral-border bg-neutral-surface px-3 py-2 text-sm"
          />
          {(genderFilter !== "all" || ageMin || ageMax) && (
            <button
              onClick={() => { setGenderFilter("all"); setAgeMin(""); setAgeMax(""); }}
              className="text-xs text-teal-full hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
              <th className="px-4 py-3 font-medium">Patient</th>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Age</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">History</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-text-secondary">
                  No patients match your search.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-neutral-canvas">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-red-light text-xs font-semibold text-red-full">
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <span className="font-medium text-text-primary">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{p.id}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{p.age}</td>
                  <td className="px-4 py-3 tabular-nums text-text-secondary">{p.phone}</td>
                  <td className="px-4 py-3 text-text-secondary">
                    <StatusPill tone={p.medicalHistory ? "teal" : "neutral"}>
                      {p.medicalHistory ? p.medicalHistory.slice(0, 24) : "No history"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openView(p)}
                        className="rounded-md border border-neutral-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:border-teal-full hover:text-teal-full transition-colors"
                      >
                        View
                      </button>
                      {canEdit ? (
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-text-secondary hover:bg-neutral-canvas hover:text-teal-full"
                          aria-label="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>

      {isOpen ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink-900/40 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-neutral-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3">
              <h3 className="text-base font-semibold text-text-primary">
                {mode === "create"
                  ? "Register Patient"
                  : mode === "edit"
                    ? `Edit Patient · ${form.id}`
                    : `Patient · ${form.id}`}
              </h3>
              <button
                onClick={() => setMode(null)}
                className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <form
              onSubmit={submit}
              className="grid grid-cols-1 gap-3 px-5 py-4 sm:grid-cols-2 text-sm"
            >
              <Field label="Full name" error={errors.name}>
                <input
                  disabled={isView}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input"
                />
              </Field>
              {mode === "create" && form.name.trim().length > 1 && (
                <>
                  {(() => {
                    const existingWithSimilarName = patients.filter(
                      (p) => p.name.toLowerCase() === form.name.trim().toLowerCase()
                    );
                    return existingWithSimilarName.length > 0 ? (
                      <div className="sm:col-span-2 rounded-md border border-amber-full/30 bg-amber-light px-3 py-2 text-xs text-amber-full">
                        <strong>Patient name already exists:</strong>
                        <div className="mt-1 space-y-1">
                          {existingWithSimilarName.map((p) => (
                            <div key={p.id} className="flex items-center justify-between">
                              <span>{p.name} — {p.id}</span>
                              <button
                                type="button"
                                onClick={() => openEdit(p)}
                                className="text-amber-full hover:underline"
                              >
                                View
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </>
              )}
              <Field label="Age" error={errors.age}>
                <input
                  disabled={isView}
                  type="number"
                  min={0}
                  max={120}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Gender">
                <select
                  disabled={isView}
                  value={form.gender}
                  onChange={(e) =>
                    setForm({ ...form, gender: e.target.value as FormState["gender"] })
                  }
                  className="input"
                >
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Phone (10 digits)" error={errors.phone}>
                <input
                  disabled={isView}
                  inputMode="numeric"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="Blood group">
                <input
                  disabled={isView}
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  placeholder="e.g. O+"
                  className="input"
                />
              </Field>
              <Field label="Allergies">
                <input
                  disabled={isView}
                  value={form.allergies}
                  onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                  placeholder="None"
                  className="input"
                />
              </Field>
              <Field label="Address" error={errors.address} className="sm:col-span-2">
                <input
                  disabled={isView}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="input"
                />
              </Field>
              <Field
                label="Medical history"
                error={errors.medicalHistory}
                className="sm:col-span-2"
              >
                <textarea
                  disabled={isView}
                  value={form.medicalHistory}
                  onChange={(e) => setForm({ ...form, medicalHistory: e.target.value })}
                  rows={4}
                  placeholder="Past conditions, surgeries, medications…"
                  className="input min-h-[88px]"
                />
              </Field>

              {errors.form ? (
                <div className="sm:col-span-2 rounded-md border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">
                  {errors.form}
                </div>
              ) : null}

              <div className="sm:col-span-2 mt-2 flex justify-end gap-2 border-t border-neutral-border pt-3">
                <GhostButton type="button" onClick={() => setMode(null)}>
                  {isView ? "Close" : "Cancel"}
                </GhostButton>
                {!isView ? (
                  <PrimaryButton type="submit" disabled={saving}>
                    {saving ? "Saving..." : mode === "create" ? "Create patient" : "Save changes"}
                  </PrimaryButton>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <style>{`
        .input { width: 100%; border-radius: 0.375rem; border: 1px solid var(--stone-line); background: var(--surface); padding: 0.5rem 0.75rem; font-size: 0.875rem; color: var(--ink-900); }
        .input:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 1px var(--teal); }
        .input:disabled { background: var(--canvas); color: var(--ink-600); }
      `}</style>
    </AppShell>
  );
}

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={"flex flex-col gap-1 " + className}>
      <span className="text-xs font-medium text-text-secondary">{label}</span>
      {children}
      {error ? <span className="text-[11px] text-red-full">{error}</span> : null}
    </label>
  );
}


