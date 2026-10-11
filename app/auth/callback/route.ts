import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function safeNext(next: string | null) {
  // Only allow same-site relative paths.
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  // Supabase sends error details here when the link is expired/already used.
  if (searchParams.get("error_description") || searchParams.get("error")) {
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return NextResponse.redirect(`${origin}/login?error=link`);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    // By the time Supabase redirects here with a code, it has already
    // confirmed the email. The code exchange fails when the link is opened in
    // a different browser/app than the one used to sign up (the PKCE verifier
    // lives there). The account is fine — they just need to log in.
    return NextResponse.redirect(`${origin}/login?notice=confirmed`);
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
