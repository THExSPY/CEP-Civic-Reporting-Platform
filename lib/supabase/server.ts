import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Used in Server Components, Route Handlers, and Server Actions.
// Next.js 15 made cookies() async, and @supabase/ssr now wants
// getAll/setAll instead of the old get/set/remove trio.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component - middleware refreshes sessions instead.
          }
        },
      },
    }
  );
}
