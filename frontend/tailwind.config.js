/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#071322",
          900: "#0B1F36",
          800: "#0F2744",
          700: "#16355A",
          600: "#1E477A",
          500: "#2B5F9E",
          100: "#E2E8F0",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#0D9488",
          600: "#0F766E",
          700: "#115E59",
        },
        mint: {
          50: "#F2FBF7",
          100: "#E6F7EF",
          200: "#C0EED8",
          300: "#8CE0BC",
          400: "#48CA97",
          500: "#10B981",
          600: "#059669",
        },
      },
      fontFamily: {
        sans: ["Source Sans 3", "Segoe UI", "sans-serif"],
        display: ["Manrope", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(15, 39, 68, 0.05), 0 1px 3px 0 rgba(15, 39, 68, 0.03)",
        card: "0 4px 20px -2px rgba(15, 39, 68, 0.06), 0 2px 6px -1px rgba(15, 39, 68, 0.04)",
        elevated: "0 10px 25px -5px rgba(15, 39, 68, 0.1), 0 8px 10px -6px rgba(15, 39, 68, 0.06)",
      },
    },
  },
  plugins: [],
};
