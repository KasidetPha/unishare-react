/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        thai: ['Prompt', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc',
          400: '#818cf8', 500: '#6366f1', 600: '#5B4BF5', 700: '#4f46e5',
          800: '#4338ca', 900: '#3730a3',
        },
        accent: {
          orange: '#FF8C42', green: '#4ADE80', coral: '#FF6B6B',
        },
        surface: {
          50: '#fafafa', 100: '#f5f5f5', 200: '#e5e5e5',
        }
      }
    },
  },
  plugins: [],
}