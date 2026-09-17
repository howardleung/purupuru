import assert from "node:assert/strict";
import test from "node:test";

import { trapTabKey } from "../../apps/web/lib/modal-focus.ts";

function element(options: { disabled?: boolean; hidden?: boolean; rendered?: boolean; tabIndex?: number } = {}) {
  return {
    tabIndex: options.tabIndex ?? 0,
    matches: () => options.disabled ?? false,
    closest: () => options.hidden ? {} : null,
    getClientRects: () => options.rendered === false ? [] : [{}],
    focusCount: 0,
    focus() { this.focusCount += 1; },
  };
}

function runTrap(elements: ReturnType<typeof element>[], active: unknown, options: { key?: string; shiftKey?: boolean } = {}) {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  let prevented = false;
  const container = {
    querySelectorAll: () => elements,
    contains: (target: unknown) => elements.includes(target as ReturnType<typeof element>),
    focusCount: 0,
    focus() { this.focusCount += 1; },
  };
  Object.defineProperty(globalThis, "document", { configurable: true, value: { activeElement: active === "container" ? container : active } });
  try {
    // Narrow DOM stand-ins exercise the shared algorithm without claiming browser QA.
    trapTabKey({ key: options.key ?? "Tab", shiftKey: options.shiftKey ?? false, preventDefault() { prevented = true; } } as KeyboardEvent, container as unknown as HTMLElement);
    return { prevented, containerFocusCount: container.focusCount };
  } finally {
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
}

test("Tab wraps from the last rendered control to the first", () => {
  const first = element();
  const last = element();
  assert.equal(runTrap([first, last], last).prevented, true);
  assert.equal(first.focusCount, 1);
});

test("Shift+Tab wraps from the first rendered control to the last", () => {
  const first = element();
  const last = element();
  assert.equal(runTrap([first, last], first, { shiftKey: true }).prevented, true);
  assert.equal(last.focusCount, 1);
});

test("focus trap excludes disabled, hidden, non-rendered, and negative-tabindex controls", () => {
  const excluded = [element({ disabled: true }), element({ hidden: true }), element({ rendered: false }), element({ tabIndex: -1 })];
  const visible = element();
  assert.equal(runTrap([...excluded, visible], visible).prevented, true);
  assert.equal(visible.focusCount, 1);
  assert.ok(excluded.every((control) => control.focusCount === 0));
});

test("focus outside a modal returns to its first or last control", () => {
  const first = element();
  const last = element();
  assert.equal(runTrap([first, last], null).prevented, true);
  assert.equal(first.focusCount, 1);
  assert.equal(runTrap([first, last], null, { shiftKey: true }).prevented, true);
  assert.equal(last.focusCount, 1);
});

test("an empty modal keeps Tab on the focusable dialog container", () => {
  assert.deepEqual(runTrap([], null), { prevented: true, containerFocusCount: 1 });
});

test("Tab from the dialog container enters its controls without escaping backwards", () => {
  const first = element();
  const last = element();
  assert.equal(runTrap([first, last], "container", { shiftKey: true }).prevented, true);
  assert.equal(last.focusCount, 1);
});

test("interior Tab navigation and unrelated keys retain native behavior", () => {
  const controls = [element(), element(), element()];
  assert.equal(runTrap(controls, controls[1]).prevented, false);
  assert.equal(runTrap(controls, controls[2], { key: "Enter" }).prevented, false);
  assert.ok(controls.every((control) => control.focusCount === 0));
});
