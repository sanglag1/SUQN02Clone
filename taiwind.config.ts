/** @type {import('tailwindcss').Config} */
module.exports = {
    theme: {
      extend: {
         animation: {
          'scroll-up': 'scroll-up-smooth linear infinite',
          'scroll-down': 'scroll-down-smooth linear infinite',
        },
        keyframes: {
          'scroll-up-smooth': {
            '0%': { transform: 'translateY(0%)' },
            '100%': { transform: 'translateY(-50%)' },
          },
          'scroll-down-smooth': {
            '0%': { transform: 'translateY(-50%)' },
            '100%': { transform: 'translateY(0%)' },
          },
        },   
      },
    },
  };