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
        navy: {
          950: '#050d1a',
          900: '#0a1628',
          800: '#0f1e32',
          700: '#162a44',
          600: '#1e3a5f',
          500: '#2a4a6f',
        },
        gold: {
          DEFAULT: '#f0a500',
          dark: '#d18b00',
          light: '#ffc333',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #ffc333 0%, #f0a500 50%, #d18b00 100%)',
        'navy-radial': 'radial-gradient(circle at 50% 0%, rgba(240,165,0,0.08), transparent 60%)',
        'premium-mesh':
          'radial-gradient(at 0% 0%, rgba(240,165,0,0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(30,58,95,0.4) 0px, transparent 50%)',
      },
      boxShadow: {
        gold: '0 8px 30px -8px rgba(240,165,0,0.35)',
        'gold-lg': '0 20px 60px -15px rgba(240,165,0,0.45)',
        premium: '0 10px 40px -12px rgba(0,0,0,0.6)',
        glow: '0 0 0 1px rgba(240,165,0,0.15), 0 8px 40px -8px rgba(240,165,0,0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.16,1,0.3,1)',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.16,1,0.3,1)',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(240,165,0,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(240,165,0,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
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
