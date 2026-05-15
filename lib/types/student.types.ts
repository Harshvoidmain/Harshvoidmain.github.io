import { Timestamp } from "firebase/firestore";

export interface Student {
  id?: string;
  userId?: string | null;
  departmentId: string;
  rollNumber: string;
  displayName: string;
  email?: string;
  phone?: string;
  batch: string;
  year: number;
  semester?: number;
  gender?: "Male" | "Female" | "Other";
  dateOfBirth?: Timestamp;
  address?: string;
  cgpa?: number;
  status: "Active" | "Inactive" | "Graduated" | "Dropped";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export interface StudentAchievement {
  id?: string;
  studentId: string;
  title: string;
  type: "Academic" | "Sports" | "Cultural" | "Technical" | "Social" | "Other";
  description?: string;
  date: Timestamp;
  awardingBody?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
