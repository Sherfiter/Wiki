/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    './pages/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './content/**/*.{md,mdx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '90rem',
      },
      fontFamily: {
        sans: ['LXGW WenKai', 'Kaiti SC', 'STKaiti', 'KaiTi', 'sans-serif'],
        mono: ['Fira Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
