"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: UserRole; label: string; hint: string }[] = [
  { value: "resident", label: "Resident", hint: "Report issues near you" },
  { value: "volunteer", label: "Volunteer", hint: "Help with cleanup drives" },
  {
    value: "recycler",
    label: "Recycling Partner",
    hint: "Claim reports, schedule pickups",
  },
];

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("resident");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Pass profile fields as user metadata — a database trigger (see
    // supabase/schema.sql) reads this and creates the `profiles` row
    // server-side, which works whether or not email confirmation is on.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          organization_name: role === "recycler" ? orgName : null,
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
      <div className="mx-auto max-w-sm text-center">
        <h1 className="mb-2 text-xl font-bold">Check your inbox</h1>
        <p className="text-slate-600">
          We sent a confirmation link to {email}. Confirm your email, then{" "}
          <button onClick={() => router.push("/login")} className="text-river-600 underline">
            log in
          </button>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">Create an account</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">I am a…</label>
          <div className="grid grid-cols-1 gap-2">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center justify-between rounded-md border px-3 py-2 ${
                  role === opt.value ? "border-river-500 bg-river-50" : ""
                }`}
              >
                <span>
                  <span className="font-medium">{opt.label}</span>
                  <span className="ml-2 text-xs text-slate-500">{opt.hint}</span>
                </span>
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={role === opt.value}
                  onChange={() => setRole(opt.value)}
                />
              </label>
            ))}
          </div>
        </div>

        {role === "recycler" && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              Organization name
            </label>
            <input
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full rounded-md border px-3 py-2"
              placeholder="e.g. GreenLoop Recyclers"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-river-500 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
      </form>
    </div>
  );
}
