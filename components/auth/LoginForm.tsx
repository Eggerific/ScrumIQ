"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { getFriendlyAuthError } from "@/lib/auth-messages";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/** Login form content only — used inside AuthCardShell in (auth) layout (tab switcher is in shell). */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!email.trim()) next.email = "Email is required";
    if (!password.trim()) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthErrorMessage(null);
    if (!validate()) return;
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setAuthErrorMessage(
          getFriendlyAuthError(error.message) ?? "Invalid email or password."
        );
        return;
      }
      setSuccess(true);
    } catch {
      setAuthErrorMessage("Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setIsExiting(true), 2000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    if (!isExiting) return;
    const t = setTimeout(() => router.push("/dashboard"), 450);
    return () => clearTimeout(t);
  }, [isExiting, router]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex min-h-full w-full flex-1 flex-col items-center justify-center px-6 py-10 md:px-10"
      >
        <div
          className="mb-6 h-10 w-10 animate-spin rounded-full border-2 border-[var(--auth-border)] border-t-[var(--auth-accent)]"
          aria-hidden
        />
        <p className="text-sm font-medium text-white">Signing you in…</p>
        <p className="mt-1 text-xs text-zinc-400">Taking you to your dashboard.</p>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{
          opacity: isExiting ? 0 : 1,
          scale: isExiting ? 0.98 : 1,
        }}
        transition={{
          duration: isExiting ? 0.4 : 0.35,
          ease: [0.25, 0.1, 0.25, 1],
        }}
        className="flex min-h-full w-full flex-1 flex-col items-center justify-center px-6 py-10 text-center md:px-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--auth-accent)]/20 text-[var(--auth-accent)]"
        >
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </motion.div>
        <h2 className="text-xl font-semibold text-white">Welcome back!</h2>
        <p className="mt-2 text-sm text-zinc-400">Taking you to your dashboard…</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      className="flex min-h-full w-full flex-1 flex-col items-stretch px-6 pb-6 pt-0 md:px-10 md:pb-10 md:pt-0"
    >
      <div className="flex min-h-full w-full flex-1 flex-col items-stretch">
        <h1 className="shrink-0 text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-1 shrink-0 text-sm text-zinc-400">
          Sign in to your account to continue.
        </p>

        {/* Form block — extra spacing so login panel height matches register */}
        <div className="min-h-0 flex-1">
          <form onSubmit={handleSubmit} className="mt-6 space-y-7 md:space-y-8">
        {/* Auth error banner — shown on failed login */}
        {authErrorMessage && (
          <div
            className={cn(
              "rounded-xl border px-4 py-3 text-sm",
              "border-red-500/50 bg-red-500/10 text-red-400"
            )}
          >
            {authErrorMessage}
          </div>
        )}

        {/* Email */}
        <div className="md:pt-1">
          <label
            htmlFor="login-email"
            className="mb-2 block text-sm font-medium text-zinc-300"
          >
            Email
          </label>
          <input
            id="login-email"
            type="email"
            data-auth-input
            placeholder="m@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
            }}
            className={cn(
              "w-full rounded-xl border bg-[var(--auth-bg)] px-4 py-3 text-white placeholder-zinc-500",
              "border-[var(--auth-border)] focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]/40"
            )}
          />
          {errors.email && (
            <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div className="md:pt-1">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-zinc-300"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-[var(--auth-accent)] hover:underline"
            >
              Forgot your password?
            </Link>
          </div>
          <input
            id="login-password"
            type="password"
            data-auth-input
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: "" }));
            }}
            className={cn(
              "w-full rounded-xl border bg-[var(--auth-bg)] px-4 py-3 text-white placeholder-zinc-500",
              "border-[var(--auth-border)] focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]/40"
            )}
          />
          {errors.password && (
            <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>
          )}
        </div>

        <div className="md:pt-2">
          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--auth-accent)] py-3 font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] focus:ring-offset-2 focus:ring-offset-[var(--auth-card)]"
          >
            Login
          </button>
        </div>
        </form>
        </div>

        <p className="mt-8 shrink-0 text-center text-xs text-zinc-500 md:mt-10">
        By signing in, you agree to our{" "}
        <Link href="/terms" className="text-[var(--auth-accent)] hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-[var(--auth-accent)] hover:underline">
          Privacy Policy
        </Link>
        .
        </p>
      </div>
    </motion.div>
  );
}
