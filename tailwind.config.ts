import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'fade-pink': {
          '0%, 100%': { backgroundColor: '#ffffff' },
          '50%':       { backgroundColor: '#f9e8eb' },
        },
      },
      animation: {
        'fade-pink': 'fade-pink 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;