/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0D0D0F',
        surface: '#131315',
        surface2: '#1A1A1D',
        border: '#222227',
        text: '#F0F0F5',
        muted: '#5A5A6E',
        'muted-light': '#8888A0',
        accent: '#E8FF6B',
        'accent-dim': '#E8FF6B22',
        'accent-border': '#E8FF6B44',
        danger: '#FF4444',
        success: '#3DCC7E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}