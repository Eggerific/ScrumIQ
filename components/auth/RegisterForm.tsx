"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFriendlyAuthError } from "@/lib/auth-messages";
import { isValidEmailFormat } from "@/lib/validation";

/** Register form content only — used inside AuthCardShell in (auth) layout (tab switcher is in shell). */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [requiresConfirmation, setRequiresConfirmation] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Please enter your name";
    if (!email.trim()) next.email = "Email is required";
    else if (!isValidEmailFormat(email)) next.email = "Please enter a valid email address";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) next.confirmPassword = "Passwords do not match";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: name.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message =
          getFriendlyAuthError(data.error) ?? data.error ?? "Registration failed";
        setErrors({ form: message });
        return;
      }
      setSuccess(true);
      setRequiresConfirmation(!!data.requiresConfirmation);
    } catch (err) {
      setErrors({ form: "Something went wrong. Please try again." });
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
    const t = setTimeout(
      () => router.push(requiresConfirmation ? "/login" : "/projects"),
      450
    );
    return () => clearTimeout(t);
  }, [isExiting, requiresConfirmation, router]);

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
        <p className="text-sm font-medium text-white">Creating your account…</p>
        <p className="mt-1 text-xs text-zinc-400">You’ll be signed in automatically.</p>
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
        <h2 className="text-xl font-semibold text-white">
          {requiresConfirmation ? "Check your email" : "Account created!"}
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          {requiresConfirmation
            ? "We sent you a confirmation link. Click it to verify your account, then sign in below."
            : "Taking you to your projects…"}
        </p>
        {requiresConfirmation && (
          <a
            href="/login"
            className="mt-6 inline-block rounded-xl bg-[var(--auth-accent)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
          >
            Go to Login
          </a>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
      className="flex min-h-0 w-full flex-1 flex-col items-stretch px-6 pb-6 pt-0 md:px-10 md:pb-10 md:pt-0"
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <h1 className="shrink-0 text-2xl font-bold text-white">Create your account</h1>
        <p className="mt-1 shrink-0 text-sm text-zinc-400">Fill in your details to get started.</p>

        <div className="min-h-0 flex-1">
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
            Name
          </label>
          <input
            id="name"
            type="text"
            data-auth-input
            placeholder="Your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            className={cn(
              "w-full rounded-xl border bg-[var(--auth-bg)] px-4 py-3 text-white placeholder-zinc-500",
              "border-[var(--auth-border)] focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]/40"
            )}
          />
          {errors.name && (
            <p className="mt-1.5 text-sm text-red-400">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            id="email"
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

        {/* Password + Confirm — 2-column grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              data-auth-input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
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
          <div>
            <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-zinc-300">
              Confirm
            </label>
            <input
              id="confirm"
              type="password"
              data-auth-input
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              className={cn(
                "w-full rounded-xl border bg-[var(--auth-bg)] px-4 py-3 text-white placeholder-zinc-500",
                "border-[var(--auth-border)] focus:border-[var(--auth-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)]/40"
              )}
            />
            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-red-400">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        {errors.form && (
          <p className="text-sm text-red-400">{errors.form}</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-[var(--auth-accent)] py-3 font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--auth-accent)] focus:ring-offset-2 focus:ring-offset-[var(--auth-card)] disabled:opacity-70"
        >
          Create Account
        </button>
          </form>
        </div>

        <p className="mt-6 shrink-0 text-center text-xs text-zinc-500">
        By creating an account, you agree to our{" "}
        <a href="/terms" className="text-[var(--auth-accent)] hover:underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="/privacy" className="text-[var(--auth-accent)] hover:underline">
          Privacy Policy
        </a>
        .
        </p>
      </div>
    </motion.div>
  );
}
