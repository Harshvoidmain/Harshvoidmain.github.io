import { Timestamp } from "firebase/firestore";

export interface Department {
  id?: string;
  departmentId: string;
  code: string;
  name: string;
  shortName: string;
  hodUserId: string | null;
  hodName?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  isActive?: boolean;
  description?: string;
  facultyCount?: number;
  studentCount?: number;
  publicationCount?: number;
}

export const INITIAL_DEPARTMENTS: Omit<Department, "createdAt" | "updatedAt">[] = [
  { departmentId: "001", code: "CS", name: "Computer Science & Engineering", shortName: "CSE", hodUserId: null },
  { departmentId: "002", code: "IT", name: "Information Technology", shortName: "IT", hodUserId: null },
  { departmentId: "003", code: "ME", name: "Mechanical Engineering", shortName: "ME", hodUserId: null },
  { departmentId: "004", code: "CE", name: "Civil Engineering", shortName: "CE", hodUserId: null },
  { departmentId: "005", code: "EE", name: "Electrical Engineering", shortName: "EE", hodUserId: null },
  { departmentId: "006", code: "EC", name: "Electronics & Communication", shortName: "ECE", hodUserId: null },
  { departmentId: "007", code: "CH", name: "Chemical Engineering", shortName: "CHE", hodUserId: null },
  { departmentId: "008", code: "MCA", name: "Master of Computer Applications", shortName: "MCA", hodUserId: null },
  { departmentId: "009", code: "MBA", name: "Master of Business Administration", shortName: "MBA", hodUserId: null },
  { departmentId: "010", code: "PH", name: "Physics", shortName: "PHY", hodUserId: null },
  { departmentId: "011", code: "MA", name: "Mathematics", shortName: "MATH", hodUserId: null },
  { departmentId: "012", code: "EN", name: "English", shortName: "ENG", hodUserId: null },
];
