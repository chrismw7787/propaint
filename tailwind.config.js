/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./features/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0f172a', // Slate 900
        secondary: '#3b82f6', // Blue 500
        accent: '#06b6d4', // Cyan 500
        surface: '#f8fafc', // Slate 50
      },
      screens: {
        'print': {'raw': 'print'},
      }
    },
  },
  plugins: [],
}