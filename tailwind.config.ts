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
        ink: {
          DEFAULT: "#0f3a52",
          soft: "#3d5a6c",
        },
        muted: "#6b8494",
        cream: "#fff8f0",
        sky: {
          DEFAULT: "#eff8ff",
          deep: "#d9f0fb",
        },
        blue: {
          DEFAULT: "#1fa7e1",
          dark: "#0d7fb0",
          soft: "#63c5f1",
        },
        amber: "#ffb356",
        green: "#75d06a",
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "Nunito", "sans-serif"],
      },
      borderRadius: {
        "28px": "28px",
        brand: "28px",
      },
      maxWidth: {
        content: "1080px",
        wide: "1180px",
      },
      boxShadow: {
        card: "0 22px 50px rgba(15, 58, 82, 0.12)",
        soft: "0 14px 34px rgba(15, 58, 82, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
