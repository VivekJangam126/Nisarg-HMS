import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, Card, StatusPill, PrimaryButton, GhostButton } from "@/components/AppShell";
import { Plus, Printer, Trash2, X, Download } from "lucide-react";
import { toast } from "sonner";
import {
  can,
  saveBill,
  updateBillStatus,
  useAuth,
  useBills,
  useEnsureSeed,
  usePatients,
  type Bill,
  type BillItem,
} from "@/lib/store";

export const Route = createFileRoute("/billing")({
  validateSearch: (search: Record<string, unknown>) => ({
    patientId: typeof search.patientId === "string" ? search.patientId : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Billing — Nisarg Women Healthcare" },
      { name: "description", content: "Create receipts, manage payments, and review daily revenue." },
    ],
  }),
  component: BillingPage,
});

const DEFAULT_ITEMS: BillItem[] = [{ desc: "Consultation", qty: 1, price: 600 }];
const PAYMENT_MODES: Bill["paymentMode"][] = ["Cash", "UPI", "Card", "Other"];

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function exportCSV(bills: Bill[]) {
  const rows = [
    ["Bill ID", "Patient", "Date", "Items", "Discount", "Tax", "Total", "Payment Mode", "Status"],
    ...bills.map((b) => [
      b.id,
      b.patientName,
      new Date(b.date).toLocaleDateString("en-IN"),
      b.items.map((i) => `${i.desc} x${i.qty}`).join("; "),
      b.discount,
      b.tax,
      b.total,
      b.paymentMode,
      b.status,
    ]),
  ];
  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bills-${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function BillingPage() {
  useEnsureSeed();
  const auth = useAuth();
  const patients = usePatients();
  const bills = useBills();
  const { patientId: preselectedPatientId } = Route.useSearch();

  const canCreate = can(auth?.role, "billing.create");

  const [patientId, setPatientId] = useState(preselectedPatientId ?? patients[0]?.id ?? "");
  const [items, setItems] = useState<BillItem[]>(DEFAULT_ITEMS);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [mode, setMode] = useState<Bill["paymentMode"]>("Cash");
  const [status, setStatus] = useState<Bill["status"]>("Paid");
  const [preview, setPreview] = useState<Bill | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);

  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const total = Math.max(0, subtotal - discount + tax);

  const today = todayISO();
  const todayBills = useMemo(() => bills.filter((b) => b.date.startsWith(today)), [bills, today]);
  const todayTotal = todayBills.reduce((s, b) => s + (b.status === "Paid" ? b.total : 0), 0);
  const todayPending = todayBills.reduce((s, b) => s + (b.status === "Pending" ? b.total : 0), 0);

  const updateItem = (idx: number, patch: Partial<BillItem>) =>
    setItems(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const addItem = () => setItems([...items, { desc: "", qty: 1, price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const resetForm = () => {
    setItems(DEFAULT_ITEMS);
    setDiscount(0);
    setTax(0);
    setMode("Cash");
    setStatus("Paid");
  };

  const handleSave = async (andPrint: boolean) => {
    setError(null);
    const patient = patients.find((p) => p.id === patientId);
    if (!patient) return setError("Select a patient.");
    const validItems = items.filter((i) => i.desc.trim() && i.qty > 0 && i.price >= 0);
    if (validItems.length === 0) return setError("Add at least one valid bill item.");
    setSaving(true);
    try {
      const bill = await saveBill({
        patientId: patient.id,
        patientName: patient.name,
        items: validItems,
        discount,
        tax,
        total,
        paymentMode: mode,
        status,
      });
      resetForm();
      toast.success("Bill saved successfully");
      if (andPrint) setPreview(bill);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save bill.");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (bill: Bill) => {
    setMarkingPaid(bill.id);
    try {
      await updateBillStatus(bill.id, "Paid");
      toast.success(`Bill ${bill.id} marked as paid`);
    } catch {
      toast.error("Failed to update bill status");
    } finally {
      setMarkingPaid(null);
    }
  };

  return (
    <AppShell
      title="Billing"
      subtitle={`Today: ${todayBills.length} bills · ₹${todayTotal.toLocaleString("en-IN")} collected · ₹${todayPending.toLocaleString("en-IN")} pending`}
      actions={
        <GhostButton onClick={() => exportCSV(bills)}>
          <Download className="size-4" /> Export CSV
        </GhostButton>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <h3 className="text-base font-semibold text-text-primary">Create Bill</h3>
          {!canCreate ? (
            <p className="mt-3 rounded-md border border-neutral-border bg-neutral-canvas px-3 py-2 text-xs text-text-secondary">
              Your role does not allow creating bills.
            </p>
          ) : null}

          <div className={"mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm " + (canCreate ? "" : "pointer-events-none opacity-60")}>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Patient</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.id}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Bill["status"])}
                className="rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              >
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </label>
          </div>

          <table className={"mt-5 w-full border-collapse text-left text-sm " + (canCreate ? "" : "pointer-events-none opacity-60")}>
            <thead>
              <tr className="border-b border-neutral-border text-[11px] uppercase tracking-wider text-text-secondary">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 w-20 text-right font-medium">Qty</th>
                <th className="py-2 w-28 text-right font-medium">Price (₹)</th>
                <th className="py-2 w-28 text-right font-medium">Amount</th>
                <th className="py-2 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2">
                    <input
                      value={i.desc}
                      onChange={(e) => updateItem(idx, { desc: e.target.value })}
                      placeholder="Service / item"
                      className="w-full rounded border border-neutral-border bg-neutral-surface px-2 py-1 text-sm"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number" min={1} value={i.qty}
                      onChange={(e) => updateItem(idx, { qty: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-16 rounded border border-neutral-border bg-neutral-surface px-2 py-1 text-right text-sm tabular-nums"
                    />
                  </td>
                  <td className="py-2 text-right">
                    <input
                      type="number" min={0} value={i.price}
                      onChange={(e) => updateItem(idx, { price: Math.max(0, Number(e.target.value) || 0) })}
                      className="w-24 rounded border border-neutral-border bg-neutral-surface px-2 py-1 text-right text-sm tabular-nums"
                    />
                  </td>
                  <td className="py-2 text-right font-medium tabular-nums text-text-primary">
                    ₹{(i.qty * i.price).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 text-right">
                    <button type="button" onClick={() => removeItem(idx)} className="rounded p-1 text-text-tertiary hover:text-red-full" aria-label="Remove">
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addItem} disabled={!canCreate}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-full hover:underline disabled:opacity-50">
            <Plus className="size-3.5" /> Add line item
          </button>

          <div className={"mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-neutral-border pt-4 " + (canCreate ? "" : "pointer-events-none opacity-60")}>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-text-secondary">Payment Mode</label>
                <div className="mt-1 flex gap-1">
                  {PAYMENT_MODES.map((m) => (
                    <button type="button" key={m} onClick={() => setMode(m)}
                      className={"rounded-md border px-3 py-1.5 text-sm " + (mode === m ? "border-teal bg-teal-pale text-teal-full" : "border-neutral-border text-text-secondary hover:border-teal")}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-text-secondary">Discount (₹)</span>
                  <input type="number" min={0} value={discount}
                    onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                    className="w-28 rounded-md border border-neutral-border bg-neutral-surface px-2 py-1 text-sm tabular-nums" />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-text-secondary">Tax (₹)</span>
                  <input type="number" min={0} value={tax}
                    onChange={(e) => setTax(Math.max(0, Number(e.target.value) || 0))}
                    className="w-28 rounded-md border border-neutral-border bg-neutral-surface px-2 py-1 text-sm tabular-nums" />
                </label>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-text-secondary">Subtotal: <span className="tabular-nums text-text-primary">₹{subtotal.toLocaleString("en-IN")}</span></div>
              <div className="text-xs text-text-secondary">Discount: <span className="tabular-nums">−₹{discount.toLocaleString("en-IN")}</span></div>
              <div className="text-xs text-text-secondary">Tax: <span className="tabular-nums">+₹{tax.toLocaleString("en-IN")}</span></div>
              <div className="mt-1 text-xs uppercase tracking-wide text-text-secondary">Total</div>
              <div className="text-3xl font-semibold tabular-nums text-text-primary">₹{total.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <div className={"mt-4 flex justify-end gap-2 " + (canCreate ? "" : "pointer-events-none opacity-60")}>
            {error ? <div className="mr-auto rounded-md border border-red-full/30 bg-red-light px-3 py-2 text-xs text-red-full">{error}</div> : null}
            <GhostButton onClick={() => void handleSave(true)} disabled={saving}>
              <Printer className="size-4" /> Save & Preview
            </GhostButton>
            <PrimaryButton onClick={() => void handleSave(false)} disabled={saving}>
              {saving ? "Saving..." : "Save Bill"}
            </PrimaryButton>
          </div>
        </Card>

        <div>
          <h3 className="mb-3 text-base font-semibold text-text-primary">Today's Bills</h3>
          <Card className="divide-y divide-neutral-border">
            {todayBills.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-text-secondary">No bills issued today.</div>
            ) : (
              todayBills.map((b) => (
                <div key={b.id} className="flex w-full items-center justify-between gap-3 px-4 py-3">
                  <button onClick={() => setPreview(b)} className="min-w-0 flex-1 text-left">
                    <div className="truncate text-sm font-medium text-text-primary">{b.patientName}</div>
                    <div className="font-mono text-xs text-text-secondary">
                      {b.id} · {b.paymentMode} · {new Date(b.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </button>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold tabular-nums text-text-primary">₹{b.total.toLocaleString("en-IN")}</div>
                    <StatusPill tone={b.status === "Paid" ? "sage" : "rose"}>{b.status}</StatusPill>
                    {b.status === "Pending" && canCreate ? (
                      <button
                        onClick={() => void handleMarkPaid(b)}
                        disabled={markingPaid === b.id}
                        className="mt-0.5 rounded border border-teal-full px-2 py-0.5 text-[11px] font-medium text-teal-full hover:bg-teal-pale disabled:opacity-50"
                      >
                        {markingPaid === b.id ? "Updating..." : "Mark Paid"}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
            <div className="flex items-center justify-between bg-neutral-canvas px-4 py-3 text-sm">
              <span className="font-medium text-text-primary">Total today</span>
              <span className="font-semibold tabular-nums text-text-primary">₹{todayTotal.toLocaleString("en-IN")}</span>
            </div>
          </Card>
        </div>
      </div>

      {preview ? <InvoicePreview bill={preview} onClose={() => setPreview(null)} /> : null}
    </AppShell>
  );
}

function InvoicePreview({ bill, onClose }: { bill: Bill; onClose: () => void }) {
  const subtotal = bill.items.reduce((s, i) => s + i.qty * i.price, 0);
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink-900/50 p-4 print:static print:bg-transparent print:p-0">
      <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-neutral-surface shadow-xl print:shadow-none print:max-w-full">
        <div className="flex items-center justify-between border-b border-neutral-border px-5 py-3 print:hidden">
          <h3 className="text-base font-semibold text-text-primary">Invoice Preview · {bill.id}</h3>
          <div className="flex items-center gap-2">
            <PrimaryButton onClick={() => window.print()}>
              <Printer className="size-4" /> Print
            </PrimaryButton>
            <button onClick={onClose} className="rounded p-1 text-text-secondary hover:bg-neutral-canvas" aria-label="Close">
              <X className="size-4" />
            </button>
          </div>
        </div>
        <div className="px-8 py-8 text-sm text-text-primary print:px-12 print:py-12">
          <div className="flex items-start justify-between border-b border-neutral-border pb-4">
            <div>
              <div className="text-lg font-semibold">Nisarg Women Healthcare</div>
              <div className="text-xs text-text-secondary">Dr. Manjusha Lamadade (Yetalkar) · Pune</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-text-secondary">Receipt</div>
              <div className="font-mono text-sm">{bill.id}</div>
              <div className="text-xs text-text-secondary">{new Date(bill.date).toLocaleString("en-IN")}</div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-text-secondary">Patient</div>
              <div className="font-medium text-text-primary">{bill.patientName}</div>
              <div className="font-mono text-text-secondary">{bill.patientId}</div>
            </div>
            <div className="text-right">
              <div className="text-text-secondary">Payment</div>
              <div className="font-medium text-text-primary">{bill.paymentMode}</div>
              <div className="text-text-secondary">{bill.status}</div>
            </div>
          </div>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-border text-left text-[11px] uppercase tracking-wider text-text-secondary">
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 w-16 text-right font-medium">Qty</th>
                <th className="py-2 w-24 text-right font-medium">Price</th>
                <th className="py-2 w-24 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-border">
              {bill.items.map((i, idx) => (
                <tr key={idx}>
                  <td className="py-2.5">{i.desc}</td>
                  <td className="py-2.5 text-right tabular-nums">{i.qty}</td>
                  <td className="py-2.5 text-right tabular-nums">₹{i.price.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 text-right tabular-nums">₹{(i.qty * i.price).toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 ml-auto w-64 space-y-1 text-sm">
            <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span className="tabular-nums">₹{subtotal.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-text-secondary"><span>Discount</span><span className="tabular-nums">−₹{bill.discount.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between text-text-secondary"><span>Tax</span><span className="tabular-nums">+₹{bill.tax.toLocaleString("en-IN")}</span></div>
            <div className="flex justify-between border-t border-neutral-border pt-2 text-base font-semibold text-text-primary">
              <span>Total</span><span className="tabular-nums">₹{bill.total.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <p className="mt-8 text-center text-xs text-text-secondary">Thank you for choosing Nisarg Women Healthcare.</p>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } .fixed, .fixed * { visibility: visible; } .fixed { position: absolute; inset: 0; } }`}</style>
    </div>
  );
}
