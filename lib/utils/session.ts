// Accepts: string | number | Date | Firestore Timestamp | null | undefined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isCurrentSession(dateInput: any): boolean {
  if (dateInput === null || dateInput === undefined) return false;

  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // Determine current session boundaries
  let currentSessionStart: Date;
  let currentSessionEnd: Date;

  if (currentMonth >= 6 && currentMonth <= 12) {
    // June - Dec Session
    currentSessionStart = new Date(currentYear, 5, 1); // June 1st
    currentSessionEnd = new Date(currentYear, 11, 31, 23, 59, 59); // Dec 31st
  } else {
    // Jan - May Session
    currentSessionStart = new Date(currentYear, 0, 1); // Jan 1st
    currentSessionEnd = new Date(currentYear, 4, 31, 23, 59, 59); // May 31st
  }

  // Handle Firestore Timestamp (has .toDate() method)
  if (typeof dateInput === "object" && typeof dateInput.toDate === "function") {
    const date = dateInput.toDate() as Date;
    return date >= currentSessionStart && date <= currentSessionEnd;
  }

  // Handle number (just year)
  if (typeof dateInput === "number") {
    return dateInput === currentYear;
  }

  // Handle string
  if (typeof dateInput === "string") {
    // If string is just a year "2025"
    if (/^\d{4}$/.test(dateInput)) {
      return parseInt(dateInput, 10) === currentYear;
    }
  }

  // Convert to Date
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;

  return date >= currentSessionStart && date <= currentSessionEnd;
}
