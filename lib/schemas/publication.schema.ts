import { z } from "zod";

export const publicationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum([
    "Journal Article",
    "Conference Paper",
    "Book",
    "Book Chapter",
    "Workshop Paper",
    "Technical Report",
    "Patent",
    "Thesis",
  ]),
  authors: z.string().min(1, "Authors are required"),
  year: z
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  venue: z.string().min(1, "Publication venue is required"),
  doi: z.string().optional(),
  abstract: z.string().optional(),
  url: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  citationCount: z.number().min(0).optional(),
  issn: z.string().optional(),
  isbn: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const researchProjectSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  role: z.enum(["PI", "Co-PI", "Collaborator"]),
  fundingAgency: z.string().min(1, "Funding agency is required"),
  sanctionedAmount: z.number().min(0).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  status: z.enum(["Ongoing", "Completed", "Submitted", "Approved", "Rejected"]),
  abstract: z.string().optional(),
  coInvestigators: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const awardSchema = z.object({
  awardName: z.string().min(2, "Award name is required"),
  awardingBody: z.string().min(2, "Awarding body is required"),
  category: z.string().min(1, "Category is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const workshopSchema = z.object({
  programName: z.string().min(2, "Program name is required"),
  type: z.enum(["FDP", "STTP", "Workshop", "Seminar", "Conference", "Training"]),
  mode: z.enum(["Online", "Offline", "Hybrid"]),
  isOrganized: z.boolean().default(false),
  organizer: z.string().optional(),
  sponsoringAgency: z.string().optional(),
  participantsCount: z.number().min(0).optional(),
  durationDays: z.number().min(1).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const patentSchema = z.object({
  title: z.string().min(3, "Title is required"),
  applicationNumber: z.string().min(1, "Application number is required"),
  type: z.enum(["Patent", "Copyright", "Design"]),
  status: z.enum(["Filed", "Published", "Granted", "Rejected"]),
  dateFiled: z.string().min(1, "Date filed is required"),
  dateGranted: z.string().optional(),
  description: z.string().optional(),
  inventors: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const membershipSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  membershipType: z.enum(["Life Member", "Fellow", "Associate Member", "Member", "Senior Member"]),
  memberId: z.string().optional(),
  validFrom: z.string().min(1, "Valid from date is required"),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const contributionSchema = z.object({
  contributionType: z.enum([
    "Board Member",
    "Reviewer",
    "Committee Member",
    "Editorial Board",
    "Session Chair",
    "Keynote Speaker",
    "Resource Person",
    "External Examiner",
  ]),
  organization: z.string().min(2, "Organization is required"),
  role: z.string().min(2, "Role description is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const interactionSchema = z.object({
  industry: z.string().min(2, "Industry/Organization is required"),
  type: z.enum([
    "MOU",
    "Collaboration",
    "Consultancy",
    "Guest Lecture",
    "Industrial Visit",
    "Project Guidance",
    "Research Partnership",
  ]),
  topic: z.string().min(2, "Topic is required"),
  date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  outcome: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export const financialSupportSchema = z.object({
  type: z.enum([
    "Travel Grant",
    "Seed Money",
    "Sponsored Project",
    "Scholarship",
    "Fellowship",
    "Conference Support",
    "Equipment Grant",
  ]),
  fundingAgency: z.string().min(2, "Funding agency is required"),
  amount: z.number().min(0, "Amount must be positive"),
  purpose: z.string().min(2, "Purpose is required"),
  year: z.number().min(1990).max(new Date().getFullYear() + 1),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});

export type PublicationFormData = z.infer<typeof publicationSchema>;
export type ResearchProjectFormData = z.infer<typeof researchProjectSchema>;
export type AwardFormData = z.infer<typeof awardSchema>;
export type WorkshopFormData = z.infer<typeof workshopSchema>;
export type PatentFormData = z.infer<typeof patentSchema>;
export type MembershipFormData = z.infer<typeof membershipSchema>;
export type ContributionFormData = z.infer<typeof contributionSchema>;
export type InteractionFormData = z.infer<typeof interactionSchema>;
export type FinancialSupportFormData = z.infer<typeof financialSupportSchema>;
