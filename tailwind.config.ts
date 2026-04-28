import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3eff8",
          100: "#e6deef",
          200: "#cfc0dc",
          300: "#b096c3",
          400: "#8b69a4",
          500: "#1b003a",
          600: "#160030",
          700: "#110025",
          800: "#0b0019",
          900: "#06000f",
        },
      },
      boxShadow: {
        panel: "0 24px 70px rgba(2, 8, 23, 0.28)",
      },
      backgroundImage: {
        "mesh-dark":
          "radial-gradient(circle at 0% 0%, rgba(27,0,58,0.24), transparent 30%), radial-gradient(circle at 100% 0%, rgba(80,42,124,0.16), transparent 26%), linear-gradient(180deg, #07101c 0%, #0b1522 42%, #0d1724 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
