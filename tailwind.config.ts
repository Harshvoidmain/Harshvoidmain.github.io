import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0F2557",
          foreground: "#FFFFFF",
          50: "#EEF2FB",
          100: "#D0DBF4",
          200: "#A2B8E9",
          300: "#7494DE",
          400: "#4670D3",
          500: "#2A52BA",
          600: "#1A3D93",
          700: "#0F2557",
          800: "#091840",
          900: "#040C20",
        },
        accent: {
          DEFAULT: "#E8A020",
          foreground: "#FFFFFF",
          50: "#FEF8EC",
          100: "#FDEDC8",
          200: "#FBD991",
          300: "#F8C55A",
          400: "#F5B123",
          500: "#E8A020",
          600: "#C07F0F",
          700: "#8A5B0A",
          800: "#543708",
          900: "#1E1403",
        },
        navy: "#0F2557",
        amber: "#E8A020",
        surface: "#F8F9FC",
        border: "#E5E7EB",
        muted: "#6B7280",
        success: "#16A34A",
        warning: "#D97706",
        error: "#DC2626",
      },
      fontFamily: {
        heading: ["Sora", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "8px",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.08)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.12)",
        modal: "0 20px 60px rgba(0,0,0,0.15)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out",
        "slide-up": "slideUp 200ms ease-out",
        "slide-in-right": "slideInRight 200ms ease-out",
        "skeleton-pulse": "skeletonPulse 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideInRight: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        skeletonPulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
