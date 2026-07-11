import { createClient } from "@/lib/supabase/server";

/**
 * Returns the authenticated user from the current server request, or null
 * if the session is missing or invalid.
 *
 * Always use this instead of `getSession()` on the server — getUser()
 * re-validates the token with Supabase Auth on every call, making it
 * safe to trust for authorization decisions.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
