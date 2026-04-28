import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: '#120B07',
          secondary: '#2D1B11', //2D1B110
          tertiary: '#2F2F',
        },
        accent: 'rgb(var(--accent-rgb) / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
export default config
