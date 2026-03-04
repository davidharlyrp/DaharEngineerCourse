/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        army: {
          50: '#f4f5f0',
          100: '#e6e8dc',
          200: '#cdd2bc',
          300: '#aeb595',
          400: '#91986f',
          500: '#757d53',
          600: '#5a6140',
          700: '#484d35',
          800: '#3c402d',
          900: '#343828',
          950: '#1a1c14',
        },
        dark: {
          50: '#f6f6f6',
          100: '#e7e7e7',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#6d6d6d',
          600: '#5d5d5d',
          700: '#4f4f4f',
          800: '#454545',
          900: '#3d3d3d',
          950: '#0a0a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
