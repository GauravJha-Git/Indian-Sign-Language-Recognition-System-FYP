/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        secondary: '#111111',
        card: '#171717',
        border: '#262626',
        primary: '#7C3AED',
        primaryAccent: '#8B5CF6',
        textPrimary: '#FAFAFA',
        textSecondary: '#A1A1AA',
        success: '#22C55E',
        error: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
