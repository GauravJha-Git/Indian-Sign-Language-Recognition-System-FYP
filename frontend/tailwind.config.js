/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-background)',
        surface: 'var(--bg-surface)',
        card: 'var(--bg-card)',
        border: 'var(--color-border)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        primary: 'var(--primary-accent)',
        primaryHover: 'var(--primary-hover)',
        primaryActive: 'var(--primary-active)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
