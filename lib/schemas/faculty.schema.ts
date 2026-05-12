import { z } from "zod";

export const facultyPersonalInfoSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  dateOfBirth: z.string().optional(),
  phone: z.string().min(10, "Enter a valid phone number"),
  alternatePhone: z.string().optional(),
  email: z.string().email("Enter a valid email address"),
  address: z.string().min(5, "Address is too short"),
});

export const facultyAcademicInfoSchema = z.object({
  departmentId: z.string().min(1, "Department is required"),
  designation: z.enum([
    "Professor",
    "Associate Professor",
    "Assistant Professor",
    "Lecturer",
    "Senior Lecturer",
    "Professor & Head",
    "Associate Professor & Head",
    "Assistant Professor & Head",
    "Visiting Faculty",
    "Adjunct Faculty",
  ]),
  employeeId: z.string().min(1, "Employee ID is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  experience: z.number().min(0).optional(),
  specialization: z.array(z.string()).optional(),
  qualification: z.array(z.string()).min(1, "At least one qualification is required"),
});

export const facultyAccountSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export const qualificationSchema = z.object({
  degree: z.enum([
    "Ph.D.",
    "M.Tech",
    "M.E.",
    "M.Sc.",
    "M.Phil.",
    "MBA",
    "MCA",
    "B.Tech",
    "B.E.",
    "B.Sc.",
    "B.Com",
    "B.A.",
    "Post Doctoral",
    "Other",
  ]),
  fieldSpecialization: z.string().min(1, "Field/Specialization is required"),
  institution: z.string().min(1, "Institution is required"),
  yearOfPassing: z
    .number()
    .min(1950)
    .max(new Date().getFullYear()),
  grade: z.string().optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

export type FacultyPersonalInfoData = z.infer<typeof facultyPersonalInfoSchema>;
export type FacultyAcademicInfoData = z.infer<typeof facultyAcademicInfoSchema>;
export type FacultyAccountData = z.infer<typeof facultyAccountSchema>;
export type QualificationData = z.infer<typeof qualificationSchema>;
