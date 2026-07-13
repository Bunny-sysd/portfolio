/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: "#00ff66",
        cyan: "#00d4ff",
        darkbg: "#02040a"
      }
    },
  },
  plugins: [],
}
