import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        parchment: '#F2E6C9',
        'parchment-dark': '#D4B896',
        gold: '#C9A84C',
        'gold-light': '#E8C875',
        'wood-dark': '#1A0800',
        ink: '#2C1810',
        'red-trad': '#8B1A1A',
        connector: '#6B4423',
      },
      fontFamily: {
        chinese: ['Noto Serif SC', 'serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.25s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
