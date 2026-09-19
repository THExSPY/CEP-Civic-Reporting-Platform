import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Supabase's email confirmation / magic link redirects here with a
// `code` param. Exchanging it sets the session cookie, then we bounce
// the user into the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
