import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        monopoly: {
          green: "#0d5c2e",
          "green-light": "#1a7d3e",
          "green-dark": "#084020",
          gold: "#c9a227",
          "gold-light": "#e6c04a",
          dark: "#1a1a1a",
          "dark-card": "#242424",
        },
      },
      fontFamily: {
        sans: ["var(--font-assistant)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
