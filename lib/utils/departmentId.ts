export function formatDeptId(id: string | number): string {
  return String(id).padStart(3, "0");
}

export function getNextDeptId(existingIds: string[]): string {
  if (existingIds.length === 0) return "001";
  const max = Math.max(...existingIds.map((id) => parseInt(id, 10)));
  return formatDeptId(max + 1);
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
