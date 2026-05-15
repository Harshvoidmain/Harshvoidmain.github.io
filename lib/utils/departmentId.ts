export const DEPT_MAP: Record<string, string> = {
  "Computer": "10",
  "CS": "10",
  "CSE": "40",
  "EXTC": "30",
  "Electrical": "20",
  "Mechanical": "20"
};

export function getDeptIdByName(name: string): string {
  const normalized = name.split(" ")[0]; // Get first word
  return DEPT_MAP[normalized] || "00";
}

export function formatDeptId(id: string | number): string {
  return String(id).padStart(2, "0");
}

export function formatFacultyId(deptId: string, sequenceId: string | number): string {
  return `${deptId}${String(sequenceId).padStart(3, "0")}`;
}

export function getNextDeptId(existingIds: string[]): string {
  if (existingIds.length === 0) return "10";
  const max = Math.max(...existingIds.map((id) => parseInt(id, 10)));
  return formatDeptId(max + 10); // Simple increment logic for new depts
}

export function formatDeptDisplay(deptId: string, code: string, name: string): string {
  return `[${deptId}] ${code} — ${name}`;
}

export function formatDeptShort(deptId: string, code: string): string {
  return `[${deptId}] ${code}`;
}

export function formatDeptDropdown(deptId: string, name: string): string {
  return `[${deptId}] ${name}`;
}
