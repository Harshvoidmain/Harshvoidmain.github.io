import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp();

export { onUserCreated } from "./triggers";
export { generateReport } from "./reports";
export { fetchDoiMetadata } from "./doi";
export { sendEmailNotification, dailySummary } from "./email";
