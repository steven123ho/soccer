import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          light: '#60a5fa',
        },
        secondary: {
          DEFAULT: '#ff006e',
          dark: '#d6005c',
          light: '#ff4d94',
        },
        background: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
        },
        card: {
          DEFAULT: '#1e293b',
          light: '#334155',
        },
      },
    },
  },
  plugins: [],
}
export default config
