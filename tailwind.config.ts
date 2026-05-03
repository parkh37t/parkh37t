import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#fafaf9",
          dark: "#0f0f0f",
        },
        ink: {
          DEFAULT: "#1f1f1f",
          muted: "#6b7280",
        },
        accent: {
          rose: "#fb7185",
          amber: "#f59e0b",
          emerald: "#10b981",
          sky: "#38bdf8",
          violet: "#8b5cf6",
        },
      },
      fontFamily: {
        sans: ["Inter", "Pretendard", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
