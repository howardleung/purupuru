import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

let user: Record<string, unknown> | null;
let avatars: Array<{ id: string; name: string; assetPath: string }>;
let updates: Array<Record<string, unknown>>;

const prisma = {
  user: {
    async findUnique(args: Record<string, unknown>) {
      assert.deepEqual(args, { where: { id: "local-user-a" } });
      return user;
    },
    async update(args: Record<string, unknown>) {
      updates.push(args);
      return user;
    },
  },
  profileAvatar: {
    async findMany(args: Record<string, unknown>) {
      assert.deepEqual(args, {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, name: true, assetPath: true },
      });
      return avatars;
    },
  },
};

Object.assign(globalThis, { __purupuruProfileReadTest: { prisma } });
const hooks = registerHooks({
  resolve(specifier, _context, nextResolve) {
    if (specifier === "server-only") return { url: "data:text/javascript,export {};", shortCircuit: true };
    if (specifier === "@beauty-platform/database") {
      return {
        url: `data:text/javascript,export const prisma = globalThis.__purupuruProfileReadTest.prisma;`,
        shortCircuit: true,
      };
    }
    return nextResolve(specifier);
  },
});
const { getOrInitializeProfile } = await import("../../apps/web/lib/profile.ts");
hooks.deregister();

function reset() {
  user = {
    id: "local-user-a",
    displayName: null,
    skinType: null,
    sensitiveSkin: false,
    selectedAvatarId: null,
  };
  avatars = [{ id: "purupuru-drop", name: "Puru Drop", assetPath: "/avatars/purupuru-drop.svg" }];
  updates = [];
}

test("an existing Clerk-linked user initializes missing app profile values safely", async () => {
  reset();
  const profile = await getOrInitializeProfile("local-user-a", "Howard");

  assert.equal(profile?.value.displayName, "Howard");
  assert.equal(profile?.value.selectedAvatarId, "purupuru-drop");
  assert.deepEqual(updates, [{
    where: { id: "local-user-a" },
    data: { displayName: "Howard", selectedAvatarId: "purupuru-drop" },
  }]);
});

test("an inactive prior avatar falls back to the first active avatar", async () => {
  reset();
  user = { ...user, displayName: "Dewy Friend", selectedAvatarId: "retired-avatar" };

  const profile = await getOrInitializeProfile("local-user-a", "Ignored");
  assert.equal(profile?.value.selectedAvatarId, "purupuru-drop");
  assert.deepEqual(updates[0], {
    where: { id: "local-user-a" },
    data: { selectedAvatarId: "purupuru-drop" },
  });
});

test("profile setup fails safely when no active avatar exists", async () => {
  reset();
  avatars = [];
  const profile = await getOrInitializeProfile("local-user-a", "Howard");

  assert.equal(profile, null);
  assert.deepEqual(updates, [{ where: { id: "local-user-a" }, data: { displayName: "Howard" } }]);
});
