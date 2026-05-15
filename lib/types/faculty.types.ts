import { Timestamp } from "firebase/firestore";

export type Designation =
  | "Professor"
  | "Associate Professor"
  | "Assistant Professor"
  | "Lecturer"
  | "Senior Lecturer"
  | "Professor & Head"
  | "Associate Professor & Head"
  | "Assistant Professor & Head"
  | "Visiting Faculty"
  | "Adjunct Faculty";

export interface Faculty {
  id?: string;
  userId: string;
  departmentId: string;
  employeeId: string;
  displayName: string;
  designation: Designation;
  qualification: string[];
  joiningDate: Timestamp;
  profilePhotoUrl: string | null;
  phone: string;
  alternatePhone?: string;
  email: string;
  address: string;
  dateOfBirth?: Timestamp;
  gender?: "Male" | "Female" | "Other";
  experience?: number;
  specialization?: string[];
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type PublicationType =
  | "Journal Article"
  | "Conference Paper"
  | "Book"
  | "Book Chapter"
  | "Workshop Paper"
  | "Technical Report"
  | "Patent"
  | "Thesis";

export interface Publication {
  id?: string;
  facultyId: string;
  departmentId: string;
  title: string;
  type: PublicationType;
  authors: string[];
  year: number;
  venue: string;
  doi?: string;
  abstract?: string;
  url?: string;
  citationCount?: number;
  fileUrl?: string;
  fileName?: string;
  issn?: string;
  isbn?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type ResearchStatus = "Ongoing" | "Completed" | "Submitted" | "Approved" | "Rejected";
export type ResearchRole = "PI" | "Co-PI" | "Collaborator";

export interface ResearchProject {
  id?: string;
  facultyId: string;
  title: string;
  role: ResearchRole;
  fundingAgency: string;
  sanctionedAmount?: number;
  startDate: Timestamp;
  endDate?: Timestamp;
  status: ResearchStatus;
  abstract?: string;
  coInvestigators?: string[];
  fileUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export interface Award {
  id?: string;
  facultyId: string;
  awardName: string;
  awardingBody: string;
  category: string;
  date: Timestamp;
  description?: string;
  certificateUrl?: string;
  fileName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type WorkshopType = "FDP" | "STTP" | "Workshop" | "Seminar" | "Conference" | "Training";
export type WorkshopMode = "Online" | "Offline" | "Hybrid";

export interface Workshop {
  id?: string;
  facultyId: string;
  programName: string;
  type: WorkshopType;
  mode: WorkshopMode;
  isOrganized: boolean;
  organizer?: string;
  sponsoringAgency?: string;
  participantsCount?: number;
  durationDays?: number;
  startDate: Timestamp;
  endDate?: Timestamp;
  certificateUrl?: string;
  fileName?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type PatentType = "Patent" | "Copyright" | "Design";
export type PatentStatus = "Filed" | "Published" | "Granted" | "Rejected";

export interface Patent {
  id?: string;
  facultyId: string;
  title: string;
  applicationNumber: string;
  type: PatentType;
  status: PatentStatus;
  dateFiled: Timestamp;
  dateGranted?: Timestamp;
  description?: string;
  inventors?: string[];
  fileUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type MembershipType = "Life Member" | "Fellow" | "Associate Member" | "Member" | "Senior Member";

export interface Membership {
  id?: string;
  facultyId: string;
  organizationName: string;
  membershipType: MembershipType;
  memberId?: string;
  validFrom: Timestamp;
  validUntil?: Timestamp;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type ContributionType =
  | "Board Member"
  | "Reviewer"
  | "Committee Member"
  | "Editorial Board"
  | "Session Chair"
  | "Keynote Speaker"
  | "Resource Person"
  | "External Examiner";

export interface Contribution {
  id?: string;
  facultyId: string;
  contributionType: ContributionType;
  organization: string;
  role: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type InteractionType =
  | "MOU"
  | "Collaboration"
  | "Consultancy"
  | "Guest Lecture"
  | "Industrial Visit"
  | "Project Guidance"
  | "Research Partnership";

export interface Interaction {
  id?: string;
  facultyId: string;
  industry: string;
  type: InteractionType;
  topic: string;
  date: Timestamp;
  description?: string;
  outcome?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type FinancialSupportType =
  | "Travel Grant"
  | "Seed Money"
  | "Sponsored Project"
  | "Scholarship"
  | "Fellowship"
  | "Conference Support"
  | "Equipment Grant";

export interface FinancialSupport {
  id?: string;
  facultyId: string;
  type: FinancialSupportType;
  fundingAgency: string;
  amount: number;
  purpose: string;
  year: number;
  description?: string;
  fileUrl?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  blocked?: boolean;
  [key: string]: any;
}

export type DegreeType =
  | "Ph.D."
  | "M.Tech"
  | "M.E."
  | "M.Sc."
  | "M.Phil."
  | "MBA"
  | "MCA"
  | "B.Tech"
  | "B.E."
  | "B.Sc."
  | "B.Com"
  | "B.A."
  | "Post Doctoral"
  | "Other";

export interface Qualification {
  id?: string;
  facultyId: string;
  degree: DegreeType;
  fieldSpecialization: string;
  institution: string;
  yearOfPassing: number;
  grade?: string;
  cgpa?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  [key: string]: any;
}
