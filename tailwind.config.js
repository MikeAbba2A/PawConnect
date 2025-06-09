/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        salmon: {
          50: '#fff5f2',
          100: '#ffe6df',
          200: '#ffccbe',
          300: '#ffa78e',
          400: '#ff8a65', // Primary
          500: '#fe6e49',
          600: '#ed4d28',
          700: '#d93a19',
          800: '#b32e17',
          900: '#932918',
        },
        green: {
          50: '#f3faf7',
          100: '#e6f7ef',
          200: '#bfecd7',
          300: '#84ddb1',
          400: '#4caf50', // Secondary
          500: '#3b9f41',
          600: '#2f8c37',
          700: '#276e2f',
          800: '#235c2a',
          900: '#1e4b23',
        },
        beige: {
          50: '#fefbf7',
          100: '#fdf7ef',
          200: '#f5debe',
          300: '#f5deb3', // Accent
          400: '#f0ca92',
          500: '#e9b876',
          600: '#c99a60',
          700: '#a6784a',
          800: '#886540',
          900: '#6b4e33',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Nunito', 'sans-serif'],
      },
      animation: {
        'bounce-subtle': 'bounce 0.5s ease-in-out 2',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};