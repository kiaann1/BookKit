/** Emails that receive ADMIN on login (comma-separated in ADMIN_EMAILS). */
export function getBootstrapAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "kian.winwood1@gmail.com";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isBootstrapAdminEmail(email: string) {
  return getBootstrapAdminEmails().has(email.trim().toLowerCase());
}
