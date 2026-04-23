import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell, Card, PrimaryButton, GhostButton, StatusPill } from "@/components/AppShell";
import {
  Building2,
  FileText,
  CalendarDays,
  Receipt,
  HardDriveDownload,
  Users,
  ShieldCheck,
} from "lucide-react";
import {
  backupNow,
  saveSettings,
  useLastBackup,
  useSettings,
  type ClinicSettings,
} from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings - Nisarg Women Healthcare" },
      {
        name: "description",
        content: "Configure clinic profile, prescriptions, billing, backups and users.",
      },
    ],
  }),
  component: SettingsPage,
});

const tabs = [
  { label: "Clinic Profile", icon: Building2 },
  { label: "Prescription Template", icon: FileText },
  { label: "Appointments", icon: CalendarDays },
  { label: "Billing", icon: Receipt },
  { label: "Backup & Restore", icon: HardDriveDownload },
  { label: "User Accounts", icon: Users },
  { label: "Security", icon: ShieldCheck },
];

function SettingsPage() {
  const settings = useSettings();
  const lastBackup = useLastBackup();
  const [activeTab, setActiveTab] = useState("Clinic Profile");
  const [form, setForm] = useState<ClinicSettings>(settings);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const patch = <K extends keyof ClinicSettings>(key: K, value: ClinicSettings[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const doSave = async () => {
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      await saveSettings(form);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await doSave();
  };

  const runBackup = async () => {
    setError(null);
    setMessage(null);
    setBackingUp(true);
    try {
      const backup = await backupNow();
      setMessage(`Backup created: ${backup.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create backup.");
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <AppShell title="Settings" subtitle="Admin-only clinic configuration">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <Card className="self-start p-2">
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setActiveTab(t.label)}
              className={
                "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
                (activeTab === t.label
                  ? "bg-teal-pale text-teal-full"
                  : "text-text-secondary hover:bg-neutral-canvas hover:text-text-primary")
              }
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </Card>

        <Card className="p-6">
          {activeTab === "Clinic Profile" ? (
          <form onSubmit={submit}>
            <h3 className="text-base font-semibold text-text-primary">Clinic Profile</h3>
            <p className="mt-1 text-xs text-text-secondary">
              Used on prescriptions, receipts, and printed reports.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-text-secondary">Clinic name</span>
                <input
                  value={form.clinicName}
                  onChange={(e) => patch("clinicName", e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-text-secondary">
                  Doctor name on prescription
                </span>
                <input
                  value={form.doctorName}
                  onChange={(e) => patch("doctorName", e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-text-secondary">Address</span>
                <textarea
                  value={form.address}
                  onChange={(e) => patch("address", e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                  rows={2}
                />
              </label>
              <label>
                <span className="text-xs font-medium text-text-secondary">Phone</span>
                <input
                  value={form.phone}
                  onChange={(e) => patch("phone", e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-text-secondary">Consultation hours</span>
                <input
                  value={form.consultationHours}
                  onChange={(e) => patch("consultationHours", e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-text-secondary">Slot duration</span>
                <select
                  value={String(form.slotDuration)}
                  onChange={(e) => patch("slotDuration", Number(e.target.value))}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                >
                  <option value="15">15 min</option>
                  <option value="20">20 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                </select>
              </label>
              <label>
                <span className="text-xs font-medium text-text-secondary">Default consultation fee</span>
                <input
                  type="number"
                  min={0}
                  value={form.defaultConsultationFee}
                  onChange={(e) => patch("defaultConsultationFee", Number(e.target.value) || 0)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <label className="sm:col-span-2">
                <span className="text-xs font-medium text-text-secondary">Prescription footer</span>
                <input
                  value={form.prescriptionFooter}
                  onChange={(e) => patch("prescriptionFooter", e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-md border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">
                {error}
              </div>
            ) : null}
            {message ? (
              <div className="mt-4 rounded-md border border-teal/20 bg-teal-pale px-3 py-2 text-xs text-teal-full">
                {message}
              </div>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <GhostButton type="button" onClick={() => setForm(settings)}>
                Cancel
              </GhostButton>
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </PrimaryButton>
            </div>
          </form>
          ) : activeTab === "Backup & Restore" ? (
            <div>
              <h3 className="text-base font-semibold text-text-primary">Backup & Restore</h3>
              <p className="mt-1 text-xs text-text-secondary">Create and manage local database backups.</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-border bg-neutral-canvas p-4">
                <div>
                  <div className="text-sm font-medium text-text-primary">Last backup</div>
                  <div className="text-xs text-text-secondary">
                    {lastBackup
                      ? `${new Date(lastBackup.createdAt).toLocaleString("en-IN")} · ${lastBackup.name}`
                      : "No backup has been created yet."}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill tone={lastBackup ? "sage" : "neutral"}>
                    {lastBackup ? "Healthy" : "Pending"}
                  </StatusPill>
                  <GhostButton type="button" onClick={() => void runBackup()} disabled={backingUp}>
                    {backingUp ? "Backing up..." : "Backup Now"}
                  </GhostButton>
                </div>
              </div>
              {error ? (
                <div className="mt-4 rounded-md border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">{error}</div>
              ) : null}
              {message ? (
                <div className="mt-4 rounded-md border border-teal/20 bg-teal-pale px-3 py-2 text-xs text-teal-full">{message}</div>
              ) : null}
            </div>
          ) : activeTab === "Prescription Template" ? (
            <div>
              <h3 className="text-base font-semibold text-text-primary">Prescription Template</h3>
              <p className="mt-1 text-xs text-text-secondary">Customize the prescription footer and doctor name shown on printouts.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-xs font-medium text-text-secondary">Doctor name on prescription</span>
                  <input
                    value={form.doctorName}
                    onChange={(e) => patch("doctorName", e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                  />
                </label>
                <label className="sm:col-span-2">
                  <span className="text-xs font-medium text-text-secondary">Prescription footer</span>
                  <input
                    value={form.prescriptionFooter}
                    onChange={(e) => patch("prescriptionFooter", e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <GhostButton type="button" onClick={() => setForm(settings)}>Cancel</GhostButton>
                <PrimaryButton onClick={() => void doSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </PrimaryButton>
              </div>
            </div>
          ) : activeTab === "Appointments" ? (
            <div>
              <h3 className="text-base font-semibold text-text-primary">Appointments</h3>
              <p className="mt-1 text-xs text-text-secondary">Configure slot duration and consultation hours.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <label>
                  <span className="text-xs font-medium text-text-secondary">Consultation hours</span>
                  <input
                    value={form.consultationHours}
                    onChange={(e) => patch("consultationHours", e.target.value)}
                    className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                  />
                </label>
                <label>
                  <span className="text-xs font-medium text-text-secondary">Slot duration</span>
                  <select
                    value={String(form.slotDuration)}
                    onChange={(e) => patch("slotDuration", Number(e.target.value))}
                    className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                  >
                    <option value="15">15 min</option>
                    <option value="20">20 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <GhostButton type="button" onClick={() => setForm(settings)}>Cancel</GhostButton>
                <PrimaryButton onClick={() => void doSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </PrimaryButton>
              </div>
            </div>
          ) : activeTab === "Billing" ? (
            <div>
              <h3 className="text-base font-semibold text-text-primary">Billing</h3>
              <p className="mt-1 text-xs text-text-secondary">Set the default consultation fee used when creating bills.</p>
              <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <label>
                  <span className="text-xs font-medium text-text-secondary">Default consultation fee (₹)</span>
                  <input
                    type="number"
                    min={0}
                    value={form.defaultConsultationFee}
                    onChange={(e) => patch("defaultConsultationFee", Number(e.target.value) || 0)}
                    className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <GhostButton type="button" onClick={() => setForm(settings)}>Cancel</GhostButton>
                <PrimaryButton onClick={() => void doSave()} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </PrimaryButton>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-text-secondary">
              This section is coming soon.
            </div>
          )}
        </Card>
      </div>
    </AppShell>
  );
}


