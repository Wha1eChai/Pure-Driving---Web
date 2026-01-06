/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'slide-in-right': 'slideInRight 0.3s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-in-out forwards',
      },
      keyframes: {
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      },
      height: {
        'dvh': '100dvh', // Dynamic viewport height for mobile browsers
      },
      minHeight: {
        'dvh': '100dvh',
      },
      maxHeight: {
        'dvh': '100dvh',
      }
    },
  },
  plugins: [],
}

