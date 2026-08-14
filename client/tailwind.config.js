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
        brand: {
          50: "#eef4f6",
          100: "#d9e7ec",
          200: "#b6d1da",
          300: "#8bb4c2",
          400: "#5c93a5",
          500: "#3f7789",
          600: "#335f6f",
          700: "#2c4e5c",
          800: "#28424d",
          900: "#243943",
          950: "#14232a",
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
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
