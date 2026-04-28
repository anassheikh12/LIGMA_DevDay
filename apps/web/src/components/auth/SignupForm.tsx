"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { signup } from "@/lib/auth-client";

function resolveRedirect(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

const inputClass =
  "w-full bg-white border-2 border-neutral-900 text-ink px-4 py-3 rounded-none text-[15px] focus:outline-none focus:ring-0 placeholder:text-neutral-400 mb-5";

const labelClass = "text-sm font-medium text-ink mb-2 block";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return false;
    }
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError("");

    try {
      await signup(name, email, password);
      router.push(resolveRedirect(searchParams.get("redirect")));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Signup failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isDisabled =
    loading || !name || !email || !password || !confirmPassword;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className={labelClass} htmlFor="signup-name">
        Name
      </label>
      <input
        id="signup-name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your full name"
        className={inputClass}
      />

      <label className={labelClass} htmlFor="signup-email">
        Email
      </label>
      <input
        id="signup-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={inputClass}
      />

      <label className={labelClass} htmlFor="signup-password">
        Password
      </label>
      <input
        id="signup-password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 6 characters"
        className={inputClass}
      />

      <label className={labelClass} htmlFor="signup-confirm-password">
        Confirm password
      </label>
      <input
        id="signup-confirm-password"
        type="password"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Re-enter your password"
        className={inputClass}
      />

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full bg-accent-yellow hover:bg-accent-yellow-hover text-ink font-bold py-3.5 rounded-none border-2 border-neutral-900 shadow-[4px_4px_0px_0px_#171717] transition-all duration-120 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
