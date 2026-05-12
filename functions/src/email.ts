import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export const sendEmailNotification = functions.https.onCall(
  async (data: { to: string; subject: string; text: string; html?: string }, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const transporter = createTransporter();

    try {
      await transporter.sendMail({
        from: `IMS Portal <${process.env.SMTP_FROM_EMAIL ?? "noreply@ims.edu"}>`,
        to: data.to,
        subject: data.subject,
        text: data.text,
        html: data.html ?? `<p>${data.text}</p>`,
      });

      functions.logger.info(`Email sent to ${data.to}: ${data.subject}`);
      return { success: true };
    } catch (error) {
      functions.logger.error("Email send error", error);
      throw new functions.https.HttpsError("internal", "Failed to send email.");
    }
  }
);

export const dailySummary = functions.pubsub
  .schedule("0 8 * * *")
  .timeZone("Asia/Kolkata")
  .onRun(async () => {
    const db = admin.firestore();

    // Get all HOD users
    const hodSnap = await db.collection("users").where("role", "==", "hod").get();
    const transporter = createTransporter();

    for (const hodDoc of hodSnap.docs) {
      const hod = hodDoc.data();
      if (!hod.email || !hod.isActive) continue;

      // Get yesterday's activity for the HOD's department
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const logsSnap = await db
        .collection("auditLogs")
        .where("timestamp", ">=", admin.firestore.Timestamp.fromDate(yesterday))
        .orderBy("timestamp", "desc")
        .limit(20)
        .get();

      if (logsSnap.empty) continue;

      const activityItems = logsSnap.docs
        .map((d) => {
          const l = d.data();
          return `• ${l.userName}: ${l.action} ${l.entityType} (${l.entityId.slice(0, 8)}…)`;
        })
        .join("\n");

      try {
        await transporter.sendMail({
          from: `IMS Portal <${process.env.SMTP_FROM_EMAIL ?? "noreply@ims.edu"}>`,
          to: hod.email,
          subject: `IMS Portal Daily Summary — ${new Date().toLocaleDateString("en-IN")}`,
          text: `Dear ${hod.displayName},\n\nHere is yesterday's activity summary:\n\n${activityItems}\n\nBest regards,\nIMS Portal`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
              <div style="background: #0F2557; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0;">IMS Portal — Daily Summary</h2>
                <p style="margin: 5px 0 0; opacity: 0.7;">${new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div style="padding: 20px; border: 1px solid #E5E7EB; border-top: none;">
                <p>Dear <strong>${hod.displayName}</strong>,</p>
                <p>Here is yesterday's system activity summary:</p>
                <ul>${logsSnap.docs.map((d) => {
                  const l = d.data();
                  return `<li>${l.userName}: <strong>${l.action}</strong> ${l.entityType}</li>`;
                }).join("")}</ul>
                <p style="color: #6B7280; font-size: 12px; margin-top: 20px;">This is an automated daily digest from IMS Portal.</p>
              </div>
            </div>
          `,
        });
      } catch (err) {
        functions.logger.error(`Failed to send daily summary to ${hod.email}`, err);
      }
    }

    functions.logger.info("Daily summary emails sent.");
  });
