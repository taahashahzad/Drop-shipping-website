/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#161B22',
          soft: '#3A4150',
        },
        paper: {
          DEFAULT: '#FBFAF7',
          dim: '#F2F0EA',
        },
        palm: {
          50: '#EAF4EF',
          100: '#CFE6DA',
          300: '#7FB89D',
          500: '#0F6E4F',
          600: '#0C5A41',
          700: '#0A4834',
          900: '#0A2E22',
        },
        sand: {
          100: '#F3E9D6',
          300: '#DEC088',
          500: '#B8863F',
          600: '#96692D',
        },
        rust: {
          500: '#B4472B',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(22,27,34,0.06), 0 1px 1px rgba(22,27,34,0.04)',
        lift: '0 20px 40px -12px rgba(22,27,34,0.18)',
        soft: '0 8px 24px -8px rgba(22,27,34,0.12)',
      },
      borderRadius: {
        sm: '4px',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        underline: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both',
        fadeIn: 'fadeIn 0.5s ease-out both',
        scaleIn: 'scaleIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
        marquee: 'marquee 26s linear infinite',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
