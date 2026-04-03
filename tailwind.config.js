/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D0F',
        surface: '#18181B',
        border: '#27272A',
        primary: '#F97316',
        'primary-hover': '#EA580C',
        'text-primary': '#FAFAFA',
        'text-secondary': '#A1A1AA',
        'text-muted': '#52525B',
        success: '#22C55E',
        warning: '#EAB308',
        danger: '#EF4444',
        energy_low: '#3B82F6',
        energy_med: '#F97316',
        energy_high: '#22C55E',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
