import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand)",
          action: "var(--color-action)",
          ink: "var(--color-ink)",
          mist: "var(--color-mist)",
          oak: "var(--color-oak)",
          blush: "var(--color-blush)",
        },
        // Existing dense surfaces share the new neutral system without a layout rewrite.
        slate: {
          50: "#f4f7f9", 100: "#eaf0f4", 200: "#dbe5eb", 300: "#bdcbd5",
          400: "#718b9d", 500: "#566e80", 600: "#496174", 700: "#374f61",
          800: "#2c3e4e", 900: "#253442", 950: "#1d2b39",
        },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Segoe UI", "sans-serif"],
      },
      borderRadius: { md: "0.75rem", lg: "0.875rem", xl: "1.125rem", "2xl": "1.5rem" },
      boxShadow: {
        soft: "0 8px 30px -12px rgb(71 103 125 / 0.18)",
        float: "0 16px 48px -16px rgb(37 52 66 / 0.22)",
      },
    },
  },
  plugins: [],
};

export default config;
