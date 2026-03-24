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
        surface: '#1F2937',
        'surface-dark': '#111827',
        accent: '#F59E0B',
        'accent-light': '#FCD34D',
        border: '#374151',
        'text-primary': '#F9FAFB',
        'text-muted': '#9CA3AF',
        // keep legacy names for any remaining references
        gold: '#F59E0B',
        'gold-light': '#FCD34D',
        'wood-dark': '#111827',
        ink: '#F9FAFB',
        'red-trad': '#EF4444',
        connector: '#4B5563',
      },
      fontFamily: {
        chinese: ['Noto Serif SC', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif SC', 'Georgia', 'serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
        'slide-in': 'slideIn 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
}

export default config
