const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4174);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DB_FILE = path.join(DATA_DIR, "database.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads", "lab-reports");
const COOKIE_NAME = "nisarg_session";
const MAX_JSON_BYTES = 25 * 1024 * 1024;
const MAX_REPORT_BYTES = 10 * 1024 * 1024;

const sessions = new Map();
const SEED_PASSWORD_HASHES = {
  admin:
    "490c4a4911c4933482700a0d930f4a0e:d051f62ee512d95be54747d5d189cb55c8ae6e2095454526c663913b86297abf640300cb233b555b3e7f4daca9af0b219f5b6af4e13f1b59fe849d4d442f518e",
  reception:
    "a79a736ec99208f2baf08a504957bfdc:f97f635453aed57c1a6bbacdffa2360761aa5e04c5aeb11ee546adf2bd8b54ce8d0922e3616376fa0c2cf60c9db24ee9ffb0170f5836959daeb793bb299956c5",
  doctor:
    "1b3386ae1c3f86edbdb41b7a31dab6c1:6c33ce54f45e6068bb578541060a683be24043516fd3d325818e186aa355e658f3bb09df1bcf9d64571335091defc89306918a104daa638c36de0b841b1e27dc",
};

function nowIso() {
  return new Date().toISOString();
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function initials(name) {
  return String(name || "User")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function generateRandomPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function generateUsername(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "")
    .substring(0, 20);
}

function verifyPassword(password, stored) {
  const [salt, hash] = String(stored || "").split(":");
  if (!salt || !hash) return false;
  const input = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return expected.length === input.length && crypto.timingSafeEqual(expected, input);
}

function ensureDirectories() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

function seedData() {
  const createdAt = nowIso();
  const today = todayStr();
  return {
    users: [
      {
        id: "U-1",
        username: "admin",
        passwordHash: SEED_PASSWORD_HASHES.admin,
        name: "Dr. Manjusha Lamadade",
        role: "admin",
        initials: "ML",
        title: "Gynecologist . Admin",
        phone: "9876543210",
        email: "admin@nisarg.local",
        isActive: true,
        createdAt,
        lastLoginAt: null,
      },
      {
        id: "U-2",
        username: "reception",
        passwordHash: SEED_PASSWORD_HASHES.reception,
        name: "Priya Joshi",
        role: "receptionist",
        initials: "PJ",
        title: "Receptionist",
        phone: "9876500001",
        email: "reception@nisarg.local",
        isActive: true,
        createdAt,
        lastLoginAt: null,
      },
      {
        id: "U-3",
        username: "doctor",
        passwordHash: SEED_PASSWORD_HASHES.doctor,
        name: "Dr. Sneha Patil",
        role: "doctor",
        initials: "SP",
        title: "Obstetrician . Doctor",
        phone: "9876500002",
        email: "doctor@nisarg.local",
        isActive: true,
        createdAt,
        lastLoginAt: null,
      },
    ],
    settings: {
      clinicName: "Nisarg Women Healthcare",
      doctorName: "Dr. Manjusha Lamadade (Yetalkar)",
      address: "Plot 14, Wakad, Pune - 411057",
      phone: "020 2727 0011",
      consultationHours: "10:00 AM - 4:00 PM",
      slotDuration: 30,
      defaultConsultationFee: 600,
      prescriptionFooter: "In case of emergency, call +91 98765 43210.",
    },
    lastBackup: null,
    doctors: [
      { id: "DOC-001", name: "Dr. Manjusha Lamadade", specialization: "Gynecologist" },
      { id: "DOC-002", name: "Dr. Sneha Patil", specialization: "Obstetrician" },
    ],
    patients: [
      {
        id: "PAT-1001",
        name: "Aditi Verma",
        age: 31,
        gender: "F",
        phone: "9876543210",
        address: "Kothrud, Pune",
        medicalHistory: "PCOS",
        allergies: "None",
        bloodGroup: "B+",
        createdAt,
      },
      {
        id: "PAT-1002",
        name: "Neha Patel",
        age: 29,
        gender: "F",
        phone: "9871245689",
        address: "Baner, Pune",
        medicalHistory: "Pregnancy 28w",
        allergies: "Penicillin",
        bloodGroup: "O+",
        createdAt,
      },
      {
        id: "PAT-1003",
        name: "Sneha Kulkarni",
        age: 27,
        gender: "F",
        phone: "9765411223",
        address: "Aundh, Pune",
        medicalHistory: "Irregular cycles",
        allergies: "None",
        bloodGroup: "A+",
        createdAt,
      },
    ],
    appointments: [
      {
        id: "APT-1001",
        patientId: "PAT-1001",
        patientName: "Aditi Verma",
        doctorId: "DOC-001",
        doctorName: "Dr. Manjusha Lamadade",
        date: today,
        time: "09:00",
        purpose: "Routine Sonography",
        status: "Completed",
        createdAt,
      },
      {
        id: "APT-1002",
        patientId: "PAT-1002",
        patientName: "Neha Patel",
        doctorId: "DOC-001",
        doctorName: "Dr. Manjusha Lamadade",
        date: today,
        time: "09:30",
        purpose: "Prenatal Checkup",
        status: "In Session",
        createdAt,
      },
      {
        id: "APT-1003",
        patientId: "PAT-1003",
        patientName: "Sneha Kulkarni",
        doctorId: "DOC-001",
        doctorName: "Dr. Manjusha Lamadade",
        date: today,
        time: "10:15",
        purpose: "PCOS Consultation",
        status: "Waiting",
        createdAt,
      },
    ],
    bills: [],
    prescriptions: [],
    labReports: [],
    notes: [],
    auditLogs: [{ id: "LOG-1001", action: "Seed data created", userId: "system", createdAt }],
    counters: {
      PAT: 1003,
      APT: 1003,
      BILL: 1000,
      RX: 1000,
      LAB: 1000,
      DOC: 2,
      NOTE: 1000,
      LOG: 1001,
    },
  };
}

function normalizeDb(db) {
  db.users ||= [];
  db.settings ||= seedData().settings;
  db.lastBackup ||= null;
  db.doctors ||= [];
  db.patients ||= [];
  db.appointments ||= [];
  db.bills ||= [];
  db.prescriptions ||= [];
  db.labReports ||= [];
  db.notes ||= [];
  db.auditLogs ||= [];
  db.counters ||= {};
  return db;
}

function readDb() {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(seedData(), null, 2));
  }
  return normalizeDb(JSON.parse(fs.readFileSync(DB_FILE, "utf8")));
}

function writeDb(db) {
  ensureDirectories();
  fs.writeFileSync(DB_FILE, JSON.stringify(normalizeDb(db), null, 2));
}

function publicUser(user) {
  if (!user) return null;
  const { passwordHash, isActive, ...safe } = user;
  return safe;
}

function publicData(db, userRole = null, userId = null) {
  let appointments = db.appointments;
  
  // Filter appointments based on user role
  if (userRole === "doctor" && userId) {
    const doctor = db.doctors.find(d => {
      const user = db.users.find(u => u.id === userId);
      return user && d.name === user.name;
    });
    if (doctor) {
      appointments = appointments.filter(a => a.doctorId === doctor.id);
    }
  }
  
  return {
    patients: db.patients,
    appointments,
    bills: db.bills,
    doctors: db.doctors.map(({ username, email, phone, ...doc }) => ({
      ...doc,
      email: userRole === "admin" ? email : undefined,
    })),
    prescriptions: db.prescriptions,
    labReports: db.labReports.map(({ filePath, fileDataUrl, ...report }) => ({
      ...report,
      downloadUrl: filePath
        ? `/api/lab-reports/${encodeURIComponent(report.id)}/download`
        : undefined,
    })),
    notes: db.notes,
    settings: db.settings,
    lastBackup: db.lastBackup,
    auditLogs: db.auditLogs.slice(0, 50),
  };
}

function nextId(db, prefix, width = 4) {
  const next = Number(db.counters[prefix] || 0) + 1;
  db.counters[prefix] = next;
  return `${prefix}-${String(next).padStart(width, "0")}`;
}

function addAudit(db, userId, action) {
  db.auditLogs.unshift({
    id: nextId(db, "LOG", 4),
    action,
    userId,
    createdAt: nowIso(),
  });
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function sendDb(res, status, db, extra = {}, userRole = null, userId = null) {
  sendJson(res, status, { ...extra, data: publicData(db, userRole, userId) });
}

function parseCookies(req) {
  return Object.fromEntries(
    String(req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim().split("="))
      .filter(([key]) => key)
      .map(([key, value]) => [key, decodeURIComponent(value || "")]),
  );
}

function sessionUser(req) {
  const token = parseCookies(req)[COOKIE_NAME];
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  const db = readDb();
  const user = db.users.find((item) => item.id === session.userId && item.isActive);
  return user || null;
}

function requireAuth(req, res) {
  const user = sessionUser(req);
  if (!user) {
    sendError(res, 401, "Authentication required");
    return null;
  }
  return user;
}

function requireRole(user, roles, res) {
  if (!roles.includes(user.role)) {
    sendError(res, 403, "You do not have permission to perform this action");
    return false;
  }
  return true;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > MAX_JSON_BYTES) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function validatePatient(payload) {
  const name = String(payload.name || "").trim();
  const phone = String(payload.phone || "").replace(/\s+/g, "");
  const age = Number(payload.age);
  if (name.length < 2) return "Patient name must be at least 2 characters.";
  if (!Number.isFinite(age) || age < 0 || age > 120)
    return "Patient age must be between 0 and 120.";
  if (!/^\d{10}$/.test(phone)) return "Patient phone must be a 10-digit number.";
  return null;
}

function storeLabFile(reportId, fileName, dataUrl) {
  const allowedExts = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
  const ext = path.extname(fileName || "").toLowerCase();
  if (!allowedExts.has(ext)) throw new Error("Only PDF, JPG, and PNG files are allowed.");
  const match = /^data:([^;]+);base64,(.+)$/u.exec(String(dataUrl || ""));
  if (!match) throw new Error("Report file data is missing.");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_REPORT_BYTES) throw new Error("Report file must be 10 MB or smaller.");
  const storedName = `${reportId}${ext}`;
  const fullPath = path.join(UPLOAD_DIR, storedName);
  fs.writeFileSync(fullPath, buffer);
  return fullPath;
}

function safeUploadPath(filePath) {
  const resolved = path.resolve(filePath || "");
  const root = path.resolve(UPLOAD_DIR);
  return resolved.startsWith(root) ? resolved : null;
}

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  fs.copyFileSync(src, dest);
}

async function handleApi(req, res, pathname) {
  try {
    if (pathname === "/api/auth/login" && req.method === "POST") {
      const payload = await readBody(req);
      const db = readDb();
      const username = String(payload.username || "")
        .trim()
        .toLowerCase();
      const user = db.users.find(
        (item) => item.username.toLowerCase() === username && item.isActive,
      );
      if (!user || !verifyPassword(String(payload.password || ""), user.passwordHash)) {
        sendError(res, 401, "Invalid username or password");
        return;
      }
      const token = crypto.randomBytes(32).toString("hex");
      sessions.set(token, { userId: user.id, createdAt: nowIso() });
      user.lastLoginAt = nowIso();
      addAudit(db, user.id, "Login");
      writeDb(db);
      res.setHeader(
        "Set-Cookie",
        `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800`,
      );
      sendJson(res, 200, { user: publicUser(user), data: publicData(db, user.role, user.id) });
      return;
    }

    if (pathname === "/api/auth/logout" && req.method === "POST") {
      const token = parseCookies(req)[COOKIE_NAME];
      if (token) sessions.delete(token);
      res.setHeader("Set-Cookie", `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
      sendJson(res, 200, { ok: true });
      return;
    }

    const user = requireAuth(req, res);
    if (!user) return;

    if (pathname === "/api/auth/me" && req.method === "GET") {
      sendJson(res, 200, { user: publicUser(user) });
      return;
    }

    if (pathname === "/api/bootstrap" && req.method === "GET") {
      const db = readDb();
      sendJson(res, 200, { user: publicUser(user), data: publicData(db, user.role, user.id) });
      return;
    }

    if (pathname === "/api/patients" && req.method === "POST") {
      if (!requireRole(user, ["admin", "receptionist"], res)) return;
      const payload = await readBody(req);
      const error = validatePatient(payload);
      if (error) {
        sendError(res, 400, error);
        return;
      }
      const db = readDb();
      const patient = {
        id: nextId(db, "PAT", 4),
        name: String(payload.name).trim(),
        age: Number(payload.age),
        gender: payload.gender === "M" || payload.gender === "Other" ? payload.gender : "F",
        phone: String(payload.phone).replace(/\s+/g, ""),
        address: String(payload.address || "").trim(),
        medicalHistory: String(payload.medicalHistory || "").trim(),
        allergies: String(payload.allergies || "None").trim(),
        bloodGroup: String(payload.bloodGroup || "").trim(),
        createdAt: nowIso(),
      };
      db.patients.unshift(patient);
      addAudit(db, user.id, `Patient created: ${patient.id}`);
      writeDb(db);
      sendDb(res, 201, db, { patient });
      return;
    }

    if (pathname.startsWith("/api/patients/") && req.method === "PUT") {
      if (!requireRole(user, ["admin", "receptionist", "doctor"], res)) return;
      const id = decodeURIComponent(pathname.split("/").pop());
      const payload = await readBody(req);
      const error = validatePatient(payload);
      if (error) {
        sendError(res, 400, error);
        return;
      }
      const db = readDb();
      const patient = db.patients.find((item) => item.id === id);
      if (!patient) {
        sendError(res, 404, "Patient not found");
        return;
      }
      Object.assign(patient, {
        name: String(payload.name).trim(),
        age: Number(payload.age),
        gender: payload.gender === "M" || payload.gender === "Other" ? payload.gender : "F",
        phone: String(payload.phone).replace(/\s+/g, ""),
        address: String(payload.address || "").trim(),
        medicalHistory: String(payload.medicalHistory || "").trim(),
        allergies: String(payload.allergies || "None").trim(),
        bloodGroup: String(payload.bloodGroup || "").trim(),
      });
      addAudit(db, user.id, `Patient updated: ${patient.id}`);
      writeDb(db);
      sendDb(res, 200, db, { patient });
      return;
    }

    if (pathname === "/api/doctors" && req.method === "POST") {
      if (!requireRole(user, ["admin"], res)) return;
      const payload = await readBody(req);
      const name = String(payload.name || "").trim();
      const specialization = String(payload.specialization || "").trim();
      const providedUsername = String(payload.username || "").trim();
      const providedPassword = String(payload.password || "").trim();
      
      if (name.length < 3 || !specialization) {
        sendError(res, 400, "Doctor name and specialization are required.");
        return;
      }
      if (providedUsername && providedUsername.length < 3) {
        sendError(res, 400, "Username must be at least 3 characters.");
        return;
      }
      if (providedPassword && providedPassword.length < 6) {
        sendError(res, 400, "Password must be at least 6 characters.");
        return;
      }
      
      const db = readDb();
      
      // Use provided credentials or generate them
      const username = providedUsername || generateUsername(name);
      const password = providedPassword || generateRandomPassword();
      
      // Check if username already exists
      if (db.users.find((u) => u.username.toLowerCase() === username.toLowerCase())) {
        sendError(res, 400, "This username is already in use. Please choose a different one.");
        return;
      }
      
      // Create doctor record
      const doctor = {
        id: nextId(db, "DOC", 3),
        name,
        specialization,
        username,
        email: `${username}@nisarg.local`,
      };
      
      // Create user account for doctor
      const docUser = {
        id: nextId(db, "U", 1),
        username,
        passwordHash: hashPassword(password),
        name,
        role: "doctor",
        initials: initials(name),
        title: `Doctor . ${specialization}`,
        phone: "",
        email: `${username}@nisarg.local`,
        isActive: true,
        createdAt: nowIso(),
        lastLoginAt: null,
      };
      
      db.doctors.push(doctor);
      db.users.push(docUser);
      addAudit(db, user.id, `Doctor created: ${doctor.id} with login ${username}`);
      writeDb(db);
      sendDb(res, 201, db, { doctor: { ...doctor, generatedPassword: password } });
      return;
    }

    if (pathname === "/api/appointments" && req.method === "POST") {
      if (!requireRole(user, ["admin", "receptionist"], res)) return;
      const payload = await readBody(req);
      const db = readDb();
      const patient = db.patients.find((item) => item.id === payload.patientId);
      const doctor = db.doctors.find((item) => item.id === payload.doctorId);
      if (!patient || !doctor || !String(payload.purpose || "").trim()) {
        sendError(res, 400, "Patient, doctor, and purpose are required.");
        return;
      }
      
      // Auto-cancel incomplete appointments from previous day
      const today = todayStr();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      db.appointments.forEach((apt) => {
        if (apt.date === yesterdayStr && ["Confirmed", "Waiting", "In Session"].includes(apt.status)) {
          apt.status = "Cancelled";
        }
      });
      
      const appointment = {
        id: nextId(db, "APT", 4),
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        date: String(payload.date || today),
        time: String(payload.time || ""),
        purpose: String(payload.purpose).trim(),
        status: payload.status || "Confirmed",
        createdAt: nowIso(),
      };
      db.appointments.push(appointment);
      addAudit(db, user.id, `Appointment created: ${appointment.id}`);
      writeDb(db);
      sendDb(res, 201, db, { appointment });
      return;
    }

    if (
      pathname.startsWith("/api/appointments/") &&
      pathname.endsWith("/status") &&
      req.method === "PATCH"
    ) {
      if (!requireRole(user, ["admin", "receptionist", "doctor"], res)) return;
      const id = decodeURIComponent(pathname.split("/")[3]);
      const payload = await readBody(req);
      const db = readDb();
      const appointment = db.appointments.find((item) => item.id === id);
      if (!appointment) {
        sendError(res, 404, "Appointment not found");
        return;
      }
      const allowed = ["Confirmed", "Waiting", "In Session", "Completed", "Cancelled"];
      if (!allowed.includes(payload.status)) {
        sendError(res, 400, "Invalid appointment status.");
        return;
      }
      appointment.status = payload.status;
      addAudit(
        db,
        user.id,
        `Appointment status updated: ${appointment.id} -> ${appointment.status}`,
      );
      writeDb(db);
      sendDb(res, 200, db, { appointment });
      return;
    }

    if (pathname === "/api/bills" && req.method === "POST") {
      if (!requireRole(user, ["admin", "receptionist", "doctor"], res)) return;
      const payload = await readBody(req);
      const db = readDb();
      const patient = db.patients.find((item) => item.id === payload.patientId);
      const items = Array.isArray(payload.items) ? payload.items : [];
      const validItems = items
        .map((item) => ({
          desc: String(item.desc || "").trim(),
          qty: Math.max(1, Number(item.qty || 1)),
          price: Math.max(0, Number(item.price || 0)),
        }))
        .filter((item) => item.desc);
      if (!patient || !validItems.length) {
        sendError(res, 400, "Patient and at least one bill item are required.");
        return;
      }
      const subtotal = validItems.reduce((sum, item) => sum + item.qty * item.price, 0);
      const discount = Math.max(0, Number(payload.discount || 0));
      const tax = Math.max(0, Number(payload.tax || 0));
      const bill = {
        id: nextId(db, "BILL", 4),
        patientId: patient.id,
        patientName: patient.name,
        appointmentId: payload.appointmentId || undefined,
        items: validItems,
        discount,
        tax,
        total: Math.max(0, subtotal - discount + tax),
        paymentMode: payload.paymentMode || "Cash",
        status: payload.status || "Paid",
        date: nowIso(),
      };
      db.bills.unshift(bill);
      addAudit(db, user.id, `Bill created: ${bill.id}`);
      writeDb(db);
      sendDb(res, 201, db, { bill });
      return;
    }

    if (pathname === "/api/prescriptions" && req.method === "POST") {
      if (!requireRole(user, ["admin", "doctor"], res)) return;
      const payload = await readBody(req);
      const db = readDb();
      const patient = db.patients.find((item) => item.id === payload.patientId);
      const doctor = db.doctors.find((item) => item.id === payload.doctorId);
      const meds = Array.isArray(payload.meds)
        ? payload.meds.filter(
            (med) => String(med.name || "").trim() && String(med.dosage || "").trim(),
          )
        : [];
      if (!patient || !doctor || !String(payload.diagnosis || "").trim() || !meds.length) {
        sendError(res, 400, "Patient, doctor, diagnosis, and medicine are required.");
        return;
      }
      const prescription = {
        id: nextId(db, "RX", 4),
        patientId: patient.id,
        patientName: patient.name,
        doctorId: doctor.id,
        doctorName: doctor.name,
        diagnosis: String(payload.diagnosis).trim(),
        meds: meds.map(med => ({
          name: String(med.name).trim(),
          dosage: String(med.dosage).trim(),
          duration: String(med.duration || "").trim(),
          notes: med.notes ? String(med.notes).trim() : undefined,
          frequency: med.frequency ? Number(med.frequency) : undefined,
          timing: med.timing ? String(med.timing).trim() : undefined,
        })),
        advice: String(payload.advice || "").trim() || undefined,
        date: nowIso(),
      };
      db.prescriptions.unshift(prescription);
      addAudit(db, user.id, `Prescription created: ${prescription.id}`);
      writeDb(db);
      sendDb(res, 201, db, { prescription });
      return;
    }

    if (pathname === "/api/lab-reports" && req.method === "POST") {
      if (!requireRole(user, ["admin", "receptionist"], res)) return;
      const payload = await readBody(req);
      const db = readDb();
      const patient = db.patients.find((item) => item.id === payload.patientId);
      if (
        !patient ||
        !String(payload.name || "").trim() ||
        !payload.fileName ||
        !payload.fileDataUrl
      ) {
        sendError(res, 400, "Patient, report name, and file are required.");
        return;
      }
      const report = {
        id: nextId(db, "LAB", 4),
        patientId: patient.id,
        patientName: patient.name,
        name: String(payload.name).trim(),
        type: String(payload.type || "Pathology"),
        date: String(payload.date || todayStr()),
        fileName: String(payload.fileName),
        fileSize: Number(payload.fileSize || 0),
        uploadedAt: nowIso(),
      };
      report.filePath = storeLabFile(report.id, report.fileName, payload.fileDataUrl);
      report.fileSize = fs.statSync(report.filePath).size;
      db.labReports.unshift(report);
      addAudit(db, user.id, `Lab report uploaded: ${report.id}`);
      writeDb(db);
      sendDb(res, 201, db, {
        report: publicData(db).labReports.find((item) => item.id === report.id),
      });
      return;
    }

    if (
      pathname.startsWith("/api/lab-reports/") &&
      pathname.endsWith("/download") &&
      req.method === "GET"
    ) {
      const id = decodeURIComponent(pathname.split("/")[3]);
      const db = readDb();
      const report = db.labReports.find((item) => item.id === id);
      const filePath = safeUploadPath(report?.filePath);
      if (!report || !filePath || !fs.existsSync(filePath)) {
        sendError(res, 404, "Report file not found");
        return;
      }
      const ext = path.extname(report.fileName).toLowerCase();
      const mime =
        ext === ".pdf"
          ? "application/pdf"
          : ext === ".png"
            ? "image/png"
            : ext === ".jpg" || ext === ".jpeg"
              ? "image/jpeg"
              : "application/octet-stream";
      res.writeHead(200, {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="${path.basename(report.fileName).replaceAll('"', "")}"`,
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    if (pathname === "/api/notes" && req.method === "POST") {
      if (!requireRole(user, ["admin", "doctor"], res)) return;
      const payload = await readBody(req);
      const db = readDb();
      const patient = db.patients.find((item) => item.id === payload.patientId);
      const text = String(payload.text || "").trim();
      if (!patient || !text || text.length > 2000) {
        sendError(res, 400, "Valid patient and note text are required.");
        return;
      }
      const note = {
        id: nextId(db, "NOTE", 4),
        patientId: patient.id,
        doctorId: user.id,
        doctorName: user.name,
        text,
        createdAt: nowIso(),
      };
      db.notes.unshift(note);
      addAudit(db, user.id, `Doctor note created: ${note.id}`);
      writeDb(db);
      sendDb(res, 201, db, { note });
      return;
    }

    if (pathname.startsWith("/api/notes/") && req.method === "DELETE") {
      if (!requireRole(user, ["admin", "doctor"], res)) return;
      const id = decodeURIComponent(pathname.split("/").pop());
      const db = readDb();
      const before = db.notes.length;
      db.notes = db.notes.filter((note) => note.id !== id);
      if (db.notes.length === before) {
        sendError(res, 404, "Note not found");
        return;
      }
      addAudit(db, user.id, `Doctor note deleted: ${id}`);
      writeDb(db);
      sendDb(res, 200, db);
      return;
    }

    if (pathname === "/api/profile" && req.method === "PUT") {
      const payload = await readBody(req);
      const db = readDb();
      const storedUser = db.users.find((item) => item.id === user.id);
      if (!storedUser) {
        sendError(res, 404, "User not found");
        return;
      }
      const name = String(payload.name || "").trim();
      if (name.length < 2) {
        sendError(res, 400, "Name is required.");
        return;
      }
      storedUser.name = name;
      storedUser.phone = String(payload.phone || "").trim();
      storedUser.email = String(payload.email || "").trim();
      storedUser.initials = initials(storedUser.name);
      if (payload.currentPassword || payload.newPassword) {
        if (!verifyPassword(String(payload.currentPassword || ""), storedUser.passwordHash)) {
          sendError(res, 400, "Current password is incorrect.");
          return;
        }
        if (String(payload.newPassword || "").length < 8) {
          sendError(res, 400, "New password must be at least 8 characters.");
          return;
        }
        storedUser.passwordHash = hashPassword(String(payload.newPassword));
      }
      addAudit(db, user.id, "Profile updated");
      writeDb(db);
      sendJson(res, 200, { user: publicUser(storedUser), data: publicData(db) });
      return;
    }

    if (pathname === "/api/settings" && req.method === "PUT") {
      if (!requireRole(user, ["admin"], res)) return;
      const payload = await readBody(req);
      const db = readDb();
      db.settings = {
        clinicName: String(payload.clinicName || "").trim() || db.settings.clinicName,
        doctorName: String(payload.doctorName || "").trim() || db.settings.doctorName,
        address: String(payload.address || "").trim(),
        phone: String(payload.phone || "").trim(),
        consultationHours: String(payload.consultationHours || "").trim(),
        slotDuration: Math.max(5, Number(payload.slotDuration || 30)),
        defaultConsultationFee: Math.max(0, Number(payload.defaultConsultationFee || 0)),
        prescriptionFooter: String(payload.prescriptionFooter || "").trim(),
      };
      addAudit(db, user.id, "Settings updated");
      writeDb(db);
      sendDb(res, 200, db, { settings: db.settings });
      return;
    }

    if (pathname === "/api/backup" && req.method === "POST") {
      if (!requireRole(user, ["admin"], res)) return;
      const db = readDb();
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupRoot = path.join(DATA_DIR, "backups", `backup-${stamp}`);
      fs.mkdirSync(backupRoot, { recursive: true });
      fs.copyFileSync(DB_FILE, path.join(backupRoot, "database.json"));
      copyRecursive(path.join(DATA_DIR, "uploads"), path.join(backupRoot, "uploads"));
      db.lastBackup = {
        name: path.basename(backupRoot),
        path: backupRoot,
        createdAt: nowIso(),
      };
      addAudit(db, user.id, `Backup created: ${db.lastBackup.name}`);
      writeDb(db);
      sendDb(res, 200, db, { backup: db.lastBackup });
      return;
    }

    sendError(res, 404, "API route not found");
  } catch (error) {
    sendError(res, 500, error.message || "Internal server error");
  }
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  if (requestUrl.pathname.startsWith("/api/")) {
    handleApi(req, res, decodeURIComponent(requestUrl.pathname));
    return;
  }
  sendJson(res, 200, { ok: true, service: "Nisarg HMS local API" });
});

ensureDirectories();
readDb();

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Nisarg HMS API running at http://127.0.0.1:${PORT}`);
});
