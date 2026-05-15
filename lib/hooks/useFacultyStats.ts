"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export function useFacultyStats(facultyId: string) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facultyId) return;

    const paths = [
      "publications",
      "researchProjects",
      "workshops",
      "interactions",
      "awards",
      "patents",
      "memberships",
      "contributions",
      "financialSupport"
    ];

    const unsubs = paths.map(path => {
      return onSnapshot(collection(db, `faculty/${facultyId}/${path}`), (snap) => {
        const docs = snap.docs.map(d => ({ ...d.data(), id: d.id, _module: path }));
        setData(prev => {
          const filtered = prev.filter(item => item._module !== path);
          return [...filtered, ...docs];
        });
        setLoading(false);
      });
    });

    return () => unsubs.forEach(unsub => unsub());
  }, [facultyId]);

  const activeDocs = data.filter(d => !d.blocked);
  
  const counts = {
    publications: activeDocs.filter(d => d._module === "publications").length,
    research: activeDocs.filter(d => d._module === "researchProjects").length,
    workshops: activeDocs.filter(d => d._module === "workshops").length,
    interactions: activeDocs.filter(d => d._module === "interactions").length,
    awards: activeDocs.filter(d => d._module === "awards").length,
    patents: activeDocs.filter(d => d._module === "patents").length,
    memberships: activeDocs.filter(d => d._module === "memberships").length,
    contributions: activeDocs.filter(d => d._module === "contributions").length,
    financial: activeDocs.filter(d => d._module === "financialSupport").length,
  };

  const getSession = (dateObj: any) => {
    let date;
    if (dateObj?.toDate) date = dateObj.toDate();
    else if (typeof dateObj === "number") date = new Date(dateObj, 0, 1);
    else if (dateObj instanceof Date) date = dateObj;
    else return null;

    const year = date.getFullYear();
    const month = date.getMonth(); // 0-indexed
    if (month < 6) return `${year - 1}-${year % 100}`;
    return `${year}-${(year + 1) % 100}`;
  };

  const timelineMap: Record<string, number> = {};
  activeDocs.forEach(d => {
    const date = d.date || d.startDate || d.joiningDate || d.validFrom || (d.year ? new Date(d.year, 0, 1) : null);
    const session = getSession(date);
    if (session) {
      timelineMap[session] = (timelineMap[session] || 0) + 1;
    }
  });

  const timeline = Object.entries(timelineMap)
    .map(([session, count]) => ({ session, count }))
    .sort((a, b) => a.session.localeCompare(b.session))
    .slice(-5);

  const totalImpact = activeDocs.length;

  return { counts, timeline, totalImpact, loading };
}
