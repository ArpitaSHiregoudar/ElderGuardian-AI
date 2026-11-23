/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#0F4C64',
          'navy-dark': '#082F49',
          'navy-light': '#E0F2FE',
          teal: '#0D9488',
          'teal-dark': '#115E59',
          'teal-light': '#CCFBF1',
        },
        senior: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          text: '#0F172A',
          muted: '#475569',
        },
        action: {
          success: '#15803D',
          'success-bg': '#DCFCE7',
          warning: '#B45309',
          'warning-bg': '#FEF3C7',
          danger: '#B91C1C',
          'danger-bg': '#FEE2E2',
        },
      },
      fontSize: {
        'elder-base': ['18px', '28px'],
        'elder-lg': ['22px', '32px'],
        'elder-xl': ['28px', '36px'],
      },
      boxShadow: {
        elder: '0 4px 12px 0 rgba(15, 23, 42, 0.08)',
        'elder-lg': '0 8px 24px 0 rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [],
};
