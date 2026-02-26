import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          'gradient-start': '#c8d5b9',
          'gradient-end': '#f5f0e8',
        },
        card: {
          bg: '#ffffff',
        },
        sube: {
          green: '#2e7d32',
          bg: '#e8f5e9',
        },
        baja: {
          red: '#e53935',
          bg: '#fce4ec',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#666666',
          muted: '#999999',
        },
        nav: {
          dark: '#2a2a2a',
          active: '#4caf50',
        },
      },
      fontFamily: {
        sans: [
          'SF Pro Rounded',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      fontSize: {
        'display-lg': ['4rem', { lineHeight: '1', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '1', fontWeight: '700' }],
        'display-sm': ['2rem', { lineHeight: '1.1', fontWeight: '700' }],
        'heading': ['1.75rem', { lineHeight: '1.2', fontWeight: '700' }],
        'subheading': ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 2px 12px rgba(0, 0, 0, 0.06)',
        'card-lg': '0 4px 20px rgba(0, 0, 0, 0.08)',
        nav: '0 -2px 20px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
