/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f8",
          100: "#eceef0",
          200: "#d5d9de",
          300: "#b1b9c2",
          400: "#8794a1",
          500: "#697585",
          600: "#545f6d",
          700: "#454e59",
          800: "#3b424b",
          900: "#343941",
          950: "#22262b",
        },
        // Deep navy — matches Ludgrove's primary blue (#134ea1 / #0047ac family)
        brand: {
          50: "#eef3fb",
          100: "#dce7f6",
          200: "#b9cef0",
          300: "#8aa8d9",
          400: "#577cbb",
          500: "#2f65ad",
          600: "#134ea1",
          700: "#103f8d",
          800: "#0d3576",
          900: "#0a2b60",
          950: "#071d42",
        },
        // Warm orange — matches Ludgrove's sparing accent colour (#ef5b25)
        accent: {
          50: "#fef3ef",
          100: "#fde3d8",
          200: "#fac3a8",
          300: "#f59d73",
          400: "#f37f4c",
          500: "#ef5b25",
          600: "#d6481a",
          700: "#b23a15",
          800: "#8f2f14",
          900: "#742813",
        },
        category: {
          academic: "#3f7789",
          sport: "#3f8a5c",
          pastoral: "#b06a3f",
          admin: "#7a5ca8",
          personal: "#a03f5f",
        },
      },
      fontFamily: {
        sans: ["Lato", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        serif: ["Cormorant Garamond", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
};
