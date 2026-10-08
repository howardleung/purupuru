import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const section = readFileSync(new URL("../../apps/web/components/reviews-section.tsx", import.meta.url), "utf8");
const editor = readFileSync(new URL("../../apps/web/components/review-editor.tsx", import.meta.url), "utf8");
const query = readFileSync(new URL("../../apps/web/lib/reviews.ts", import.meta.url), "utf8");

test("product review summary links to an accessible zero-aware reviews section", () => {
  assert.match(section, /href="#reviews"/);
  assert.match(section, /No ratings yet/);
  assert.match(section, /id="reviews"/);
  assert.match(section, /aria-label="Rating distribution"/);
});

test("review form requires whole-star and exact-size context with explicit deletion confirmation", () => {
  assert.match(editor, /Which size did you use\?/);
  assert.match(editor, /role="radiogroup"/);
  assert.match(editor, /Confirm delete/);
  assert.match(editor, /Update skin profile/);
});

test("public review identity is joined from the current user and avatar instead of snapshotted", () => {
  assert.match(query, /displayName: true/);
  assert.match(query, /selectedAvatar: \{ select: \{ name: true, assetPath: true \} \}/);
  assert.match(query, /skinTypeSnapshot/);
  assert.match(query, /orderBy: \[\{ createdAt: "desc" \}, \{ id: "desc" \}\]/);
  assert.match(query, /take: REVIEW_PAGE_SIZE \+ 1/);
});
