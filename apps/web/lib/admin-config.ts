const clerkUserIdPattern = /^user_[A-Za-z0-9]{8,128}$/;

export function parseAdminClerkUserIds(value: string | undefined): ReadonlySet<string> {
  if (!value) return new Set();
  return new Set(
    value.split(",").map((item) => item.trim()).filter((item) => clerkUserIdPattern.test(item)),
  );
}

export function isConfiguredAdmin(clerkUserId: string, value: string | undefined): boolean {
  return parseAdminClerkUserIds(value).has(clerkUserId);
}
