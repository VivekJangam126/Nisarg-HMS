import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { AppShell, Card, PrimaryButton } from "@/components/AppShell";
import { Upload, FileText, Download } from "lucide-react";
import { saveLabReport, useAuth, useEnsureSeed, useLabReports, usePatients } from "@/lib/store";

export const Route = createFileRoute("/lab-reports")({
  head: () => ({
    meta: [
      { title: "Lab Reports — Nisarg Women Healthcare" },
      { name: "description", content: "Upload, view and download patient lab reports." },
    ],
  }),
  component: LabReportsPage,
});

function LabReportsPage() {
  useEnsureSeed();
  const auth = useAuth();
  const patients = usePatients();
  const reports = useLabReports();
  const [patientId, setPatientId] = useState(patients[0]?.id ?? "");
  const [reportName, setReportName] = useState("");
  const [type, setType] = useState("Pathology");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const canUpload = auth?.role === "admin" || auth?.role === "receptionist";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!canUpload) return setError("Your role can view reports but cannot upload them.");
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return setError("Select a patient.");
    if (!reportName.trim()) return setError("Enter a report name.");
    if (!file) return setError("Choose a file to upload.");
    if (file.size > 10 * 1024 * 1024) return setError("File must be ≤ 10 MB.");
    let dataUrl: string | undefined;
    try {
      dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result));
        r.onerror = () => rej(r.error);
        r.readAsDataURL(file);
      });
    } catch {
      dataUrl = undefined;
    }
    setSaving(true);
    try {
      await saveLabReport({
        patientId: patient.id,
        patientName: patient.name,
        name: reportName.trim(),
        type,
        date,
        fileName: file.name,
        fileSize: file.size,
        fileDataUrl: dataUrl,
      });
      setReportName("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save report.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Lab Reports"
      subtitle="Upload PDF, JPG or PNG. Reports link to patient records automatically."
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h3 className="text-base font-semibold text-text-primary">Upload</h3>
          <p className="mt-1 text-xs text-text-secondary">PDF, JPG, PNG · max 10 MB</p>
          {!canUpload ? (
            <p className="mt-3 rounded-md border border-neutral-border bg-neutral-canvas px-3 py-2 text-xs text-text-secondary">
              Your role can view reports but cannot upload them.
            </p>
          ) : null}
          <form
            onSubmit={submit}
            className={
              "mt-4 space-y-3 text-sm " + (canUpload ? "" : "pointer-events-none opacity-60")
            }
          >
            <div>
              <label className="text-xs font-medium text-text-secondary">Patient</label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-text-secondary">Report name</label>
              <input
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                placeholder="e.g. CBC, Sonography"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-text-secondary">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                >
                  <option>Pathology</option>
                  <option>Sonography</option>
                  <option>MRI</option>
                  <option>Hormone</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </div>
            </div>
            <label className="flex cursor-pointer flex-col items-center rounded-md border-2 border-dashed border-neutral-border bg-neutral-canvas px-4 py-6 text-center text-xs text-text-secondary hover:border-teal">
              <Upload className="mb-2 size-6 text-text-tertiary" />
              {file ? (
                <span className="font-medium text-text-primary">
                  {file.name} · {(file.size / 1024).toFixed(0)} KB
                </span>
              ) : (
                <span>Click to browse or drop a file</span>
              )}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            {error ? (
              <div className="rounded border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">
                {error}
              </div>
            ) : null}
            <PrimaryButton
              type="submit"
              className="w-full justify-center"
              disabled={saving || !canUpload}
            >
              {saving ? "Saving..." : "Save Report"}
            </PrimaryButton>
          </form>
        </Card>

        <div className="xl:col-span-2">
          <h3 className="mb-3 text-base font-semibold text-text-primary">Recent Reports</h3>
          <Card className="overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-canvas text-[11px] uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3 font-medium">Patient</th>
                  <th className="px-4 py-3 font-medium">Report</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-line">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-text-secondary">
                      No reports uploaded yet.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-neutral-canvas">
                      <td className="px-4 py-3">
                        <Link
                          to="/patient/$patientId"
                          params={{ patientId: r.patientId }}
                          className="font-medium text-text-primary hover:text-teal-full hover:underline"
                        >
                          {r.patientName}
                        </Link>
                        <div className="font-mono text-xs text-text-secondary">{r.patientId}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex size-8 items-center justify-center rounded-md bg-red-light text-red-full">
                            <FileText className="size-4" />
                          </div>
                          <div>
                            <div className="font-medium text-text-primary">{r.name}</div>
                            <div className="font-mono text-xs text-text-secondary">
                              {r.type} · {r.fileName} · {(r.fileSize / 1024).toFixed(0)} KB
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{r.date}</td>
                      <td className="px-4 py-3 text-right">
                        {r.downloadUrl ? (
                          <a
                            href={r.downloadUrl}
                            download={r.fileName}
                            className="inline-flex rounded p-1.5 text-text-secondary hover:bg-neutral-canvas hover:text-teal-full"
                            aria-label="Download"
                          >
                            <Download className="size-4" />
                          </a>
                        ) : (
                          <span className="text-xs text-text-tertiary">Not available</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


