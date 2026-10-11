import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

const firstWord = (s?: unknown) =>
  typeof s === "string" ? s.trim().split(/\s+/)[0] ?? "" : "";

/**
 * First name for the "Hi, ___" greeting. Reads the profile row first, then
 * falls back to the signup metadata stored on the auth user, so it works
 * even if the profile row is missing or the DB migration hasn't been run.
 */
export function getFirstName(user: User | null, profile: Profile | null): string {
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  return (
    (profile?.first_name ?? "").trim() ||
    firstWord(profile?.full_name) ||
    (typeof meta.first_name === "string" ? meta.first_name.trim() : "") ||
    firstWord(meta.full_name) ||
    ""
  );
}
