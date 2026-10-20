import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/types";

const ROLES: UserRole[] = ["resident", "volunteer", "recycler", "ngo", "admin", "ngo_admin"];

/**
 * Current user + profile for this request (memoised, so the layout and the
 * page share one lookup). If a signed-in user has no profile row — e.g. the
 * account was created before the signup trigger existed — one is created
 * from their signup metadata instead of treating them as logged out.
 */
export const getSessionContext = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null as Profile | null };

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    return (data as Profile | null) ?? null;
  };

  let profile = await fetchProfile();

  if (!profile) {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const metaRole = typeof meta.role === "string" ? meta.role : "";
    const first = typeof meta.first_name === "string" ? meta.first_name.trim() : "";
    const last = typeof meta.last_name === "string" ? meta.last_name.trim() : "";
    const fullName =
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      [first, last].filter(Boolean).join(" ") ||
      null;

    // Only columns that exist in the original schema, so this works whether
    // or not the first/last name migration has been applied.
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        full_name: fullName,
        role: (ROLES as string[]).includes(metaRole) ? metaRole : "resident",
        organization_name:
          typeof meta.organization_name === "string" ? meta.organization_name : null,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    profile = await fetchProfile();
  }

  return { supabase, user, profile };
});
