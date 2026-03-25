/**
 * Maps Supabase (and other) auth error messages to user-friendly copy.
 * Returns null if no mapping; caller can show the original message or a default.
 */
export function getFriendlyAuthError(serverMessage: string | undefined): string | null {
  if (!serverMessage?.trim()) return null;
  const lower = serverMessage.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("ratelimit")) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (
    lower.includes("email not confirmed") ||
    lower.includes("user not confirmed") ||
    lower.includes("confirm your email")
  ) {
    return "Please confirm your email using the link we sent you, then try signing in again.";
  }
  return null;
}
