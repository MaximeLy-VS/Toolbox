/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};

module.exports = {
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          '0%, 20%': { transform: 'translateY(0%)' },
          '25%, 45%': { transform: 'translateY(-100%)' },
          '50%, 70%': { transform: 'translateY(-200%)' }, // Optionnel : si tu ajoutes un 3ème mot
          '75%, 100%': { transform: 'translateY(0%)' },
        },
      },
      animation: {
        'slide-vertical': 'slide-up 6s infinite ease-in-out',
      },
    },
  },
};
