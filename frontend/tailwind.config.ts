import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#171717",
        panel: "rgba(255,255,255,0.04)",
        panelBorder: "rgba(255,255,255,0.08)",
        accent: "#21F1A8",
        ember: "#FF4D2E",
        muted: "#9A9CA3",
        app: {
          bg: "#F7F7F8",
          surface: "#FFFFFF",
          border: "#ECECEE",
          ink: "#1A1B1E",
          subink: "#8A8C93",
          blue: "#2E7CF6",
          "blue-hover": "#2668D9",
          rail: "#FBFBFC"
        }
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"]
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.75rem"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};

export default config;