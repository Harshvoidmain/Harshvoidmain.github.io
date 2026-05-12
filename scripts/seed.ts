/**
 * Firestore seed script — run once to bootstrap a fresh project.
 *
 * Usage:
 *   npx ts-node -e "require('./scripts/seed.ts')"
 *   — or —
 *   npx ts-node scripts/seed.ts
 *
 * Requires GOOGLE_APPLICATION_CREDENTIALS or Firebase Admin SDK env vars.
 * See .env.local.example for variable names.
 */

import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ── Firebase Admin init ────────────────────────────────────────────────────

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const projectId =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "your-firebase-project-id";

if (!admin.apps.length) {
  if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccountPath),
      projectId,
    });
  } else {
    // Falls back to Application Default Credentials (gcloud auth, emulator, etc.)
    admin.initializeApp({ projectId });
  }
}

const db = admin.firestore();
const auth = admin.auth();

// ── Helpers ────────────────────────────────────────────────────────────────

const now = admin.firestore.FieldValue.serverTimestamp();

function ts(date: Date) {
  return admin.firestore.Timestamp.fromDate(date);
}

function yrsAgo(n: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - n);
  return d;
}

async function upsertUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  try {
    const existing = await auth.getUserByEmail(email);
    return existing.uid;
  } catch {
    const created = await auth.createUser({ email, password, displayName });
    return created.uid;
  }
}

// ── Departments ────────────────────────────────────────────────────────────

const DEPARTMENTS = [
  { id: "001", code: "CS", name: "Computer Science", shortName: "CS" },
  { id: "002", code: "ME", name: "Mechanical Engineering", shortName: "ME" },
  { id: "003", code: "EE", name: "Electrical Engineering", shortName: "EE" },
  { id: "004", code: "CE", name: "Civil Engineering", shortName: "CE" },
  { id: "005", code: "EC", name: "Electronics & Communication", shortName: "EC" },
  { id: "006", code: "CH", name: "Chemical Engineering", shortName: "CH" },
  { id: "007", code: "MB", name: "Management & Business", shortName: "MB" },
  { id: "008", code: "PH", name: "Physics", shortName: "PH" },
  { id: "009", code: "MA", name: "Mathematics", shortName: "MA" },
  { id: "010", code: "BI", name: "Biotechnology", shortName: "BI" },
  { id: "011", code: "AR", name: "Architecture", shortName: "AR" },
  { id: "012", code: "EN", name: "English & Humanities", shortName: "EN" },
];

// ── Role default permissions ───────────────────────────────────────────────

const ROLE_DEFAULTS = {
  superadmin: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    faculty: { view: true, create: true, edit: true, delete: true },
    publications: { view: true, create: true, edit: true, delete: true },
    research: { view: true, create: true, edit: true, delete: true },
    awards: { view: true, create: true, edit: true, delete: true },
    workshops: { view: true, create: true, edit: true, delete: true },
    patents: { view: true, create: true, edit: true, delete: true },
    memberships: { view: true, create: true, edit: true, delete: true },
    contributions: { view: true, create: true, edit: true, delete: true },
    departments: { view: true, create: true, edit: true, delete: true },
    students: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    userManagement: { view: true, create: true, edit: true, delete: true },
    auditLogs: { view: true, create: true, edit: true, delete: true },
  },
  hod: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    faculty: { view: true, create: true, edit: true, delete: false },
    publications: { view: true, create: true, edit: true, delete: false },
    research: { view: true, create: true, edit: true, delete: false },
    awards: { view: true, create: true, edit: true, delete: false },
    workshops: { view: true, create: true, edit: true, delete: false },
    patents: { view: true, create: true, edit: true, delete: false },
    memberships: { view: true, create: true, edit: true, delete: false },
    contributions: { view: true, create: true, edit: true, delete: false },
    departments: { view: true, create: false, edit: false, delete: false },
    students: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: true, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    auditLogs: { view: false, create: false, edit: false, delete: false },
  },
  faculty: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    faculty: { view: true, create: false, edit: false, delete: false },
    publications: { view: true, create: true, edit: true, delete: true },
    research: { view: true, create: true, edit: true, delete: true },
    awards: { view: true, create: true, edit: true, delete: true },
    workshops: { view: true, create: true, edit: true, delete: true },
    patents: { view: true, create: true, edit: true, delete: true },
    memberships: { view: true, create: true, edit: true, delete: true },
    contributions: { view: true, create: true, edit: true, delete: true },
    departments: { view: true, create: false, edit: false, delete: false },
    students: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: true, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    userManagement: { view: false, create: false, edit: false, delete: false },
    auditLogs: { view: false, create: false, edit: false, delete: false },
  },
};

// ── Seed data ──────────────────────────────────────────────────────────────

const FACULTY_SEED = [
  {
    employeeId: "FAC-CS-001",
    displayName: "Dr. Priya Sharma",
    email: "priya.sharma@ims.edu",
    departmentId: "001",
    designation: "Professor",
    specialization: "Machine Learning & Data Science",
    phone: "+91-9876543210",
    joiningDate: ts(yrsAgo(12)),
    experience: 12,
    isHOD: true,
  },
  {
    employeeId: "FAC-ME-001",
    displayName: "Dr. Rajesh Kumar",
    email: "rajesh.kumar@ims.edu",
    departmentId: "002",
    designation: "Associate Professor",
    specialization: "Thermodynamics & Fluid Mechanics",
    phone: "+91-9876543211",
    joiningDate: ts(yrsAgo(8)),
    experience: 8,
    isHOD: false,
  },
  {
    employeeId: "FAC-EE-001",
    displayName: "Dr. Sunita Patel",
    email: "sunita.patel@ims.edu",
    departmentId: "003",
    designation: "Assistant Professor",
    specialization: "Power Systems & Renewable Energy",
    phone: "+91-9876543212",
    joiningDate: ts(yrsAgo(5)),
    experience: 5,
    isHOD: false,
  },
  {
    employeeId: "FAC-CS-002",
    displayName: "Prof. Anil Mehta",
    email: "anil.mehta@ims.edu",
    departmentId: "001",
    designation: "Associate Professor",
    specialization: "Computer Networks & Cybersecurity",
    phone: "+91-9876543213",
    joiningDate: ts(yrsAgo(9)),
    experience: 9,
    isHOD: false,
  },
  {
    employeeId: "FAC-MA-001",
    displayName: "Dr. Kavitha Nair",
    email: "kavitha.nair@ims.edu",
    departmentId: "009",
    designation: "Professor",
    specialization: "Applied Mathematics & Statistics",
    phone: "+91-9876543214",
    joiningDate: ts(yrsAgo(15)),
    experience: 15,
    isHOD: true,
  },
];

const SAMPLE_PUBLICATIONS = [
  {
    title: "Deep Learning Approaches for Medical Image Segmentation",
    authors: ["Dr. Priya Sharma", "Prof. Anil Mehta"],
    type: "journal",
    journal: "IEEE Transactions on Medical Imaging",
    year: 2023,
    volume: "42",
    issue: "3",
    pages: "789-801",
    doi: "10.1109/TMI.2023.123456",
    indexed: "SCI",
    issnIsbn: "0278-0062",
    citationCount: 12,
    impactFactor: 10.048,
  },
  {
    title: "Federated Learning for Privacy-Preserving Healthcare Analytics",
    authors: ["Dr. Priya Sharma"],
    type: "conference",
    journal: "NeurIPS 2023",
    year: 2023,
    volume: "",
    issue: "",
    pages: "1245-1257",
    doi: "10.48550/arxiv.2310.12345",
    indexed: "Scopus",
    issnIsbn: "",
    citationCount: 7,
  },
  {
    title: "Network Intrusion Detection Using Ensemble Methods",
    authors: ["Prof. Anil Mehta", "Dr. Priya Sharma"],
    type: "journal",
    journal: "Computers & Security",
    year: 2022,
    volume: "118",
    issue: "",
    pages: "102735",
    doi: "10.1016/j.cose.2022.102735",
    indexed: "SCI",
    issnIsbn: "0167-4048",
    citationCount: 23,
    impactFactor: 5.105,
  },
];

const SAMPLE_AWARDS = [
  {
    title: "Best Research Paper Award",
    awardingBody: "IEEE Computer Society",
    year: 2023,
    category: "Research",
    level: "International",
    description: "Awarded for outstanding contribution to AI in healthcare at IEEE BIBM 2023.",
  },
  {
    title: "Young Scientist Award",
    awardingBody: "Department of Science & Technology, Govt. of India",
    year: 2021,
    category: "Research",
    level: "National",
    description: "Recognizing exceptional contributions to machine learning research.",
  },
];

// ── Main seed function ─────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting Firestore seed…\n");

  // 1. SuperAdmin
  console.log("Creating SuperAdmin user…");
  const superAdminUid = await upsertUser(
    "superadmin@ims.edu",
    "Admin@12345",
    "Super Admin"
  );
  await db.collection("users").doc(superAdminUid).set(
    {
      uid: superAdminUid,
      email: "superadmin@ims.edu",
      displayName: "Super Admin",
      role: "superadmin",
      departmentId: null,
      isActive: true,
      passwordResetRequired: false,
      modulePermissions: ROLE_DEFAULTS.superadmin,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log(`  ✓ SuperAdmin: superadmin@ims.edu / Admin@12345 (uid: ${superAdminUid})`);

  // 2. Departments
  console.log("\nSeeding departments…");
  const batch1 = db.batch();
  for (const dept of DEPARTMENTS) {
    const ref = db.collection("departments").doc(dept.id);
    batch1.set(
      ref,
      {
        ...dept,
        facultyCount: 0,
        studentCount: 0,
        hodId: null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );
  }
  await batch1.commit();
  console.log(`  ✓ ${DEPARTMENTS.length} departments seeded`);

  // 3. Faculty (Auth + Firestore + HOD users)
  console.log("\nSeeding faculty…");
  const facultyIds: string[] = [];

  for (const fac of FACULTY_SEED) {
    const uid = await upsertUser(fac.email, "Faculty@12345", fac.displayName);
    facultyIds.push(uid);

    // Firestore faculty document
    await db.collection("faculty").doc(uid).set(
      {
        uid,
        ...fac,
        photoURL: null,
        qualifications: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // Firestore user document
    const role = fac.isHOD ? "hod" : "faculty";
    await db.collection("users").doc(uid).set(
      {
        uid,
        email: fac.email,
        displayName: fac.displayName,
        role,
        departmentId: fac.departmentId,
        isActive: true,
        passwordResetRequired: false,
        modulePermissions: role === "hod" ? ROLE_DEFAULTS.hod : ROLE_DEFAULTS.faculty,
        createdAt: now,
        updatedAt: now,
      },
      { merge: true }
    );

    // Update department HOD if applicable
    if (fac.isHOD) {
      await db.collection("departments").doc(fac.departmentId).update({ hodId: uid });
    }

    console.log(`  ✓ ${fac.displayName} <${fac.email}> [${role}]`);
  }

  // 4. Publications (subcollection under Dr. Priya Sharma — first faculty)
  console.log("\nSeeding sample publications…");
  const drPriyaUid = facultyIds[0];
  for (const pub of SAMPLE_PUBLICATIONS) {
    await db.collection("faculty").doc(drPriyaUid).collection("publications").add({
      ...pub,
      facultyId: drPriyaUid,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  ✓ ${SAMPLE_PUBLICATIONS.length} publications added for Dr. Priya Sharma`);

  // 5. Awards
  console.log("\nSeeding sample awards…");
  for (const award of SAMPLE_AWARDS) {
    await db.collection("faculty").doc(drPriyaUid).collection("awards").add({
      ...award,
      facultyId: drPriyaUid,
      certificateURL: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  console.log(`  ✓ ${SAMPLE_AWARDS.length} awards added for Dr. Priya Sharma`);

  // 6. System settings document
  console.log("\nSeeding system settings…");
  await db.collection("settings").doc("institution").set(
    {
      name: "Institute of Management Science",
      shortName: "IMS",
      address: "123 University Road, Knowledge City, India – 400001",
      website: "https://ims.edu",
      phone: "+91-22-1234-5678",
      email: "info@ims.edu",
      academicYear: "2024–25",
      logoURL: null,
      updatedAt: now,
    },
    { merge: true }
  );
  console.log("  ✓ Institution settings seeded");

  // 7. Audit log entry
  await db.collection("auditLogs").add({
    userId: superAdminUid,
    userEmail: "superadmin@ims.edu",
    userName: "Super Admin",
    action: "seed_script_run",
    entityType: "system",
    entityId: "seed",
    timestamp: now,
    metadata: { facultyCount: FACULTY_SEED.length, deptCount: DEPARTMENTS.length },
  });

  console.log("\n✅ Seed complete!\n");
  console.log("Default credentials:");
  console.log("  SuperAdmin : superadmin@ims.edu  / Admin@12345");
  console.log("  Faculty    : <email>@ims.edu     / Faculty@12345");
  console.log("\n⚠️  Change all passwords immediately after first login.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
