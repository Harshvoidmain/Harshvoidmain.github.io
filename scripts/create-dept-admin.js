const admin = require('firebase-admin');

const serviceAccount = {
  "type": "service_account",
  "project_id": process.env.FIREBASE_PROJECT_ID || "ims2026-644fc",
  "private_key_id": "YOUR_PRIVATE_KEY_ID",
  "private_key": (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, '\n'),
  "client_email": process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@ims2026-644fc.iam.gserviceaccount.com",
  "client_id": "111451920708687788481",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40ims2026-644fc.iam.gserviceaccount.com"
};

require('dotenv').config({ path: '.env.local' });
serviceAccount.private_key = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
serviceAccount.client_email = process.env.FIREBASE_CLIENT_EMAIL;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

async function createDeptAdmin() {
  const email = "deptadmin@ims.edu";
  const password = "deptadmin@123";
  const departmentId = "001"; // Computer Science Department

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists in Auth:', userRecord.uid);
      await auth.updateUser(userRecord.uid, { password });
      console.log('Password updated.');
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email,
          password,
          displayName: "Department Admin",
        });
        console.log('Successfully created new user in Auth:', userRecord.uid);
      } else {
        throw e;
      }
    }

    const uid = userRecord.uid;
    const role = "deptadmin";

    // Create user document
    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set({
      email,
      displayName: "Department Admin",
      role,
      departmentId,
      isActive: true,
      employeeId: "ADMIN001",
      modulePermissions: {
        faculty: ["read"],
        students: ["read"],
        reports: ["read"],
        departments: ["read"]
      },
      passwordResetRequired: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    console.log('User document created in Firestore users collection.');
    console.log(`Department Admin user created successfully!`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Department: ${departmentId}`);
    console.log(`UID: ${uid}`);
    
    process.exit(0);

  } catch (error) {
    console.error('Error creating user:', error);
    process.exit(1);
  }
}

createDeptAdmin();
