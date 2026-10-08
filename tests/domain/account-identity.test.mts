import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

let clerkUser: Record<string, unknown> | null;
let localUser: Record<string, unknown> | null;
let profile: Record<string, unknown> | null;

Object.assign(globalThis, {
  __purupuruAccountIdentityTest: {
    get clerkUser() { return clerkUser; },
    get localUser() { return localUser; },
    get profile() { return profile; },
  },
});

const hooks = registerHooks({
  resolve(specifier, _context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
    if (specifier === "@clerk/nextjs/server") {
      return {
        url: "data:text/javascript,export async function currentUser(){return globalThis.__purupuruAccountIdentityTest.clerkUser}",
        shortCircuit: true,
      };
    }
    if (specifier === "@beauty-platform/domain/profile") {
      return {
        url: "data:text/javascript,export function deriveInitialDisplayName(first,full){return first?.trim()||full?.trim()||'PuruPuru User'}",
        shortCircuit: true,
      };
    }
    if (specifier === "./current-user") {
      return {
        url: "data:text/javascript,export async function getOrCreateCurrentUser(){return globalThis.__purupuruAccountIdentityTest.localUser}",
        shortCircuit: true,
      };
    }
    if (specifier === "./profile") {
      return {
        url: "data:text/javascript,export async function getOrInitializeProfile(){return globalThis.__purupuruAccountIdentityTest.profile}",
        shortCircuit: true,
      };
    }
    return nextResolve(specifier);
  },
});
const { getCurrentAccountIdentity } = await import("../../apps/web/lib/account-identity.ts");
hooks.deregister();

function reset() {
  clerkUser = { firstName: "Clerk First", fullName: "Clerk Full", email: "private@example.test" };
  localUser = { id: "local-user", displayName: "Saved Name" };
  profile = {
    avatars: [
      { id: "purupuru-drop", name: "Puru Drop", assetPath: "/avatars/purupuru-drop.svg" },
      { id: "dewy-peach", name: "Dewy Peach", assetPath: "/avatars/dewy-peach.svg" },
    ],
    value: { displayName: "Puru Howard", selectedAvatarId: "dewy-peach" },
  };
}

test("header identity uses the resolved PuruPuru display name and selected local avatar", async () => {
  reset();
  assert.deepEqual(await getCurrentAccountIdentity(), {
    displayName: "Puru Howard",
    avatar: { name: "Dewy Peach", assetPath: "/avatars/dewy-peach.svg" },
  });
});

test("header identity falls back safely without exposing email when profile setup is unavailable", async () => {
  reset();
  localUser = { id: "local-user", displayName: null };
  profile = null;

  assert.deepEqual(await getCurrentAccountIdentity(), {
    displayName: "Clerk First",
    avatar: null,
  });
});

test("anonymous sessions do not receive a PuruPuru account identity", async () => {
  reset();
  clerkUser = null;
  localUser = null;
  assert.equal(await getCurrentAccountIdentity(), null);
});
