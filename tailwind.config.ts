import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        background: "var(--background)",
        "background-card": "var(--background-card)",
        foreground: "var(--foreground)",
        "foreground-muted": "var(--foreground-muted)",
        glow: {
          cyan: "rgba(34, 211, 238, 0.4)",
          violet: "rgba(167, 139, 250, 0.4)"
        }
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.5)',
        'glow-violet': '0 0 20px rgba(167, 139, 250, 0.5)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
};
export default config;
