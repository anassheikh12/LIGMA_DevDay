"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormEvent } from "react";
import { login } from "@/lib/auth-client";

function resolveRedirect(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

const inputClass =
  "w-full bg-surface-1 border border-border text-ink px-4 py-3 rounded-md text-[15px] focus:outline-none focus:border-ink focus:border-2 placeholder:text-ink-subtle mb-5";

const labelClass = "text-sm font-medium text-ink mb-2 block";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 1) {
      setError("Please enter your password.");
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
      await login(email, password);
      router.push(resolveRedirect(searchParams.get("redirect")));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || !email || !password;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className={labelClass} htmlFor="login-email">
        Email
      </label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className={inputClass}
      />

      <label className={labelClass} htmlFor="login-password">
        Password
      </label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Your password"
        className={inputClass}
      />

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      <button
        type="submit"
        disabled={isDisabled}
        className="w-full bg-accent-yellow hover:bg-accent-yellow-hover text-ink font-semibold py-3.5 rounded-pill transition-all duration-120 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
