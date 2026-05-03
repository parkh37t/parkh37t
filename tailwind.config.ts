import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#F5F4F8",
          dark: "#0f0f0f",
        },
        ink: {
          DEFAULT: "#1A1A2E",
          muted: "#6B7280",
        },
        accent: {
          rose: "#fb7185",
          amber: "#f59e0b",
          emerald: "#10b981",
          sky: "#38bdf8",
          violet: "#8b5cf6",
          lavender: "#7C6BF6",
          lavenderDeep: "#5046A8",
        },
      },
      fontFamily: {
        sans: ["Inter", "Pretendard", "Noto Sans KR", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(99,102,241,0.12)",
      },
      keyframes: {
        softPulse: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(124,107,246,0.30)" },
          "50%": { boxShadow: "0 0 0 6px rgba(124,107,246,0)" },
        },
      },
      animation: {
        softPulse: "softPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
