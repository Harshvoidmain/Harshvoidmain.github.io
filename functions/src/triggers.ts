import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const onUserCreated = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const db = admin.firestore();
    const userData = snap.data();
    const { userId } = context.params;

    // Log to audit trail
    await db.collection("auditLogs").add({
      userId: "system",
      userEmail: "system@ims",
      userName: "System",
      action: "created",
      entityType: "user",
      entityId: userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        role: userData.role,
        email: userData.email,
      },
    });

    // Send password setup email via Firebase Auth if email exists
    if (userData.email) {
      try {
        const link = await admin.auth().generatePasswordResetLink(userData.email, {
          url: `${process.env.APP_URL ?? "http://localhost:3000"}/login`,
          handleCodeInApp: false,
        });

        functions.logger.info(`Password reset link generated for ${userData.email}`);
        // In production, you'd send this link via Nodemailer or SendGrid
        // The Firebase Auth default email templates also handle this
      } catch (error) {
        functions.logger.error("Failed to generate password reset link", error);
      }
    }

    functions.logger.info(`New user created: ${userData.email} (${userData.role})`);
  });

export const onUserUpdated = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const db = admin.firestore();
    const before = change.before.data();
    const after = change.after.data();
    const { userId } = context.params;

    // Detect permission changes
    if (JSON.stringify(before.modulePermissions) !== JSON.stringify(after.modulePermissions)) {
      await db.collection("auditLogs").add({
        userId: "system",
        userEmail: "system@ims",
        userName: "System",
        action: "permission_updated",
        entityType: "user",
        entityId: userId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        metadata: {
          email: after.email,
          role: after.role,
        },
      });
    }
  });

export const onFacultyDocCreated = functions.firestore
  .document("faculty/{facultyId}")
  .onCreate(async (snap, context) => {
    const db = admin.firestore();
    const data = snap.data();

    await db.collection("auditLogs").add({
      userId: data.createdBy ?? "system",
      userEmail: "system@ims",
      userName: "System",
      action: "created",
      entityType: "faculty",
      entityId: context.params.facultyId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { name: data.displayName, department: data.departmentId },
    });
  });
