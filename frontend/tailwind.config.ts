import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", ".dark"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "near-black": "#0e0f0c",
        "wise-green": "#9fe870",
        "dark-green": "#163300",
        "light-mint": "#e2f6d5",
        "pastel-green": "#cdffad",
        "warm-dark": "#454745",
        "td-gray": "#868685",
        "light-surface": "#e8ebe6",
        "td-positive": "#054d28",
        "td-danger": "#d03238",
        "td-warning": "#ffd11a",
      },
      borderRadius: {
        pill: "9999px",
        "card-sm": "16px",
        "card-md": "30px",
        "card-lg": "40px",
      },
      fontFamily: {
        display: ["var(--font-display)", "Inter", "sans-serif"],
        body: ["var(--font-inter)", "Helvetica", "Arial", "sans-serif"],
      },
      boxShadow: {
        ring: "rgba(14,15,12,0.12) 0px 0px 0px 1px",
        "ring-green": "rgba(159,232,112,0.4) 0px 0px 0px 2px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
