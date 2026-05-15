"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebase/config";
import type { Faculty, Publication, ResearchProject, Award } from "../types/faculty.types";

export function useFacultyList(departmentId?: string) {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const constraints = departmentId
      ? [where("departmentId", "==", departmentId), where("isActive", "==", true)]
      : [where("isActive", "==", true)];

    const q = query(collection(db, "faculty"), ...constraints, orderBy("displayName"));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setFaculty(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Faculty).filter(f => !f.blocked));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [departmentId]);

  return { faculty, loading, error };
}

export function useFacultyPublications(facultyId: string) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facultyId) return;

    const q = query(
      collection(db, `faculty/${facultyId}/publications`),
      orderBy("year", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setPublications(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Publication).filter(p => !p.blocked));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [facultyId]);

  return { publications, loading };
}

export function useFacultyResearch(facultyId: string) {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facultyId) return;

    const q = query(
      collection(db, `faculty/${facultyId}/researchProjects`),
      orderBy("startDate", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setProjects(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ResearchProject).filter(p => !p.blocked));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [facultyId]);

  return { projects, loading };
}

export function useFacultyAwards(facultyId: string) {
  const [awards, setAwards] = useState<Award[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!facultyId) return;

    const q = query(
      collection(db, `faculty/${facultyId}/awards`),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setAwards(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Award).filter(a => !a.blocked));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [facultyId]);

  return { awards, loading };
}
