/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#182028',
        paper: '#EAEDE7',
        'paper-raised': '#F5F7F3',
        signal: {
          DEFAULT: '#1F6F6B',
          soft: '#D7E8E4',
          dark: '#154F4C',
        },
        alert: {
          DEFAULT: '#C1443D',
          soft: '#F3DBD9',
        },
        amber: {
          DEFAULT: '#D89A4B',
          soft: '#F3E4CE',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'serif'],
        body: ['"IBM Plex Sans"', 'ui-sans-serif', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'ui-sans-serif', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
