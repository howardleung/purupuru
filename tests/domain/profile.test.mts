import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  deriveInitialDisplayName,
  PROFILE_SKIN_TYPES,
  validatePublicProfileInput,
} from "../../packages/domain/src/profile.ts";

const validInput = {
  displayName: "Puru Friend",
  skinType: "COMBINATION",
  sensitiveSkin: true,
  selectedAvatarId: "purupuru-drop",
} as const;

test("display names are trimmed, normalized and constrained", () => {
  const normalized = validatePublicProfileInput({ ...validInput, displayName: "  Dewy   Friend  " });
  assert.equal(normalized.ok, true);
  if (normalized.ok) assert.equal(normalized.value.displayName, "Dewy Friend");

  for (const displayName of ["", "   ", "A", "x".repeat(41), "Hidden\u200BName", "Line\nBreak"]) {
    assert.equal(validatePublicProfileInput({ ...validInput, displayName }).ok, false);
  }
});

test("the four primary skin types and an unset value validate", () => {
  for (const skinType of [...PROFILE_SKIN_TYPES, null]) {
    const result = validatePublicProfileInput({ ...validInput, skinType });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.skinType, skinType);
  }
  for (const skinType of ["SENSITIVE", "NOT_SURE", "ACNE_PRONE", 3]) {
    assert.equal(validatePublicProfileInput({ ...validInput, skinType }).ok, false);
  }
});

test("Sensitive is independent from primary skin type", () => {
  for (const sensitiveSkin of [true, false]) {
    const result = validatePublicProfileInput({ ...validInput, skinType: "DRY", sensitiveSkin });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.sensitiveSkin, sensitiveSkin);
  }
  assert.equal(validatePublicProfileInput({ ...validInput, sensitiveSkin: "yes" }).ok, false);
});

test("avatar selection accepts stable IDs and rejects arbitrary URLs", () => {
  assert.equal(validatePublicProfileInput(validInput).ok, true);
  for (const selectedAvatarId of ["", "https://images.example/avatar.png", "/avatars/custom.svg", "../secret"] ) {
    assert.equal(validatePublicProfileInput({ ...validInput, selectedAvatarId }).ok, false);
  }
});

test("initial display names never fall back to email", () => {
  assert.equal(deriveInitialDisplayName(" Howard ", "Howard Leung"), "Howard");
  assert.equal(deriveInitialDisplayName(null, " Howard Leung "), "Howard Leung");
  assert.equal(deriveInitialDisplayName(null, null), "PuruPuru User");
});

test("profile schema and migration are additive, stable and avatar-backed", () => {
  const schema = readFileSync(new URL("../../packages/database/prisma/schema.prisma", import.meta.url), "utf8");
  const migration = readFileSync(new URL("../../packages/database/prisma/migrations/20261007180000_add_user_profiles/migration.sql", import.meta.url), "utf8");
  const seed = readFileSync(new URL("../../packages/database/prisma/seed.mjs", import.meta.url), "utf8");

  assert.match(schema, /model ProfileAvatar \{/);
  assert.match(schema, /selectedAvatarId\s+String\?/);
  assert.match(schema, /sensitiveSkin\s+Boolean\s+@default\(false\)/);
  assert.match(migration, /ON DELETE SET NULL/);
  assert.match(migration, /WHERE "skinType" = 'SENSITIVE'/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|DROP TYPE/);
  for (const id of ["purupuru-drop", "dewy-peach", "calm-cloud", "green-tea", "sunny-day"]) {
    assert.match(migration, new RegExp(id));
    assert.match(seed, new RegExp(id));
  }
});

test("profile UI keeps app identity separate from Clerk account management", () => {
  const page = readFileSync(new URL("../../apps/web/app/profile/page.tsx", import.meta.url), "utf8");
  const form = readFileSync(new URL("../../apps/web/components/profile-form.tsx", import.meta.url), "utf8");
  const account = readFileSync(new URL("../../apps/web/components/manage-clerk-account-button.tsx", import.meta.url), "utf8");
  const header = readFileSync(new URL("../../apps/web/components/site-header.tsx", import.meta.url), "utf8");

  assert.match(page, /getClerkUser/);
  assert.match(page, /getOrCreateCurrentUser/);
  assert.match(page, /maskedEmail/);
  assert.match(form, /useState\(initialValue\.selectedAvatarId\)/);
  assert.match(form, /name="selectedAvatarId"/);
  assert.match(form, /Save changes/);
  assert.match(form, /useTransition/);
  assert.match(form, /onSubmit=/);
  assert.doesNotMatch(form, /<form action=/);
  assert.match(account, /openUserProfile/);
  assert.match(header, /UserButton\.Link href="\/profile" label="Profile"/);
});
