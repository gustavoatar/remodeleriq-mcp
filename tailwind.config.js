/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Brand colors used in dynamic class compositions
    'bg-brand-50',
    'bg-brand-100',
    'bg-brand-500',
    'bg-brand-600',
    'bg-brand-900',
    'border-brand-200',
    'border-brand-300',
    'border-brand-400',
    'border-brand-500',
    'border-brand-600',
    'text-brand-300',
    'text-brand-400',
    'text-brand-500',
    'text-brand-600',
    'text-brand-700',
    'text-brand-800',
    'ring-brand-400',
    'ring-brand-500',
    'hover:bg-brand-50',
    'hover:border-brand-200',
    'hover:border-brand-300',
    // Navy colors used dynamically
    'bg-navy-50',
    'bg-navy-100',
    'border-navy-200',
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        navy: {
          50: '#e7e9ef',
          100: '#c3c8d7',
          200: '#9ba4bc',
          300: '#7380a1',
          400: '#55658c',
          500: '#374a77',
          600: '#31436f',
          700: '#283964',
          800: '#1f2f5a',
          900: '#0f1d47',
          950: '#0a1230',
        },
        // New green brand colors
        brand: {
          50: '#e8f7ed',
          100: '#d1f0db',
          200: '#a3e1b7',
          300: '#75d293',
          400: '#47c36f',
          500: '#1F9C4C', // Primary green
          600: '#1a8541',
          700: '#156e36',
          800: '#10572b',
          900: '#0b4020',
        },
        // Keep orange for warnings/errors only
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        // Teal green accent
        teal: {
          500: '#1F9C7A',
          600: '#178a6a',
        },
        // Dark green accent
        forest: {
          500: '#3A8C3A',
          600: '#2f732f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
