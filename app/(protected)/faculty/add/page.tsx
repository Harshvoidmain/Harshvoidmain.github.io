"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { serverTimestamp, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { addDocument } from "@/lib/firebase/firestore";
import { sendPasswordReset } from "@/lib/firebase/auth";
import { facultyPersonalInfoSchema, facultyAcademicInfoSchema, type FacultyPersonalInfoData, type FacultyAcademicInfoData } from "@/lib/schemas/faculty.schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageHeader";
import type { Department } from "@/lib/types/department.types";
import { formatFacultyId } from "@/lib/utils/departmentId";

const STEPS = ["Personal Info", "Academic Info", "Account Setup"];

const DESIGNATIONS = [
  "Professor", "Associate Professor", "Assistant Professor",
  "Lecturer", "Senior Lecturer", "Professor & Head",
  "Associate Professor & Head", "Assistant Professor & Head",
  "Visiting Faculty", "Adjunct Faculty",
];

export default function AddFacultyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [personalData, setPersonalData] = useState<FacultyPersonalInfoData | null>(null);
  const [academicData, setAcademicData] = useState<FacultyAcademicInfoData | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchDepts = async () => {
      const snap = await getDocs(query(collection(db, "departments"), where("isActive", "==", true)));
      setDepartments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Department)));
    };
    fetchDepts();
  }, []);

  const personalForm = useForm<FacultyPersonalInfoData>({
    resolver: zodResolver(facultyPersonalInfoSchema),
  });

  const academicForm = useForm<FacultyAcademicInfoData>({
    resolver: zodResolver(facultyAcademicInfoSchema),
  });

  const handleStep1 = personalForm.handleSubmit((data) => {
    setPersonalData(data);
    setAccountEmail(data.email);
    setStep(1);
  });

  const handleStep2 = academicForm.handleSubmit((data) => {
    setAcademicData(data);
    setStep(2);
  });

  const getNextSequenceId = async (deptId: string, designation: string): Promise<string> => {
    // 001 for HOD, 002 for Asst HOD, 003+ for others
    const isHod = designation.toLowerCase().includes("head");
    const isAsstHod = designation.toLowerCase().includes("asst") && designation.toLowerCase().includes("head");
    
    if (isHod && !isAsstHod) return "001";
    if (isAsstHod) return "002";

    // For others, find max sequenceId in that dept starting from 003
    const q = query(
      collection(db, "faculty"),
      where("departmentId", "==", deptId),
      orderBy("sequenceId", "desc"),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return "003";
    
    const lastSeq = parseInt(snap.docs[0].data().sequenceId || "002", 10);
    return String(Math.max(lastSeq + 1, 3)).padStart(3, "0");
  };

  const handleFinish = async () => {
    if (!personalData || !academicData) return;
    setSaving(true);
    try {
      const sequenceId = await getNextSequenceId(academicData.departmentId, academicData.designation);
      const customId = formatFacultyId(academicData.departmentId, sequenceId);

      const facultyId = await addDocument("faculty", {
        ...personalData,
        ...academicData,
        sequenceId,
        customId,
        userId: "",
        profilePhotoUrl: null,
        isActive: true,
        joiningDate: serverTimestamp(),
      });

      try {
        await sendPasswordReset(accountEmail);
      } catch {
        // Non-fatal — user can reset later
      }

      toast.success("Faculty member added successfully. Setup email sent.");
      router.push(`/faculty/${facultyId}`);
    } catch {
      toast.error("Failed to add faculty member.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => step > 0 ? setStep((s) => s - 1) : router.back()}
          className="p-1.5 rounded-md text-muted hover:text-primary hover:bg-primary/5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <PageHeader title="Add Faculty Member" subtitle="Fill in details across all steps" />
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8 max-w-lg">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className={`flex flex-col items-center gap-1.5 ${i <= step ? "" : "opacity-50"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors ${
                i < step ? "bg-primary border-primary text-white" :
                i === step ? "border-primary text-primary bg-white dark:bg-gray-900" :
                "border-border text-muted bg-white dark:bg-gray-900"
              }`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-medium whitespace-nowrap ${i === step ? "text-primary" : "text-muted"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mt-[-16px] mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="max-w-lg bg-white dark:bg-[#1C2128] rounded-lg border border-border p-6 shadow-card">
        {step === 0 && (
          <form onSubmit={handleStep1} className="space-y-4">
            <h3 className="font-heading font-semibold text-[rgb(var(--text-primary))]">Personal Information</h3>
            <Input label="Full Name" placeholder="Dr. Jane Smith" required {...personalForm.register("displayName")} error={personalForm.formState.errors.displayName?.message} />
            <div>
              <label className="block text-sm font-medium mb-1.5">Gender</label>
              <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...personalForm.register("gender")}>
                <option value="">Select gender…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input label="Email Address" type="email" placeholder="faculty@institution.edu" required {...personalForm.register("email")} error={personalForm.formState.errors.email?.message} />
            <Input label="Phone" placeholder="+91 9876543210" required {...personalForm.register("phone")} error={personalForm.formState.errors.phone?.message} />
            <Input label="Address" placeholder="123 University Road, City, State" required {...personalForm.register("address")} error={personalForm.formState.errors.address?.message} />
            <Button type="submit" variant="accent" className="w-full">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleStep2} className="space-y-4">
            <h3 className="font-heading font-semibold text-[rgb(var(--text-primary))]">Academic Information</h3>
            <div>
              <label className="block text-sm font-medium mb-1.5">Department <span className="text-error">*</span></label>
              <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...academicForm.register("departmentId")}>
                <option value="">Select department…</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.departmentId}>[{d.departmentId}] {d.name}</option>
                ))}
              </select>
              {academicForm.formState.errors.departmentId && <p className="field-error">{academicForm.formState.errors.departmentId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Designation <span className="text-error">*</span></label>
              <select className="w-full h-9 px-3 rounded-md border border-border bg-white dark:bg-gray-900 text-sm" {...academicForm.register("designation")}>
                <option value="">Select designation…</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {academicForm.formState.errors.designation && <p className="field-error">{academicForm.formState.errors.designation.message}</p>}
            </div>
            <Input label="Employee ID" placeholder="EMP001" required {...academicForm.register("employeeId")} error={academicForm.formState.errors.employeeId?.message} />
            <Input label="Joining Date" type="date" required {...academicForm.register("joiningDate")} error={academicForm.formState.errors.joiningDate?.message} />
            <Input label="Years of Experience" type="number" placeholder="5" {...academicForm.register("experience", { valueAsNumber: true })} />
            <Button type="submit" variant="accent" className="w-full">
              Continue <ArrowRight className="w-4 h-4" />
            </Button>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-heading font-semibold text-[rgb(var(--text-primary))]">Account Setup</h3>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-border">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-1">Account Email</p>
              <p className="text-sm text-muted">{accountEmail}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Setup Email Will Be Sent</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                    An account setup email will be sent to <strong>{accountEmail}</strong>.
                    The faculty member will set their own password upon first login.
                  </p>
                </div>
              </div>
            </div>
            <div className="border border-border rounded-lg p-4 space-y-2 text-sm">
              <p className="font-semibold text-[rgb(var(--text-primary))]">Summary</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted">Name:</div><div>{personalData?.displayName}</div>
                <div className="text-muted">Email:</div><div>{personalData?.email}</div>
                <div className="text-muted">Department:</div><div>[{academicData?.departmentId}]</div>
                <div className="text-muted">Designation:</div><div>{academicData?.designation}</div>
                <div className="text-muted">Employee ID:</div><div className="font-mono">{academicData?.employeeId}</div>
              </div>
            </div>
            <Button variant="accent" className="w-full" onClick={handleFinish} loading={saving}>
              <Check className="w-4 h-4" /> Create Faculty Account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
