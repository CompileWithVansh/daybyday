import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        background: '#ffffff',
        foreground: '#831843',
        accent: '#ec4899',
        muted: '#fdf2f8',
      },
      fontFamily: {
        cursive: ['var(--font-cursive)', 'cursive'],
      },
    },
  },
  plugins: [],
};

export default config;
