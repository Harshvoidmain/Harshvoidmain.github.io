"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth-provider";

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

interface FacultyDataContextType {
  publications: Publication[];
  researchProjects: ResearchProject[];
  loading: boolean;
  error: string | null;
  refetchPublications: () => Promise<void>;
  refetchResearchProjects: () => Promise<void>;
}

const FacultyDataContext = createContext<FacultyDataContextType | undefined>(undefined);

export function FacultyDataProvider({ children }: { children: ReactNode }) {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [researchProjects, setResearchProjects] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();

  const fetchPublications = async () => {
    try {
      const response = await fetch("/api/faculty/publications");
      if (!response.ok) {
        throw new Error("Failed to fetch publications");
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setPublications(data.data);
        console.log("Publications loaded from provider:", data.data.length);
      }
    } catch (err) {
      console.error("Error fetching publications:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const fetchResearchProjects = async () => {
    try {
      const response = await fetch("/api/faculty/research-projects");
      if (!response.ok) {
        throw new Error("Failed to fetch research projects");
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setResearchProjects(data.data);
        console.log("Research projects loaded from provider:", data.data.length);
      }
    } catch (err) {
      console.error("Error fetching research projects:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      setError(null);
      setPublications([]);
      setResearchProjects([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchPublications(), fetchResearchProjects()]);
      setLoading(false);
    };

    loadData();
  }, [user, authLoading]);

  return (
    <FacultyDataContext.Provider
      value={{
        publications,
        researchProjects,
        loading,
        error,
        refetchPublications: fetchPublications,
        refetchResearchProjects: fetchResearchProjects,
      }}
    >
      {children}
    </FacultyDataContext.Provider>
  );
}

export function useFacultyData() {
  const context = useContext(FacultyDataContext);
  if (!context) {
    throw new Error("useFacultyData must be used within FacultyDataProvider");
  }
  return context;
}
