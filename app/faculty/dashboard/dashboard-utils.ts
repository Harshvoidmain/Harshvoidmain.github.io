export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface CategoryData {
  currentSessionData: ChartDataPoint[];
  allSessionsData: ChartDataPoint[];
}

export interface Publication {
  id: number;
  publication_type: "journal" | "conference" | "book" | "book_chapter" | "other";
  publication_date: string;
}

export interface ResearchProject {
  id: number;
  description: string;
  status: string;
  start_date: string;
  title: string;
  faculty_name?: string;
  funding_agency?: string;
}

export interface Contribution {
  Contribution_ID: number;
  F_ID: number;
  Contribution_Type: string;
  Description: string;
  Contribution_Date: string;
}

export interface Workshop {
  id: number;
  faculty_id: number;
  title: string;
  type: string; // workshop, seminar, conference
  start_date: string;
}

export interface Membership {
  SrNo: number;
  F_ID: number;
  organization: string;
  Membership_Type: string; // senior member, professional member, fellow, others
  Start_Date: string;
}

export interface AwardData {
  award_id: number;
  faculty_id: number;
  award_name: string;
  organization: string;
  category: string; // teaching, research, service
  date: string;
}

export interface SessionInfo {
  season: string;
  year: number;
}

export const CHART_COLORS = [
  "#93c5fd", 
  "#d8b4fe", 
  "#f8a4d4", 
  "#fcd34d", 
  "#6ee7b7", 
  "#67e8f9", 
  "#fca5a5", 
  "#c7d2fe", 
  "#86efac", 
  "#bef264",
  "#fed7aa", 
];

export const PUBLICATION_LABELS = {
  journal: "Journal Articles",
  conference: "Conference Papers",
  book_chapter: "Book Chapters",
  other: "Other",
};

export const PUBLICATION_COLORS = {
  journal: "#93c5fd", 
  conference: "#d8b4fe", 
  book_chapter: "#67e8f9", 
  other: "#c7d2fe", 
};

/**
 * Determine academic session from a date
 * June-December = Current Session (e.g., "2024-2025")
 * January-May = Previous Session (e.g., "2023-2024")
 * 
 * @param dateString - Date string in format "YYYY-MM-DD"
 * @returns Session info with season string and year
 */
export const getSessionFromDate = (dateString: string): SessionInfo => {
  const date = new Date(dateString);
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const year = date.getFullYear();

  if (month >= 6) {
    return { season: `${year}-${year + 1}`, year };
  } else {
    return { season: `${year - 1}-${year}`, year: year - 1 };
  }
};

/** Get the current academic session (e.g., "2024-2025") */
export const getCurrentSession = (): string => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 6) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

/** Process publication data for dashboard charts */
export const processPublicationData = (publications: Publication[]): CategoryData => {
  const currentSession = getCurrentSession();

  const currentSessionPubs = publications.filter((pub) => {
    const session = getSessionFromDate(pub.publication_date);
    return session.season === currentSession;
  });

  const currentSessionCounts: Record<string, number> = {};
  currentSessionPubs.forEach((pub) => {
    const type = pub.publication_type;
    currentSessionCounts[type] = (currentSessionCounts[type] || 0) + 1;
  });

  const allSessionsCounts: Record<string, number> = {};
  publications.forEach((pub) => {
    const type = pub.publication_type;
    allSessionsCounts[type] = (allSessionsCounts[type] || 0) + 1;
  });

  const currentSessionData: ChartDataPoint[] = Object.entries(currentSessionCounts).map(
    ([type, count]) => ({
      name: PUBLICATION_LABELS[type as keyof typeof PUBLICATION_LABELS],
      value: count,
      color: PUBLICATION_COLORS[type as keyof typeof PUBLICATION_COLORS],
    })
  );

  const allSessionsData: ChartDataPoint[] = Object.entries(allSessionsCounts).map(
    ([type, count]) => ({
      name: PUBLICATION_LABELS[type as keyof typeof PUBLICATION_LABELS],
      value: count,
      color: PUBLICATION_COLORS[type as keyof typeof PUBLICATION_COLORS],
    })
  );

  return {
    currentSessionData,
    allSessionsData,
  };
};

export const RESEARCH_LABELS = {
  "ongoing": "Ongoing",
  "completed": "Completed",
  "planned": "Planned",
};

export const RESEARCH_COLORS = {
  "ongoing": "#6ee7b7", 
  "completed": "#93c5fd", 
  "planned": "#fcd34d",
};

/** Process research project data for dashboard charts */
export const processResearchProjectData = (projects: ResearchProject[]): CategoryData => {
  const currentSession = getCurrentSession();

  const currentSessionProjects = projects.filter((proj) => {
    const dateStr = proj.start_date.includes('-') ? proj.start_date : `${proj.start_date}-01-01`;
    const projectSession = getSessionFromDate(dateStr);
    return projectSession.season === currentSession;
  });

  const currentSessionCounts: Record<string, number> = {};
  currentSessionProjects.forEach((proj) => {
    const status = proj.status?.toLowerCase() || "unknown";
    currentSessionCounts[status] = (currentSessionCounts[status] || 0) + 1;
  });

  const allSessionsCounts: Record<string, number> = {};
  projects.forEach((proj) => {
    const status = proj.status?.toLowerCase() || "unknown";
    allSessionsCounts[status] = (allSessionsCounts[status] || 0) + 1;
  });

  const currentSessionData: ChartDataPoint[] = [];
  Object.entries(currentSessionCounts).forEach(([status, count]) => {
    const label = RESEARCH_LABELS[status as keyof typeof RESEARCH_LABELS] || status;
    const color = RESEARCH_COLORS[status as keyof typeof RESEARCH_COLORS] || '#9ca3af';
    currentSessionData.push({
      name: label,
      value: count,
      color,
    });
  });

  const allSessionsData: ChartDataPoint[] = [];
  Object.entries(allSessionsCounts).forEach(([status, count]) => {
    const label = RESEARCH_LABELS[status as keyof typeof RESEARCH_LABELS] || status;
    const color = RESEARCH_COLORS[status as keyof typeof RESEARCH_COLORS] || '#9ca3af';
    allSessionsData.push({
      name: label,
      value: count,
      color,
    });
  });

  return {
    currentSessionData,
    allSessionsData,
  };
};

// Contribution type mapping to categories
const CONTRIBUTION_CATEGORY_MAP: Record<string, string> = {
  // Academic Contributions
  "curriculum development": "Academic Contributions",
  "educational material": "Academic Contributions",
  "guest lecture": "Academic Contributions",
  "mentorship": "Academic Contributions",
  // Administrative Service
  "department service": "Administrative Service",
  "college service": "Administrative Service",
  "university service": "Administrative Service",
  "committee work": "Administrative Service",
  // Professional/External Engagement
  "professional service": "Professional/External Engagement",
  "community service": "Professional/External Engagement",
};

export const CONTRIBUTION_CATEGORY_LABELS = {
  "Academic Contributions": "Academic Contributions",
  "Administrative Service": "Administrative Service",
  "Professional/External Engagement": "Professional/External Engagement",
  "Other": "Other",
};

export const CONTRIBUTION_CATEGORY_COLORS = {
  "Academic Contributions": "#93c5fd",
  "Administrative Service": "#d8b4fe",
  "Professional/External Engagement": "#6ee7b7",
  "Other": "#c7d2fe",
};

export const WORKSHOP_LABELS = {
  "workshop": "Workshops",
  "seminar": "Seminars",
  "conference": "Conferences",
  "other": "Other",
};

export const WORKSHOP_COLORS = {
  "workshop": "#93c5fd",
  "seminar": "#d8b4fe",
  "conference": "#f8a4d4",
  "other": "#c7d2fe",
};

export const MEMBERSHIP_LABELS = {
  "senior member": "Senior Member",
  "professional member": "Professional Member",
  "fellow": "Fellow",
  "other": "Others",
};

export const MEMBERSHIP_COLORS = {
  "senior member": "#93c5fd",
  "professional member": "#d8b4fe",
  "fellow": "#6ee7b7",
  "other": "#c7d2fe",
};

export const AWARD_LABELS = {
  "teaching": "Teaching",
  "research": "Research",
  "service": "Service",
  "other": "Other",
};

export const AWARD_COLORS = {
  "teaching": "#93c5fd",
  "research": "#f8a4d4",
  "service": "#6ee7b7",
  "other": "#c7d2fe",
};

/** Process contribution data for dashboard charts */
export const processContributionData = (contributions: Contribution[]): CategoryData => {
  const currentSession = getCurrentSession();

  const currentSessionContribs = contributions.filter((contrib) => {
    const session = getSessionFromDate(contrib.Contribution_Date);
    return session.season === currentSession;
  });

  const currentSessionCounts: Record<string, number> = {};
  currentSessionContribs.forEach((contrib) => {
    const category = CONTRIBUTION_CATEGORY_MAP[contrib.Contribution_Type.toLowerCase()] || "Other";
    currentSessionCounts[category] = (currentSessionCounts[category] || 0) + 1;
  });

  const allSessionsCounts: Record<string, number> = {};
  contributions.forEach((contrib) => {
    const category = CONTRIBUTION_CATEGORY_MAP[contrib.Contribution_Type.toLowerCase()] || "Other";
    allSessionsCounts[category] = (allSessionsCounts[category] || 0) + 1;
  });

  const currentSessionData: ChartDataPoint[] = Object.entries(currentSessionCounts).map(
    ([category, count]) => ({
      name: CONTRIBUTION_CATEGORY_LABELS[category as keyof typeof CONTRIBUTION_CATEGORY_LABELS] || category,
      value: count,
      color: CONTRIBUTION_CATEGORY_COLORS[category as keyof typeof CONTRIBUTION_CATEGORY_COLORS],
    })
  );

  const allSessionsData: ChartDataPoint[] = Object.entries(allSessionsCounts).map(
    ([category, count]) => ({
      name: CONTRIBUTION_CATEGORY_LABELS[category as keyof typeof CONTRIBUTION_CATEGORY_LABELS] || category,
      value: count,
      color: CONTRIBUTION_CATEGORY_COLORS[category as keyof typeof CONTRIBUTION_CATEGORY_COLORS],
    })
  );

  return { currentSessionData, allSessionsData };
};

/** Process workshop data for dashboard charts */
export const processWorkshopData = (workshops: Workshop[]): CategoryData => {
  const currentSession = getCurrentSession();

  const currentSessionWorkshops = workshops.filter((ws) => {
    const session = getSessionFromDate(ws.start_date);
    return session.season === currentSession;
  });

  const currentSessionCounts: Record<string, number> = {};
  currentSessionWorkshops.forEach((ws) => {
    const type = ws.type?.toLowerCase() || "other";
    currentSessionCounts[type] = (currentSessionCounts[type] || 0) + 1;
  });

  const allSessionsCounts: Record<string, number> = {};
  workshops.forEach((ws) => {
    const type = ws.type?.toLowerCase() || "other";
    allSessionsCounts[type] = (allSessionsCounts[type] || 0) + 1;
  });

  const currentSessionData: ChartDataPoint[] = Object.entries(currentSessionCounts).map(
    ([type, count]) => ({
      name: WORKSHOP_LABELS[type as keyof typeof WORKSHOP_LABELS] || type,
      value: count,
      color: WORKSHOP_COLORS[type as keyof typeof WORKSHOP_COLORS],
    })
  );

  const allSessionsData: ChartDataPoint[] = Object.entries(allSessionsCounts).map(
    ([type, count]) => ({
      name: WORKSHOP_LABELS[type as keyof typeof WORKSHOP_LABELS] || type,
      value: count,
      color: WORKSHOP_COLORS[type as keyof typeof WORKSHOP_COLORS],
    })
  );

  return { currentSessionData, allSessionsData };
};

/** Process membership data for dashboard charts */
export const processMembershipData = (memberships: Membership[]): CategoryData => {
  const currentSession = getCurrentSession();

  const currentSessionMemberships = memberships.filter((mem) => {
    const session = getSessionFromDate(mem.Start_Date);
    return session.season === currentSession;
  });

  const currentSessionCounts: Record<string, number> = {};
  currentSessionMemberships.forEach((mem) => {
    const type = mem.Membership_Type?.toLowerCase() || "other";
    currentSessionCounts[type] = (currentSessionCounts[type] || 0) + 1;
  });

  const allSessionsCounts: Record<string, number> = {};
  memberships.forEach((mem) => {
    const type = mem.Membership_Type?.toLowerCase() || "other";
    allSessionsCounts[type] = (allSessionsCounts[type] || 0) + 1;
  });

  const currentSessionData: ChartDataPoint[] = Object.entries(currentSessionCounts).map(
    ([type, count]) => ({
      name: MEMBERSHIP_LABELS[type as keyof typeof MEMBERSHIP_LABELS] || type,
      value: count,
      color: MEMBERSHIP_COLORS[type as keyof typeof MEMBERSHIP_COLORS],
    })
  );

  const allSessionsData: ChartDataPoint[] = Object.entries(allSessionsCounts).map(
    ([type, count]) => ({
      name: MEMBERSHIP_LABELS[type as keyof typeof MEMBERSHIP_LABELS] || type,
      value: count,
      color: MEMBERSHIP_COLORS[type as keyof typeof MEMBERSHIP_COLORS],
    })
  );

  return { currentSessionData, allSessionsData };
};

/** Process award data for dashboard charts */
export const processAwardData = (awards: AwardData[]): CategoryData => {
  const currentSession = getCurrentSession();

  const currentSessionAwards = awards.filter((award) => {
    const session = getSessionFromDate(award.date);
    return session.season === currentSession;
  });

  const currentSessionCounts: Record<string, number> = {};
  currentSessionAwards.forEach((award) => {
    const category = award.category?.toLowerCase() || "other";
    currentSessionCounts[category] = (currentSessionCounts[category] || 0) + 1;
  });

  const allSessionsCounts: Record<string, number> = {};
  awards.forEach((award) => {
    const category = award.category?.toLowerCase() || "other";
    allSessionsCounts[category] = (allSessionsCounts[category] || 0) + 1;
  });

  const currentSessionData: ChartDataPoint[] = Object.entries(currentSessionCounts).map(
    ([category, count]) => ({
      name: AWARD_LABELS[category as keyof typeof AWARD_LABELS] || category,
      value: count,
      color: AWARD_COLORS[category as keyof typeof AWARD_COLORS],
    })
  );

  const allSessionsData: ChartDataPoint[] = Object.entries(allSessionsCounts).map(
    ([category, count]) => ({
      name: AWARD_LABELS[category as keyof typeof AWARD_LABELS] || category,
      value: count,
      color: AWARD_COLORS[category as keyof typeof AWARD_COLORS],
    })
  );

  return { currentSessionData, allSessionsData };
};
