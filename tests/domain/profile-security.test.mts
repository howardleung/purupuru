import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

type Call = { name: string; args: Record<string, unknown> };
let currentUser: { id: string } | null = { id: "local-user-a" };
let activeAvatar = true;
let calls: Call[] = [];
const prisma = {
  profileAvatar: {
    async findFirst(args: Record<string, unknown>) {
      calls.push({ name: "avatar.find", args });
      return activeAvatar ? { id: "purupuru-drop" } : null;
    },
  },
  user: {
    async update(args: Record<string, unknown>) {
      calls.push({ name: "user.update", args });
      return { id: "local-user-a" };
    },
  },
};
const boundary = {
  prisma,
  getUser: async () => currentUser,
  revalidate: (path: string) => calls.push({ name: "revalidate", args: { path } }),
};
Object.assign(globalThis, { __purupuruProfileTest: boundary });
const root = "globalThis.__purupuruProfileTest";
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    const modules: Record<string, string> = {
      "@beauty-platform/database": `export const prisma = ${root}.prisma;`,
      "next/cache": `export const revalidatePath = ${root}.revalidate;`,
    };
    if (specifier.endsWith("/current-user")) modules[specifier] = `export const getMutationUser = ${root}.getUser;`;
    if (specifier.endsWith("/rate-limit")) modules[specifier] = "export class RateLimitError extends Error {}";
    if (specifier in modules) return { url: `data:text/javascript,${encodeURIComponent(modules[specifier])}`, shortCircuit: true };
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:") && !/\.[a-z]+$/i.test(specifier)) {
      const url = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { updateProfile } = await import("../../apps/web/app/profile/actions.ts");
hooks.deregister();

function form(overrides: Record<string, string> = {}) {
  const values = {
    displayName: "  Dewy Friend  ",
    skinType: "DRY",
    sensitiveSkin: "on",
    selectedAvatarId: "purupuru-drop",
    ...overrides,
  };
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function reset() {
  currentUser = { id: "local-user-a" };
  activeAvatar = true;
  calls = [];
}

test("unauthenticated users cannot update profile data", async () => {
  reset(); currentUser = null;
  assert.equal((await updateProfile({ status: "IDLE", message: "" }, form())).status, "UNAUTHENTICATED");
  assert.deepEqual(calls, []);
});

test("profile updates are scoped to the authenticated local user", async () => {
  reset();
  const data = form({ userId: "victim", clerkUserId: "victim" });
  const result = await updateProfile({ status: "IDLE", message: "" }, data);
  assert.equal(result.status, "SUCCESS");
  assert.deepEqual(calls.find((call) => call.name === "avatar.find")?.args, {
    where: { id: "purupuru-drop", isActive: true }, select: { id: true },
  });
  assert.deepEqual(calls.find((call) => call.name === "user.update")?.args, {
    where: { id: "local-user-a" },
    data: { displayName: "Dewy Friend", skinType: "DRY", sensitiveSkin: true, selectedAvatarId: "purupuru-drop" },
  });
});

test("inactive or nonexistent avatars are rejected without a profile write", async () => {
  reset(); activeAvatar = false;
  assert.equal((await updateProfile({ status: "IDLE", message: "" }, form())).status, "INVALID");
  assert.equal(calls.some((call) => call.name === "user.update"), false);
});

test("malformed profile fields stop before authentication and database access", async () => {
  for (const data of [
    form({ displayName: "   " }),
    form({ skinType: "SENSITIVE" }),
    form({ selectedAvatarId: "https://example.test/avatar.png" }),
  ]) {
    reset();
    assert.equal((await updateProfile({ status: "IDLE", message: "" }, data)).status, "INVALID");
    assert.deepEqual(calls, []);
  }
});
