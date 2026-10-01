import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#f7f4ed",
        mist: "#e8ece6",
        coral: "#df5b45",
        citron: "#c8d957",
        teal: "#1a7c76",
        plum: "#725f7b",
        "plum-deep": "#4e4155",
        "plum-soft": "#eee8f0",
      },
      boxShadow: {
        soft: "0 24px 70px -42px rgba(25, 20, 27, 0.38)",
      },
    },
  },
  plugins: [],
};

export default config;