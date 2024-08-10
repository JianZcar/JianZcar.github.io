/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.{html,js}", "./**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        chakra: ["Chakra Petch", "sans-serif"],
      },
    },
  },
  plugins: [],
}
