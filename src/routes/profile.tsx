import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell, Card, PrimaryButton, GhostButton } from "@/components/AppShell";
import { updateProfile, useAuth } from "@/lib/store";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile - Nisarg Women Healthcare" },
      { name: "description", content: "Manage your account details and password." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const auth = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth) return;
    setName(auth.name);
    setPhone(auth.phone || "");
    setEmail(auth.email || "");
  }, [auth]);

  const reset = () => {
    if (!auth) return;
    setName(auth.name);
    setPhone(auth.phone || "");
    setEmail(auth.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!name.trim()) return setError("Name is required.");
    if (newPassword || confirmPassword || currentPassword) {
      if (newPassword !== confirmPassword)
        return setError("New password and confirmation do not match.");
      if (newPassword.length < 8) return setError("New password must be at least 8 characters.");
      if (!currentPassword) return setError("Enter your current password.");
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell title="My Profile" subtitle="Manage your account details">
      <form onSubmit={submit} className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-teal-pale text-2xl font-semibold text-teal-full">
            {auth?.initials || "U"}
          </div>
          <div className="mt-3 text-base font-semibold text-text-primary">{auth?.name || "User"}</div>
          <div className="text-xs text-text-secondary">{auth?.title || auth?.role}</div>
          <div className="mt-4 border-t border-neutral-border pt-4 text-left text-sm">
            <dl className="space-y-2">
              <Info k="Username" v={auth?.username || "-"} mono />
              <Info
                k="Last login"
                v={
                  auth?.lastLoginAt
                    ? new Date(auth.lastLoginAt).toLocaleString("en-IN")
                    : "Not recorded"
                }
              />
              <Info k="Role" v={auth?.role || "-"} />
            </dl>
          </div>
        </Card>

        <Card className="p-6 xl:col-span-2">
          <h3 className="text-base font-semibold text-text-primary">Account Details</h3>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            <label>
              <span className="text-xs font-medium text-text-secondary">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-text-secondary">Phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-text-secondary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
              />
            </label>
            <label>
              <span className="text-xs font-medium text-text-secondary">Username</span>
              <input
                value={auth?.username || ""}
                disabled
                className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-canvas px-3 py-2 text-text-secondary"
              />
            </label>
          </div>

          <div className="mt-8 border-t border-neutral-border pt-6">
            <h3 className="text-base font-semibold text-text-primary">Change Password</h3>
            <div className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <label>
                <span className="text-xs font-medium text-text-secondary">Current password</span>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <div />
              <label>
                <span className="text-xs font-medium text-text-secondary">New password</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
              <label>
                <span className="text-xs font-medium text-text-secondary">Confirm new password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full rounded-md border border-neutral-border bg-neutral-surface px-3 py-2"
                />
              </label>
            </div>
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
            <GhostButton type="button" onClick={reset}>
              Cancel
            </GhostButton>
            <PrimaryButton type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Profile"}
            </PrimaryButton>
          </div>
        </Card>
      </form>
    </AppShell>
  );
}

function Info({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-secondary">{k}</dt>
      <dd className={(mono ? "font-mono " : "") + "text-right text-text-primary"}>{v}</dd>
    </div>
  );
}


