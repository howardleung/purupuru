export const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const isClerkConfigured = Boolean(
  clerkPublishableKey && clerkPublishableKey !== "pk_test_replace_me",
);