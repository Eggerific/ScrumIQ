/**
 * Basic email format validation (shared by client and server).
 * Catches obviously invalid input like "asdf" or "foo"; does not verify
 * the address exists or the domain has mail servers.
 */
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmailFormat(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length < 6 || trimmed.length > 254) return false;
  return EMAIL_FORMAT_REGEX.test(trimmed);
}
