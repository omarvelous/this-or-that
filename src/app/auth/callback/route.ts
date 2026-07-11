import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Handles the OAuth code exchange (Google, GitHub, etc.).
// Supabase redirects here with ?code=... after the provider flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // Something went wrong — send back to login with an error hint.
  return NextResponse.redirect(new URL("/login?error=auth", origin));
}
