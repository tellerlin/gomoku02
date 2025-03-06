/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'board-bg': 'var(--board-bg)',
        'board-lines': 'var(--board-lines)',
        'black-piece': 'var(--black-piece)',
        'white-piece': 'var(--white-piece)'
      },
    },
  },
  plugins: [],
}