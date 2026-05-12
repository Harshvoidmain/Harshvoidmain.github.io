"use client";

import { useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { changePasswordSchema, type ChangePasswordFormData } from "@/lib/schemas/user.schema";
import { changeUserPassword, getAuthErrorMessage } from "@/lib/firebase/auth";
import { updateUserDocument } from "@/lib/firebase/firestore";
import { AuthContext } from "@/lib/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

export default function ChangePasswordPage() {
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await changeUserPassword(data.newPassword);
      await updateUserDocument(user.uid, { passwordResetRequired: false });
      toast.success("Password updated successfully!");
      router.replace("/dashboard");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      toast.error(getAuthErrorMessage(code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface dark:bg-[#0D1117]">
      <div className="w-full max-w-sm">
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-8 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Welcome! Set your new password.
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              For security, you must set a new password before continuing.
            </p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-[rgb(var(--text-primary))]">
            Create new password
          </h2>
          <p className="text-muted text-sm mt-1">
            Choose a strong password to protect your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              label="New Password"
              type={showNew ? "text" : "password"}
              placeholder="Enter new password"
              leftIcon={<Lock className="w-4 h-4" />}
              rightElement={
                <button type="button" onClick={() => setShowNew((v) => !v)} className="text-muted">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              error={errors.newPassword?.message}
              required
              {...register("newPassword", {
                onChange: (e) => setPassword(e.target.value),
              })}
            />
            {/* Password strength indicator */}
            {password && (
              <div className="mt-3 space-y-1.5">
                {PASSWORD_RULES.map((rule) => {
                  const passes = rule.test(password);
                  return (
                    <div key={rule.label} className="flex items-center gap-2">
                      {passes ? (
                        <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-muted shrink-0" />
                      )}
                      <span className={`text-xs ${passes ? "text-success" : "text-muted"}`}>
                        {rule.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Input
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            placeholder="Repeat your password"
            leftIcon={<Lock className="w-4 h-4" />}
            rightElement={
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="text-muted">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />

          <Button type="submit" className="w-full mt-2" loading={isLoading}>
            Set New Password & Continue
          </Button>
        </form>
      </div>
    </div>
  );
}
