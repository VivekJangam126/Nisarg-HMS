import { useEffect, useState, useSyncExternalStore } from "react";

// ---------- Types ----------
export type Role = "admin" | "receptionist" | "doctor";

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: Role;
  initials: string;
  title: string;
  phone?: string;
  email?: string;
  lastLoginAt?: string | null;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "F" | "M" | "Other";
  phone: string;
  address: string;
  medicalHistory: string;
  allergies: string;
  bloodGroup: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time?: string;
  purpose: string;
  status: "Confirmed" | "Waiting" | "In Session" | "Completed" | "Cancelled";
  createdAt: string;
}

export interface BillItem {
  desc: string;
  qty: number;
  price: number;
}

export interface Bill {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  items: BillItem[];
  discount: number;
  tax: number;
  total: number;
  paymentMode: "Cash" | "UPI" | "Card" | "Other";
  status: "Paid" | "Pending";
  date: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  username?: string;
  password?: string;
  email?: string;
  phone?: string;
}

export interface PrescriptionMed {
  name: string;
  dosage: string;
  duration: string;
  notes?: string;
  frequency?: 1 | 2 | 3 | 4 | 5;
  timing?: "before eating" | "after eating" | "anytime";
}

export interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  diagnosis: string;
  meds: PrescriptionMed[];
  advice?: string;
  date: string;
}

export interface LabReport {
  id: string;
  patientId: string;
  patientName: string;
  name: string;
  type: string;
  date: string;
  fileName: string;
  fileSize: number;
  downloadUrl?: string;
  uploadedAt: string;
}

export interface DoctorNote {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  text: string;
  createdAt: string;
}

export interface ClinicSettings {
  clinicName: string;
  doctorName: string;
  address: string;
  phone: string;
  consultationHours: string;
  slotDuration: number;
  defaultConsultationFee: number;
  prescriptionFooter: string;
}

export interface BackupInfo {
  name: string;
  path: string;
  createdAt: string;
}

interface ServerData {
  patients: Patient[];
  appointments: Appointment[];
  bills: Bill[];
  doctors: Doctor[];
  prescriptions: Prescription[];
  labReports: LabReport[];
  notes: DoctorNote[];
  settings: ClinicSettings;
  lastBackup: BackupInfo | null;
}

interface AppState extends ServerData {
  auth: AuthUser | null;
  ready: boolean;
  error: string | null;
}

interface ServerPayload {
  user?: AuthUser | null;
  data?: Partial<ServerData>;
  backup?: BackupInfo;
}

const DEFAULT_SETTINGS: ClinicSettings = {
  clinicName: "Nisarg Women Healthcare",
  doctorName: "Dr. Manjusha Lamadade (Yetalkar)",
  address: "Plot 14, Wakad, Pune - 411057",
  phone: "020 2727 0011",
  consultationHours: "10:00 AM - 4:00 PM",
  slotDuration: 30,
  defaultConsultationFee: 600,
  prescriptionFooter: "In case of emergency, call +91 98765 43210.",
};

const EMPTY_STATE: AppState = {
  auth: null,
  ready: false,
  error: null,
  patients: [],
  appointments: [],
  bills: [],
  doctors: [],
  prescriptions: [],
  labReports: [],
  notes: [],
  settings: DEFAULT_SETTINGS,
  lastBackup: null,
};

const isBrowser = typeof window !== "undefined";
const listeners = new Set<() => void>();
let state: AppState = EMPTY_STATE;
let bootstrapPromise: Promise<void> | null = null;

function emit() {
  for (const listener of listeners) listener();
}

function setState(next: Partial<AppState>) {
  state = { ...state, ...next };
  emit();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function applyServerPayload(payload: ServerPayload) {
  const next: AppState = { ...state, ready: true, error: null };
  if ("user" in payload) {
    next.auth = payload.user ?? null;
  }
  if (payload.data) {
    Object.assign(next, payload.data);
    next.settings = payload.data.settings ?? next.settings ?? DEFAULT_SETTINGS;
    next.lastBackup = payload.data.lastBackup ?? next.lastBackup ?? null;
  }
  state = next;
  emit();
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload as T;
}

async function bootstrap() {
  if (!isBrowser) return;
  try {
    const response = await fetch("/api/bootstrap", { credentials: "include" });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      setState({ ...EMPTY_STATE, ready: true });
      return;
    }
    if (!response.ok) throw new Error(payload.error || "Unable to load HMS data.");
    applyServerPayload(payload);
  } catch (error) {
    setState({
      ready: true,
      auth: null,
      error: error instanceof Error ? error.message : "Unable to load HMS data.",
    });
  }
}

export async function ensureSeed() {
  if (!isBrowser) return;
  if (!bootstrapPromise) {
    bootstrapPromise = bootstrap().finally(() => {
      bootstrapPromise = null;
    });
  }
  await bootstrapPromise;
}

function useSnapshot<T>(selector: (snapshot: AppState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(EMPTY_STATE),
  );
}

export function useEnsureSeed() {
  const ready = useSnapshot((snapshot) => snapshot.ready);
  const [requested, setRequested] = useState(false);
  useEffect(() => {
    if (!requested) {
      setRequested(true);
      void ensureSeed();
    }
  }, [requested]);
  return ready;
}

export function useStoreError(): string | null {
  return useSnapshot((snapshot) => snapshot.error);
}

// ---------- Auth ----------
export const DEMO_CREDENTIALS: { username: string; role: Role; name: string }[] = [
  { username: "admin", role: "admin", name: "Dr. Manjusha Lamadade" },
  { username: "reception", role: "receptionist", name: "Priya Joshi" },
  { username: "doctor", role: "doctor", name: "Dr. Sneha Patil" },
];

export async function login(username: string, password: string): Promise<AuthUser | null> {
  try {
    const payload = await api<ServerPayload>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    applyServerPayload(payload);
    return payload.user ?? null;
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } finally {
    state = { ...EMPTY_STATE, ready: true };
    emit();
  }
}

export function useAuth(): AuthUser | null {
  return useSnapshot((snapshot) => snapshot.auth);
}

// ---------- Permissions ----------
export type AppPath =
  | "/"
  | "/patients"
  | "/appointments"
  | "/doctors"
  | "/prescriptions"
  | "/lab-reports"
  | "/billing"
  | "/reports"
  | "/profile"
  | "/settings"
  | "/patient";

const ROLE_ROUTES: Record<Role, AppPath[]> = {
  admin: [
    "/",
    "/patients",
    "/appointments",
    "/doctors",
    "/prescriptions",
    "/lab-reports",
    "/billing",
    "/reports",
    "/profile",
    "/settings",
    "/patient",
  ],
  receptionist: ["/", "/patients", "/appointments", "/lab-reports", "/billing", "/profile", "/patient"],
  doctor: ["/", "/patients", "/appointments", "/prescriptions", "/lab-reports", "/billing", "/profile", "/patient"],
};

export function canAccess(role: Role | undefined, path: string): boolean {
  if (!role) return false;
  if (path === "/login") return true;
  const allowed = ROLE_ROUTES[role];
  return allowed.some((p) => p === path || (p !== "/" && path.startsWith(p)));
}

export type Action =
  | "patient.create"
  | "patient.edit"
  | "appointment.create"
  | "appointment.cancel"
  | "billing.create"
  | "prescription.create"
  | "doctor.manage"
  | "settings.manage";

const ROLE_ACTIONS: Record<Role, Action[]> = {
  admin: [
    "patient.create",
    "patient.edit",
    "appointment.create",
    "appointment.cancel",
    "billing.create",
    "prescription.create",
    "doctor.manage",
    "settings.manage",
  ],
  receptionist: [
    "patient.create",
    "patient.edit",
    "appointment.create",
    "appointment.cancel",
    "billing.create",
  ],
  doctor: ["prescription.create", "patient.edit", "billing.create"],
};

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return ROLE_ACTIONS[role].includes(action);
}

// ---------- Patients ----------
export function usePatients(): Patient[] {
  return useSnapshot((snapshot) => snapshot.patients);
}

export function getPatients(): Patient[] {
  return state.patients;
}

export async function savePatient(
  p: Omit<Patient, "id" | "createdAt"> & { id?: string },
): Promise<Patient> {
  const payload = await api<ServerPayload & { patient: Patient }>(
    p.id ? `/api/patients/${encodeURIComponent(p.id)}` : "/api/patients",
    {
      method: p.id ? "PUT" : "POST",
      body: JSON.stringify(p),
    },
  );
  applyServerPayload(payload);
  return payload.patient;
}

// ---------- Doctors ----------
export function useDoctors(): Doctor[] {
  return useSnapshot((snapshot) => snapshot.doctors);
}

export function getDoctors(): Doctor[] {
  return state.doctors;
}

export async function saveDoctor(d: Omit<Doctor, "id"> & { id?: string }): Promise<Doctor> {
  const payload = await api<ServerPayload & { doctor: Doctor }>("/api/doctors", {
    method: "POST",
    body: JSON.stringify(d),
  });
  applyServerPayload(payload);
  return payload.doctor;
}

// ---------- Appointments ----------
export function useAppointments(): Appointment[] {
  return useSnapshot((snapshot) => snapshot.appointments);
}

export function getAppointments(): Appointment[] {
  return state.appointments;
}

export function isSlotTaken(
  doctorId: string,
  date: string,
  time: string,
  excludeId?: string,
): boolean {
  return getAppointments().some(
    (a) =>
      a.doctorId === doctorId &&
      a.date === date &&
      a.time === time &&
      a.status !== "Cancelled" &&
      a.id !== excludeId,
  );
}

export async function bookAppointment(
  input: Omit<Appointment, "id" | "createdAt" | "status"> & { status?: Appointment["status"] },
): Promise<{ ok: true; appointment: Appointment } | { ok: false; error: string }> {
  try {
    const payload = await api<ServerPayload & { appointment: Appointment }>("/api/appointments", {
      method: "POST",
      body: JSON.stringify(input),
    });
    applyServerPayload(payload);
    return { ok: true, appointment: payload.appointment };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to book appointment.",
    };
  }
}

export async function updateAppointmentStatus(id: string, status: Appointment["status"]) {
  const payload = await api<ServerPayload>(`/api/appointments/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  applyServerPayload(payload);
}

export async function updateAppointment(
  id: string,
  input: Partial<Pick<Appointment, "patientId" | "doctorId" | "date" | "time" | "purpose" | "status">>
): Promise<Appointment> {
  const payload = await api<ServerPayload & { appointment: Appointment }>(
    `/api/appointments/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(input) },
  );
  applyServerPayload(payload);
  return payload.appointment;
}

// ---------- Bills ----------
export function useBills(): Bill[] {
  return useSnapshot((snapshot) => snapshot.bills);
}

export function getBills(): Bill[] {
  return state.bills;
}

export async function saveBill(b: Omit<Bill, "id" | "date">): Promise<Bill> {
  const payload = await api<ServerPayload & { bill: Bill }>("/api/bills", {
    method: "POST",
    body: JSON.stringify(b),
  });
  applyServerPayload(payload);
  return payload.bill;
}

export async function updateBillStatus(id: string, status: Bill["status"]) {
  const payload = await api<ServerPayload & { bill: Bill }>(`/api/bills/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  applyServerPayload(payload);
}

// ---------- Prescriptions ----------
export function usePrescriptions(): Prescription[] {
  return useSnapshot((snapshot) => snapshot.prescriptions);
}

export function getPrescriptions(): Prescription[] {
  return state.prescriptions;
}

export async function savePrescription(
  p: Omit<Prescription, "id" | "date">,
): Promise<Prescription> {
  const payload = await api<ServerPayload & { prescription: Prescription }>("/api/prescriptions", {
    method: "POST",
    body: JSON.stringify(p),
  });
  applyServerPayload(payload);
  return payload.prescription;
}

// ---------- Lab Reports ----------
export function useLabReports(): LabReport[] {
  return useSnapshot((snapshot) => snapshot.labReports);
}

export function getLabReports(): LabReport[] {
  return state.labReports;
}

export async function saveLabReport(
  r: Omit<LabReport, "id" | "uploadedAt" | "downloadUrl"> & { fileDataUrl: string },
): Promise<LabReport> {
  const payload = await api<ServerPayload & { report: LabReport }>("/api/lab-reports", {
    method: "POST",
    body: JSON.stringify(r),
  });
  applyServerPayload(payload);
  return payload.report;
}

// ---------- Doctor Notes ----------
export function useNotes(): DoctorNote[] {
  return useSnapshot((snapshot) => snapshot.notes);
}

export function getNotes(): DoctorNote[] {
  return state.notes;
}

export async function saveNote(n: Omit<DoctorNote, "id" | "createdAt">): Promise<DoctorNote> {
  const payload = await api<ServerPayload & { note: DoctorNote }>("/api/notes", {
    method: "POST",
    body: JSON.stringify(n),
  });
  applyServerPayload(payload);
  return payload.note;
}

export async function deleteNote(id: string) {
  const payload = await api<ServerPayload>(`/api/notes/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  applyServerPayload(payload);
}

// ---------- Settings and profile ----------
export function useSettings(): ClinicSettings {
  return useSnapshot((snapshot) => snapshot.settings);
}

export function useLastBackup(): BackupInfo | null {
  return useSnapshot((snapshot) => snapshot.lastBackup);
}

export async function updateProfile(input: {
  name: string;
  phone?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<AuthUser> {
  const payload = await api<ServerPayload & { user: AuthUser }>("/api/profile", {
    method: "PUT",
    body: JSON.stringify(input),
  });
  applyServerPayload(payload);
  return payload.user;
}

export async function saveSettings(settings: ClinicSettings): Promise<ClinicSettings> {
  const payload = await api<ServerPayload & { settings: ClinicSettings }>("/api/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  applyServerPayload(payload);
  return payload.settings;
}

export async function backupNow(): Promise<BackupInfo> {
  const payload = await api<ServerPayload & { backup: BackupInfo }>("/api/backup", {
    method: "POST",
  });
  applyServerPayload(payload);
  return payload.backup;
}

// ---------- Medicines catalog ----------
export const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

export const MEDICINES: { name: string; defaultDosage: string }[] = [
  { name: "Paracetamol 500mg", defaultDosage: "1 tab TDS" },
  { name: "Ibuprofen 400mg", defaultDosage: "1 tab BD after food" },
  { name: "Amoxicillin 500mg", defaultDosage: "1 cap TDS" },
  { name: "Azithromycin 500mg", defaultDosage: "1 tab OD" },
  { name: "Metronidazole 400mg", defaultDosage: "1 tab TDS" },
  { name: "Doxycycline 100mg", defaultDosage: "1 cap BD" },
  { name: "Folic Acid 5mg", defaultDosage: "1 tab OD" },
  { name: "Iron + Folic Acid (Orofer XT)", defaultDosage: "1 tab BD" },
  { name: "Calcium + Vitamin D3", defaultDosage: "1 tab OD" },
  { name: "Vitamin B12", defaultDosage: "1 tab OD" },
  { name: "Metformin 500mg", defaultDosage: "1 tab BD" },
  { name: "Myo-Inositol Sachet", defaultDosage: "1 sachet OD" },
  { name: "Dydrogesterone 10mg", defaultDosage: "1 tab BD" },
  { name: "Progesterone 200mg", defaultDosage: "1 cap OD HS" },
  { name: "Mefenamic Acid 500mg", defaultDosage: "1 tab TDS PRN" },
  { name: "Tranexamic Acid 500mg", defaultDosage: "1 tab TDS x 5 days" },
  { name: "Clomiphene 50mg", defaultDosage: "1 tab OD x 5 days" },
  { name: "Letrozole 2.5mg", defaultDosage: "1 tab OD x 5 days" },
  { name: "Norethisterone 5mg", defaultDosage: "1 tab BD" },
  { name: "Ondansetron 4mg", defaultDosage: "1 tab BD PRN" },
  { name: "Pantoprazole 40mg", defaultDosage: "1 tab OD before food" },
  { name: "Drotaverine 80mg", defaultDosage: "1 tab TDS PRN" },
  { name: "ORS Sachet", defaultDosage: "1 sachet PRN" },
  { name: "Multivitamin", defaultDosage: "1 tab OD" },
];

// ---------- Patient lookups ----------
export function getPatient(id: string): Patient | undefined {
  return getPatients().find((p) => p.id === id);
}

export function usePatient(id: string): Patient | undefined {
  const list = usePatients();
  return list.find((p) => p.id === id);
}
