/** @type {import('tailwindcss').Config} */
const { fontFamily } = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
    "./index.html",
    "./src-frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // As per Project Specification: 6.1 Visual Style
        background: '#1A202C', // Charcoal
        surface: '#2D3748',    // Slate Gray
        primary: '#4299E1',    // Blue
        accent: '#38B2AC',     // Teal
        'text-primary': '#F7FAFC', // Off-White
        'text-secondary': '#A0AEC0', // Gray
        error: '#F56565',      // Red
        border: 'hsl(var(--border))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        // As per Project Specification: 6.1 Typography
        sans: ['Inter', ...fontFamily.sans],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} 