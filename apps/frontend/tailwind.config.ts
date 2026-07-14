import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bn: {
          bg: '#0B0E11',
          secondary: '#1E2026',
          card: '#252930',
          input: '#2B3139',
          border: '#2B3139',
          'border-light': '#363C45',
          hover: '#2B3139',
        },
        yellow: {
          DEFAULT: '#F0B90B',
          hover: '#F8D33A',
          dark: '#C7A008',
        },
        bnGreen: '#0ECB81',
        bnRed: '#F6465D',
        bnText: {
          primary: '#EAECEF',
          secondary: '#848E9C',
          muted: '#5E6673',
        },
      },
      fontFamily: {
        sans: ['Inter', 'var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        bn: '4px',
      },
      boxShadow: {
        bn: '0 4px 12px rgba(0,0,0,0.35)',
        'bn-lg': '0 8px 24px rgba(0,0,0,0.45)',
        glow: '0 0 0 1px rgba(240,185,11,0.25)',
      },
      animation: {
        'flash-green': 'flashGreen 0.6s ease-out',
        'flash-red': 'flashRed 0.6s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.2s ease-out',
        fade: 'fadeIn 0.25s ease-out',
        ticker: 'ticker 30s linear infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        flashGreen: {
          '0%': { backgroundColor: 'rgba(14, 203, 129, 0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashRed: {
          '0%': { backgroundColor: 'rgba(246, 70, 93, 0.25)' },
          '100%': { backgroundColor: 'transparent' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
