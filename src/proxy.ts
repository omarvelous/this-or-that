import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

// Protected routes — redirect to /login if no session.
const PROTECTED = ["/polls/new", "/dashboard"];

export async function proxy(request: NextRequest) {
  // Refresh the session and propagate updated cookies to the response.
  const response = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((path) => pathname.startsWith(path));

  if (isProtected) {
    // Check the session cookie that updateSession just refreshed.
    const hasSession = request.cookies
      .getAll()
      .some(({ name }) => name.startsWith("sb-"));

    if (!hasSession) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all paths except static files and Next.js internals.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
