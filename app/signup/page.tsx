"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DropletIcon } from "@/components/icons";

export default function SignupPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const first = firstName.trim();
    const last = lastName.trim();

    // All public signups start strictly as Citizen ('resident').
    // Platform Admins assign Volunteer, NGO, or Recycler roles via the Admin Console.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: first,
          last_name: last,
          full_name: `${first} ${last}`.trim(),
          role: "resident",
          organization_name: orgName.trim() || null,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (signUpError || !data.user) {
      setError(signUpError?.message ?? "Something went wrong.");
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-sm pt-8 text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-2xl">
          ✉️
        </span>
        <h1 className="mb-2 text-xl font-bold">Check your inbox</h1>
        <p className="text-slate-600 text-sm">
          We sent a confirmation link to <strong>{email}</strong>. Tap it to
          confirm your email, then log in to start reporting.
        </p>
        <Link href="/login" className="btn-primary mt-6 w-full">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm pt-2 sm:pt-6">
      <div className="mb-6 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-river-400 to-river-600 text-white shadow-md">
          <DropletIcon width={24} height={24} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
        <p className="text-sm text-slate-500">Join Pune&apos;s clean-up community.</p>
      </div>

      <form onSubmit={handleSignup} className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">Last name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="input"
            />
          </div>
        </div>

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
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <p className="mt-1 text-xs text-slate-400">At least 6 characters.</p>
        </div>

        <div>
          <label className="label">
            NGO / Volunteer Group / Company <span className="font-normal text-slate-400">(Optional)</span>
          </label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="e.g. Swachh Pune, GreenLoop Recyclers"
            className="input"
          />
          <p className="mt-1 text-[11px] text-slate-400 leading-tight">
            All signups start as Citizens. An administrator will review your affiliation to grant Volunteer or NGO access.
          </p>
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full !py-3">
          {loading ? "Creating account…" : "Create Citizen Account"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-river-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
