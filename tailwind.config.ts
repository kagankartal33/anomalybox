import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#141414",
        paper: "#f7f5ef",
        mist: "#e8ece6",
        coral: "#df5b45",
        citron: "#c8d957",
        teal: "#1a7c76",
      },
      boxShadow: {
        soft: "0 18px 55px rgba(20, 20, 20, 0.10)",
      },
    },
  },
  plugins: [],
};

export default config;