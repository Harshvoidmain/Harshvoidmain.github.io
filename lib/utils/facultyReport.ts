import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import { createPDF, addPageNumbers, addSectionTitle, addSignatureSection, tableOptions, autoTable } from "./pdf";
import type { Faculty, Publication, ResearchProject, Award, Workshop, Patent } from "../types/faculty.types";
import { formatDate, formatCurrency } from "./formatters";

export async function generateFacultyReport(faculty: Faculty): Promise<void> {
  const doc = createPDF({
    institutionName: process.env.NEXT_PUBLIC_APP_NAME ?? "IMS Portal",
    reportTitle: "Faculty Comprehensive Report",
    generatedBy: faculty.displayName,
    departmentLabel: `Department [${faculty.departmentId}]`,
  });

  let y = 36;

  // Faculty info section
  y = addSectionTitle(doc, "Faculty Information", y);
  const infoData = [
    ["Name", faculty.displayName, "Employee ID", faculty.employeeId],
    ["Designation", faculty.designation, "Department", `[${faculty.departmentId}]`],
    ["Email", faculty.email, "Phone", faculty.phone],
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

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  // Publications
  const pubSnap = await getDocs(query(collection(db, `faculty/${faculty.id}/publications`), orderBy("year", "desc")));
  const publications = pubSnap.docs.map((d) => d.data() as Publication);

  if (publications.length > 0) {
    y = addSectionTitle(doc, `Publications (${publications.length})`, y);
    autoTable(doc, {
      head: [["#", "Title", "Type", "Year", "Venue", "Citations"]],
      body: publications.map((p, i) => [
        i + 1,
        p.title.length > 50 ? p.title.slice(0, 50) + "…" : p.title,
        p.type,
        p.year,
        p.venue.length > 30 ? p.venue.slice(0, 30) + "…" : p.venue,
        p.citationCount ?? 0,
      ]),
      ...tableOptions(y),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Research Projects
  const researchSnap = await getDocs(collection(db, `faculty/${faculty.id}/researchProjects`));
  const research = researchSnap.docs.map((d) => d.data() as ResearchProject);

  if (research.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Research Projects (${research.length})`, y);
    autoTable(doc, {
      head: [["#", "Title", "Role", "Funding Agency", "Amount", "Status"]],
      body: research.map((r, i) => [
        i + 1,
        r.title.length > 40 ? r.title.slice(0, 40) + "…" : r.title,
        r.role,
        r.fundingAgency,
        r.sanctionedAmount ? formatCurrency(r.sanctionedAmount) : "—",
        r.status,
      ]),
      ...tableOptions(y),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  // Awards
  const awardSnap = await getDocs(collection(db, `faculty/${faculty.id}/awards`));
  const awards = awardSnap.docs.map((d) => d.data() as Award);

  if (awards.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    y = addSectionTitle(doc, `Awards & Recognition (${awards.length})`, y);
    autoTable(doc, {
      head: [["#", "Award", "Awarding Body", "Category", "Date"]],
      body: awards.map((a, i) => [
        i + 1,
        a.awardName,
        a.awardingBody,
        a.category,
        formatDate(a.date),
      ]),
      ...tableOptions(y),
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  addSignatureSection(doc, y + 10);
  addPageNumbers(doc);

  doc.save(`Faculty_Report_${faculty.displayName.replace(/\s+/g, "_")}_${new Date().getFullYear()}.pdf`);
}
