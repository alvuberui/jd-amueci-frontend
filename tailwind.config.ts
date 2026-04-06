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
          50: "#f6edff",
          100: "#ead7ff",
          200: "#d2afff",
          300: "#b67cff",
          400: "#9a4eff",
          500: "#7d22ff",
          600: "#6910ef",
          700: "#5700d0",
          800: "#4305a0",
          900: "#1b003a",
        },
      },
      boxShadow: {
        panel: "0 20px 60px rgba(15, 23, 42, 0.24)",
      },
      backgroundImage: {
        "mesh-dark":
          "radial-gradient(circle at 20% 20%, rgba(125,34,255,0.28), transparent 28%), radial-gradient(circle at 80% 0%, rgba(34,197,94,0.16), transparent 24%), linear-gradient(135deg, #020617 0%, #111827 40%, #1b003a 100%)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};

export default config;
