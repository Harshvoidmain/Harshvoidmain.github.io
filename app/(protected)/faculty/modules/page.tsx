"use client";

import { PageHeader } from "@/components/shared/PageHeader";
import { FacultyHub } from "@/components/faculty/FacultyHub";

export default function FacultyModulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Faculty Modules"
        subtitle="Manage your academic profile, publications, research, and professional contributions."
      />
      <FacultyHub />
    </div>
  );
}
