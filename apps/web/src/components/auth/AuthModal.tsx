"use client";

import { useEffect, useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

type Tab = "login" | "signup";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: Tab;
};

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
}: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const tabClass = (tab: Tab) =>
    activeTab === tab
      ? "text-ink font-bold underline decoration-accent-yellow decoration-2 underline-offset-4"
      : "text-ink-muted font-medium hover:text-ink transition-colors";

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(35, 31, 32, 0.5)" }}
      role="dialog"
      aria-modal="true"
      aria-label={activeTab === "login" ? "Log in" : "Sign up"}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white border-2 border-neutral-900 shadow-[6px_6px_0px_0px_#171717] p-10 max-w-sm w-full"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1 rounded-md text-ink-muted hover:text-ink transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="4" y1="4" x2="14" y2="14" />
            <line x1="14" y1="4" x2="4" y2="14" />
          </svg>
        </button>

        <div className="flex gap-6 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={tabClass("login")}
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("signup")}
            className={tabClass("signup")}
          >
            Sign up
          </button>
        </div>

        {activeTab === "login" ? <LoginForm /> : <SignupForm />}

        <div className="mt-6 text-center text-sm text-ink-muted">
          {activeTab === "login" ? (
            <>
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("signup")}
                className="text-ink font-medium underline hover:text-ink-muted"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setActiveTab("login")}
                className="text-ink font-medium underline hover:text-ink-muted"
              >
                Log in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
