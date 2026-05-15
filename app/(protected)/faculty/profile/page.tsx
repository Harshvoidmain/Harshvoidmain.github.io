"use client";

import { useEffect, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "@/lib/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function FacultyProfileRedirect() {
  const { userDoc, initialized } = useContext(AuthContext);
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (!initialized) return;

    if (!userDoc) {
      router.replace("/login");
      return;
    }

    // In this system, we need the faculty document ID.
    // If the user is a faculty, their faculty document ID is often the same as their UID 
    // or stored in the user document.
    // Let's assume it's the facultyId field in userDoc or we need to find it.
    
    // For Smita, we created the faculty doc with her UID.
    const facultyId = userDoc.uid; 
    
    if (facultyId) {
      router.replace(`/faculty/${facultyId}${tab ? `?tab=${tab}` : ""}`);
    } else {
      router.replace("/dashboard");
    }
  }, [userDoc, initialized, router, tab]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-muted text-sm">Loading your profile...</p>
    </div>
  );
}
