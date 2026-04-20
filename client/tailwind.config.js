/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"],
      },
      colors: {
        brand: {
          50: "#eff8ff",
          100: "#dbeefe",
          200: "#bddffd",
          300: "#91cbfc",
          400: "#5eaff8",
          500: "#3892ef",
          600: "#2474d0",
          700: "#1f5ca8",
          800: "#214f89",
          900: "#21436f"
        }
      },
      boxShadow: {
        glass: "0 10px 35px rgba(20, 30, 70, 0.18)",
      }
    },
  },
  plugins: [],
};
