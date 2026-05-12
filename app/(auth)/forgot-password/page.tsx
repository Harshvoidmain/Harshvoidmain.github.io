"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/lib/schemas/user.schema";
import { sendPasswordReset, getAuthErrorMessage } from "@/lib/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await sendPasswordReset(data.email);
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code ?? "";
      // Always show success-like message to prevent email enumeration
      if (code === "auth/user-not-found") {
        setSubmittedEmail(data.email);
        setSubmitted(true);
      } else {
        toast.error(getAuthErrorMessage(code));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-surface dark:bg-[#0D1117]">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        {submitted ? (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="text-xl font-heading font-bold text-[rgb(var(--text-primary))] mb-2">
              Check your email
            </h2>
            <p className="text-muted text-sm mb-2">
              We sent a password reset link to:
            </p>
            <p className="font-medium text-[rgb(var(--text-primary))] text-sm mb-6">{submittedEmail}</p>
            <p className="text-muted text-xs">
              Didn&apos;t receive it? Check your spam folder or{" "}
              <button
                onClick={() => setSubmitted(false)}
                className="text-primary hover:underline"
              >
                try again
              </button>
              .
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-[rgb(var(--text-primary))]">
                Reset password
              </h2>
              <p className="text-muted text-sm mt-1">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@institution.edu"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register("email")}
              />

              <Button type="submit" className="w-full" loading={isLoading}>
                Send Reset Link
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
