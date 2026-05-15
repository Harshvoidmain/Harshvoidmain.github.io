import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../firebase/config";
import { createPDF, addPageNumbers, addSectionTitle, addSignatureSection, tableOptions, autoTable } from "./pdf";
import type { 
  Faculty, 
  Publication, 
  ResearchProject, 
  Award, 
  Workshop, 
  Patent, 
  Membership, 
  Contribution, 
  Interaction, 
  FinancialSupport, 
  Qualification 
} from "../types/faculty.types";
import { formatDate, formatCurrency } from "./formatters";

export async function generateFacultyReport(faculty: Faculty, sessionFilter: string = "ALL", moduleId: string = "ALL"): Promise<void> {
  const MODULE_LABELS: Record<string, string> = {
    publications: "Publications",
    research: "Research Projects",
    workshops: "Workshops & Conferences",
    interactions: "Faculty Interactions",
    awards: "Awards & Recognition",
    patents: "Patents / Copyrights",
    memberships: "Professional Memberships",
    contributions: "Contributions",
    financial: "Financial Support",
    qualifications: "Qualifications",
  };
  const MODULE_SHORTS: Record<string, string> = {
    publications: "PUB", research: "RES", workshops: "WS", interactions: "INT",
    awards: "AWD", patents: "PAT", memberships: "MEM", contributions: "CON",
    financial: "FIN", qualifications: "QUAL", ALL: "ALL",
  };

  const reportTitle = moduleId === "ALL"
    ? "Faculty Comprehensive Academic Report"
    : `Faculty ${MODULE_LABELS[moduleId] ?? moduleId} Report`;

  const now = new Date();
  const doc = createPDF({
    institutionName: process.env.NEXT_PUBLIC_APP_NAME ?? "IMS Portal",
    reportTitle,
    generatedBy: faculty.displayName,
    generatedDate: now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }),
    generatedTime: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  });

  let y = 65;

  // Faculty info section - Show name, designation, email, dept, and generation time
  if (moduleId !== "ALL") {
    // For module-specific reports, show compact faculty info
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);
    doc.text(`Name: ${faculty.displayName}`, 15, y);
    y += 5;
    doc.text(`Designation: ${faculty.designation}`, 15, y);
    y += 5;
    doc.text(`Email: ${faculty.email}`, 15, y);
    y += 5;
    doc.text(`Department: ${faculty.departmentId}`, 15, y);
    y += 5;
    doc.text(`Generated on: ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} at ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`, 15, y);
    y += 10;
  } else {
    // For comprehensive reports, show full faculty information table
    y = addSectionTitle(doc, "Faculty Information", y);
    const infoData = [
      ["Full Name", faculty.displayName, "Employee ID", faculty.employeeId],
      ["Designation", faculty.designation, "Department", faculty.departmentId],
      ["Email", faculty.email, "Phone", faculty.phone || "—"],
      ["Joining Date", formatDate(faculty.joiningDate), "Status", faculty.isActive ? "Active" : "Inactive"],
    ];

    autoTable(doc, {
      body: infoData,
      ...tableOptions(y),
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 35 },
        2: { fontStyle: "bold", cellWidth: 35 },
      },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  const fetchFiltered = async (subpath: string, orderField: string = "createdAt") => {
    const q = query(collection(db, `faculty/${faculty.id}/${subpath}`), orderBy(orderField, "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(item => !item.blocked);
  };

  // Fetch only relevant modules based on moduleId
  const shouldFetch = (mod: string) => moduleId === "ALL" || moduleId === mod;

  // 1. Publications
  const publications: Publication[] = shouldFetch("publications") ? await fetchFiltered("publications", "year") : [];
  if (publications.length > 0) {
    y = addSectionTitle(doc, `Publications (${publications.length})`, y);
    autoTable(doc, {
      head: [["#", "Title", "Type", "Year", "Venue", "Citations"]],
      body: publications.map((p, i) => [
        i + 1,
        p.title,
        p.type,
        p.year,
        p.venue,
        p.citationCount ?? 0,
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 2. Research Projects
  const research: ResearchProject[] = shouldFetch("research") ? await fetchFiltered("researchProjects", "startDate") : [];
  if (research.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Research Projects (${research.length})`, y);
    autoTable(doc, {
      head: [["#", "Title", "Role", "Funding Agency", "Amount", "Status"]],
      body: research.map((r, i) => [
        i + 1,
        r.title,
        r.role,
        r.fundingAgency,
        r.sanctionedAmount ? formatCurrency(r.sanctionedAmount) : "—",
        r.status,
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 3. Workshops & Conferences
  const workshops: Workshop[] = shouldFetch("workshops") ? await fetchFiltered("workshops", "startDate") : [];
  if (workshops.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Workshops & Conferences (${workshops.length})`, y);
    autoTable(doc, {
      head: [["#", "Program Name", "Type", "Mode", "Date", "Duration"]],
      body: workshops.map((w, i) => [
        i + 1,
        w.programName,
        w.type,
        w.mode,
        formatDate(w.startDate),
        w.durationDays ? `${w.durationDays} Days` : "—",
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 4. Patents
  const patents: Patent[] = shouldFetch("patents") ? await fetchFiltered("patents", "dateFiled") : [];
  if (patents.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Patents & Copyrights (${patents.length})`, y);
    autoTable(doc, {
      head: [["#", "Title", "Type", "App No.", "Status", "Date"]],
      body: patents.map((p, i) => [
        i + 1,
        p.title,
        p.type,
        p.applicationNumber,
        p.status,
        formatDate(p.dateFiled),
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. Interactions
  const interactions: Interaction[] = shouldFetch("interactions") ? await fetchFiltered("interactions", "date") : [];
  if (interactions.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Faculty Interactions (${interactions.length})`, y);
    autoTable(doc, {
      head: [["#", "Organization", "Type", "Topic", "Date"]],
      body: interactions.map((it, i) => [
        i + 1,
        it.industry,
        it.type,
        it.topic,
        formatDate(it.date),
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 6. Financial Support
  const support: FinancialSupport[] = shouldFetch("financial") ? await fetchFiltered("financialSupport", "year") : [];
  if (support.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Financial Support (${support.length})`, y);
    autoTable(doc, {
      head: [["#", "Agency", "Type", "Purpose", "Amount", "Year"]],
      body: support.map((s, i) => [
        i + 1,
        s.fundingAgency,
        s.type,
        s.purpose,
        formatCurrency(s.amount),
        s.year,
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 7. Awards
  const awards: Award[] = shouldFetch("awards") ? await fetchFiltered("awards", "date") : [];
  if (awards.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Awards & Recognition (${awards.length})`, y);
    autoTable(doc, {
      head: [["#", "Award", "Body", "Category", "Date"]],
      body: awards.map((a, i) => [
        i + 1,
        a.awardName,
        a.awardingBody,
        a.category,
        formatDate(a.date),
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 8. Qualifications
  const quals: Qualification[] = shouldFetch("qualifications") ? await fetchFiltered("qualifications", "yearOfPassing") : [];
  if (quals.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Academic Qualifications (${quals.length})`, y);
    autoTable(doc, {
      head: [["Degree", "Field", "Institution", "Year", "CGPA/Grade"]],
      body: quals.map((q) => [
        q.degree,
        q.fieldSpecialization,
        q.institution,
        q.yearOfPassing,
        q.cgpa || q.grade || "—",
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 9. Memberships
  const memberships: Membership[] = shouldFetch("memberships") ? await fetchFiltered("memberships", "dateJoined") : [];
  if (memberships.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Professional Memberships (${memberships.length})`, y);
    autoTable(doc, {
      head: [["#", "Organization", "Role", "Status", "Date Joined"]],
      body: memberships.map((m, i) => [
        i + 1,
        m.organizationName,
        m.role || "Member",
        m.status || "Active",
        formatDate(m.dateJoined),
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // 10. Contributions
  const contributions: Contribution[] = shouldFetch("contributions") ? await fetchFiltered("contributions", "date") : [];
  if (contributions.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Contributions (${contributions.length})`, y);
    autoTable(doc, {
      head: [["#", "Description", "Type", "Date"]],
      body: contributions.map((c, i) => [
        i + 1,
        c.title || c.description || "—",
        c.type || "General",
        formatDate(c.date),
      ]),
      ...tableOptions(y),
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Fetch HOD information from department
  let hodName = "Head of Department";
  let hodDesig = "Head of Department";
  try {
    const deptQuery = query(collection(db, "departments"), where("departmentId", "==", faculty.departmentId));
    const deptSnap = await getDocs(deptQuery);
    if (!deptSnap.empty) {
      const dept = deptSnap.docs[0].data();
      if (dept.hodName) {
        hodName = dept.hodName;
      }
    }
  } catch (error) {
    console.warn("Failed to fetch HOD info:", error);
  }

  addSignatureSection(doc, y + 10, faculty.displayName, faculty.designation, hodName, hodDesig);
  addPageNumbers(doc);

  const dateFmt = now.toISOString().split("T")[0].replace(/-/g, "");
  const timeFmt = now.toTimeString().split(" ")[0].replace(/:/g, "");
  const shortForm = MODULE_SHORTS[moduleId] ?? "REP";
  const empId = faculty.employeeId ?? faculty.id;
  const filename = `REPORT_${shortForm}-${empId}_${dateFmt}_${timeFmt}.pdf`;
  doc.save(filename);
}
