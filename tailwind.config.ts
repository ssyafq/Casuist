import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        steel: "#2E86C1",
        teal: "#5DADE2",
        sky: "#AED6F1",
        offwhite: "#F8FAFC",
        nearblack: "#0F172A",
        slate: "#64748B",
        easy: "#16A34A",
        medium: "#D97706",
        hard: "#DC2626",
        
        // Aliases from exported UI files
        primary: "#2E86C1",
        "primary-dark": "#1A5276",
        "background-light": "#F8FAFC",
        "background-dark": "#0F172A",
        "neutral-gray": "#E2E8F0",
        "text-main": "#0F172A",
        text: "#0F172A",
        navy: "#1A5276",
        border: "#E2E8F0",
        "border-gray": "#E2E8F0",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
        mono: ["var(--font-dm-mono)", "DM Mono", "monospace"],
        display: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
