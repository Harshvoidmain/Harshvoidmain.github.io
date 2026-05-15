const admin = require("firebase-admin");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId,
  });
}

const db = admin.firestore();
const auth = admin.auth();
const now = admin.firestore.FieldValue.serverTimestamp();

const ROLE_DEFAULTS_FACULTY = {
  dashboard: { view: true },
  faculty: { view: false, create: false, edit: false, delete: false },
  publications: { view: true, create: true, edit: true, delete: true },
  research: { view: true, create: true, edit: true, delete: true },
  awards: { view: true, create: true, edit: true, delete: true },
  workshops: { view: true, create: true, edit: true, delete: true },
  patents: { view: true, create: true, edit: true, delete: true },
  memberships: { view: true, create: true, edit: true, delete: true },
  contributions: { view: true, create: true, edit: true, delete: true },
  departments: { view: true, create: false, edit: false, delete: false },
  students: { view: false, create: false, edit: false, delete: false },
  reports: { view: true, generate: true, download: true },
  settings: { view: false, edit: false },
  userManagement: { view: false, create: false, edit: false, delete: false },
  auditLogs: { view: false },
};

async function addSmita() {
  const email = "smita.dange@ims.edu";
  const password = "faculty@123";
  const displayName = "Smita Dange";
  const role = "faculty";
  const departmentId = "001"; 

  console.log(`Adding faculty user: ${email}...`);

  let uid;
  try {
    const existing = await auth.getUserByEmail(email);
    uid = existing.uid;
    console.log(`User already exists in Auth with UID: ${uid}. Updating password...`);
    await auth.updateUser(uid, { password, displayName });
  } catch {
    const created = await auth.createUser({ email, password, displayName });
    uid = created.uid;
    console.log(`Created new Auth user with UID: ${uid}`);
  }

  await db.collection("users").doc(uid).set({
    uid,
    email,
    displayName,
    role,
    departmentId,
    isActive: true,
    passwordResetRequired: false,
    modulePermissions: ROLE_DEFAULTS_FACULTY,
    createdAt: now,
    updatedAt: now,
    createdBy: "system-seed",
  }, { merge: true });

  await db.collection("faculty").doc(uid).set({
    uid,
    userId: uid,
    employeeId: "FAC-CS-101",
    displayName,
    email,
    departmentId,
    designation: "Assistant Professor",
    isActive: true,
    createdAt: now,
    updatedAt: now,
    profilePhotoUrl: null,
    joiningDate: now,
    phone: "9999999999",
    qualification: ["M.Tech", "Ph.D"],
    address: "IMS Campus",
  }, { merge: true });

  console.log("✓ Smita Dange successfully added/updated in Auth and Firestore.");
  process.exit(0);
}

addSmita().catch(err => {
  console.error("Failed to add user:", err);
  process.exit(1);
});
