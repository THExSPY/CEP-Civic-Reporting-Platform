"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DropletIcon } from "@/components/icons";

const NOTICES: Record<string, string> = {
  confirmed: "Email confirmed 🎉 Log in to continue.",
};
const ERRORS: Record<string, string> = {
  link: "That confirmation link is invalid or has expired. Try logging in — or sign up again to get a fresh link.",
};

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const supabase = createClient();

  const rawNext = params.get("next");
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const notice = NOTICES[params.get("notice") ?? ""];
  const urlError = ERRORS[params.get("error") ?? ""];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      setNeedsConfirm(/not confirmed/i.test(error.message));
      return;
    }
    router.push(next);
    router.refresh();
  }

  async function resend() {
    setInfo(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else {
      setError(null);
      setNeedsConfirm(false);
      setInfo("Confirmation email sent — check your inbox.");
    }
  }

  return (
    <div className="mx-auto max-w-sm pt-2 sm:pt-8">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-river-400 to-river-600 text-white shadow-md">
          <DropletIcon width={24} height={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500">Log in to track and manage your reports.</p>
      </div>

      <form onSubmit={handleLogin} className="card space-y-4">
        {(notice || urlError) && (
          <p
            className={`rounded-xl px-3 py-2.5 text-sm ${
              notice ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
            }`}
          >
            {notice ?? urlError}
          </p>
        )}
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>
        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
        {info && <p className="rounded-xl bg-green-50 px-3 py-2.5 text-sm text-green-800">{info}</p>}
        {needsConfirm && (
          <button type="button" onClick={resend} className="btn-secondary w-full">
            Resend confirmation email
          </button>
        )}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-river-600 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
