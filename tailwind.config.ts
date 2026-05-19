import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sprout: "#58cc02",
        leaf: "#89e219",
        honey: "#ffc83d",
        ember: "#ff7a1a",
        blush: "#fff0f7",
        petal: "#ffd6e8",
        rose: "#ec4899",
        candy: "#f9a8d4",
        ink: "#27333f"
      },
      boxShadow: {
        soft: "0 14px 40px rgba(190, 24, 93, 0.13)"
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
