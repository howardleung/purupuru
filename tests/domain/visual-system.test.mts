import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const css = readFileSync(new URL("../../apps/web/app/globals.css", import.meta.url), "utf8");
const config = readFileSync(new URL("../../apps/web/tailwind.config.ts", import.meta.url), "utf8");

function luminance(hex: string) {
  const parts = hex.replace("#", "").match(/../g);
  assert.ok(parts?.length === 3);
  const channels = parts.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

test("functional foregrounds meet normal-text contrast on shared light surfaces", () => {
  const action = /--color-action:\s*(#[a-f0-9]{6})/i.exec(css)?.[1];
  const muted = /500:\s*"(#[a-f0-9]{6})"/i.exec(config)?.[1];
  assert.ok(action && muted, "functional tokens must be defined");
  for (const foreground of [action, muted]) {
    for (const background of ["#ffffff", "#f4f7f9", "#eaf0f4"]) {
      const contrast = (luminance(background) + 0.05) / (luminance(foreground) + 0.05);
      assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}`);
    }
  }
});

test("shared visual system preserves reduced-motion and keyboard-focus support", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.hero-product:hover, \.ui-button:active:not\(:disabled\) \{ transform: none; \}/);
});

test("dark summary supporting copy and light control boundaries meet contrast requirements", () => {
  const light = /300:\s*"(#[a-f0-9]{6})"/i.exec(config)?.[1];
  const dark = /950:\s*"(#[a-f0-9]{6})"/i.exec(config)?.[1];
  const control = /400:\s*"(#[a-f0-9]{6})"/i.exec(config)?.[1];
  assert.ok(light && dark && control);
  assert.ok((luminance(light) + 0.05) / (luminance(dark) + 0.05) >= 4.5);
  assert.ok((luminance("#ffffff") + 0.05) / (luminance(control) + 0.05) >= 3);
  const summary = readFileSync(new URL("../../apps/web/components/shopping-list-details.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(summary, /text-slate-400/);
});

test("brand font is local and temporary mark remains decorative inside named home links", () => {
  const layout = readFileSync(new URL("../../apps/web/app/layout.tsx", import.meta.url), "utf8");
  const logo = readFileSync(new URL("../../apps/web/components/brand-logo.tsx", import.meta.url), "utf8");
  const mark = readFileSync(new URL("../../apps/web/public/brand/purupuru-mark-temporary.svg", import.meta.url), "utf8");
  assert.match(layout, /next\/font\/local/);
  assert.match(layout, /Nunito-Variable\.ttf/);
  assert.match(logo, /alt=""/);
  assert.match(logo, /aria-hidden/);
  assert.match(logo, /purupuru-mark-temporary\.svg/);
  assert.doesNotMatch(mark, /<script|<foreignObject|(?:href|src)=["']https?:\/\//i);
});

test("responsive mega-menus have unique mounted controls and Escape restores trigger focus", () => {
  const menu = readFileSync(new URL("../../apps/web/components/product-mega-menu.tsx", import.meta.url), "utf8");
  assert.match(menu, /const menuId = useId\(\)/);
  assert.match(menu, /aria-controls=\{isOpen \? menuId : undefined\}/);
  assert.match(menu, /triggerRef\.current\?\.focus\(\)/);
  assert.match(menu, /\[categories\.length, isOpen\]/);
});

test("mobile navigation dismisses on navigation, outside click, and Escape without losing focus", () => {
  const nav = readFileSync(new URL("../../apps/web/components/mobile-navigation.tsx", import.meta.url), "utf8");
  assert.match(nav, /event\.target\.closest\("a"\)/);
  assert.match(nav, /removeAttribute\("open"\)/);
  assert.match(nav, /event\.key === "Escape"/);
  assert.match(nav, /summaryRef\.current\?\.focus\(\)/);
  assert.match(nav, /removeEventListener\("mousedown", onOutsideClick\)/);
});
