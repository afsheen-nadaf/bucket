/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cornflower: "#6495ED",
        cream: "#FAF9F6",
        lightTint: "#E8EEF9",
        ink: "#2C2C2A",
        warmGray: "#888780",
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],

        sniglet: ["Sniglet", "cursive"],
      },
    },
  },
  plugins: [],
};
