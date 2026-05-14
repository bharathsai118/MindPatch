import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 18px 60px rgba(15, 23, 42, 0.10)",
        glow: "0 0 0 1px rgba(37, 99, 235, 0.12), 0 18px 60px rgba(37, 99, 235, 0.18)"
      },
      colors: {
        ink: "#101828",
        panel: "#f8fafc",
        signal: "#2563eb",
        mint: "#0f9f6e",
        amberline: "#d97706"
      }
    }
  },
  plugins: []
};

export default config;
