import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell, Card, PrimaryButton, GhostButton } from "@/components/AppShell";
import { Phone, Mail, UserPlus, X } from "lucide-react";
import { can, saveDoctor, useAuth, useDoctors, useEnsureSeed } from "@/lib/store";
export const Route = createFileRoute("/doctors")({
  head: () => ({
    meta: [
      { title: "Doctors — Nisarg Women Healthcare" },
      { name: "description", content: "Doctor profiles, specializations, and availability." },
    ],
  }),
  component: DoctorsPage,
});

function DoctorsPage() {
  useEnsureSeed();
  const auth = useAuth();
  const doctors = useDoctors();
  const [open, setOpen] = useState(false);
  const canManage = can(auth?.role, "doctor.manage");

  return (
    <AppShell
      title="Doctors"
      subtitle="Clinic medical staff and consulting hours"
      actions={
        canManage ? (
          <PrimaryButton onClick={() => setOpen(true)}>
            <UserPlus className="size-4" /> Add Doctor
          </PrimaryButton>
        ) : null
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {doctors.map((d) => (
          <Card key={d.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-teal-pale text-base font-semibold text-teal-full">
                  {d.name
                    .split(" ")
                    .slice(1)
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-semibold text-text-primary">{d.name}</div>
                  <div className="text-xs text-text-secondary">{d.specialization}</div>
                </div>
              </div>
            </div>
            <dl className="mt-4 space-y-2 border-t border-neutral-border pt-4 text-sm">
              {d.email ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Mail className="size-3.5 text-text-tertiary" />
                  <span className="text-xs">{d.email}</span>
                </div>
              ) : null}
              {d.phone ? (
                <div className="flex items-center gap-2 text-text-secondary">
                  <Phone className="size-3.5 text-text-tertiary" />
                  <span className="text-xs">{d.phone}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2 text-text-secondary">
                <Mail className="size-3.5 text-text-tertiary" />
                <span className="font-mono text-xs">{d.id}</span>
              </div>
            </dl>
          </Card>
        ))}
      </div>
      {open ? <AddDoctorDialog onClose={() => setOpen(false)} /> : null}
    </AppShell>
  );
}

function AddDoctorDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [specialization, setSpecialization] = useState("Gynecologist");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = name.trim();
    if (n.length < 3) return setError("Enter doctor's full name (min 3 chars).");
    if (n.length > 80) return setError("Name too long.");
    if (!specialization.trim()) return setError("Specialization is required.");
    if (username.trim().length < 3) return setError("Username must be at least 3 characters.");
    if (password.trim().length < 6) return setError("Password must be at least 6 characters.");
    const finalName = /^dr\.?/i.test(n) ? n : `Dr. ${n}`;
    setSaving(true);
    try {
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      const doctor = await saveDoctor({ 
        name: finalName, 
        specialization: specialization.trim(),
        username: trimmedUsername,
        password: trimmedPassword 
      });
      setCredentials({
        username: trimmedUsername,
        password: trimmedPassword,
      });
      setName("");
      setSpecialization("Gynecologist");
      setUsername("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save doctor.");
    } finally {
      setSaving(false);
    }
  };

  if (credentials) {
    return (
      <div className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/40 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-lg bg-neutral-surface shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3">
            <h3 className="text-base font-semibold text-text-primary">Doctor Added Successfully</h3>
            <button
              onClick={onClose}
              className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="space-y-4 px-5 py-4 text-sm">
            <p className="text-text-secondary">
              The doctor account has been created. Share these login credentials:
            </p>
            <div className="rounded-md bg-neutral-canvas p-3 font-mono text-xs">
              <div className="mb-2">
                <span className="text-text-secondary">Username: </span>
                <strong className="text-text-primary">{credentials.username}</strong>
              </div>
              <div>
                <span className="text-text-secondary">Password: </span>
                <strong className="text-text-primary">{credentials.password}</strong>
              </div>
            </div>
            <p className="text-[11px] text-text-tertiary">
              The doctor should change their password after first login. Please save these credentials securely.
            </p>
            <div className="flex justify-end gap-2 border-t border-neutral-border pt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Username: ${credentials.username}\nPassword: ${credentials.password}`
                  );
                }}
                className="rounded border border-neutral-border px-3 py-1.5 text-xs font-medium hover:border-teal-full hover:text-teal-full"
              >
                Copy credentials
              </button>
              <PrimaryButton onClick={onClose}>Done</PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-text-primary/40 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-lg bg-neutral-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3">
          <h3 className="text-base font-semibold text-text-primary">Add Doctor</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-secondary hover:bg-neutral-canvas"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3 px-5 py-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Full name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sneha Patil"
              className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Specialization</span>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
            >
              <option>Gynecologist</option>
              <option>Obstetrician</option>
              <option>Sonologist</option>
              <option>Anesthesiologist</option>
              <option>General Physician</option>
              <option>Pediatrician</option>
              <option>Other</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Username</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. sneha_patil"
              className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-text-secondary">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
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
              {saving ? "Adding..." : "Add Doctor"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}


