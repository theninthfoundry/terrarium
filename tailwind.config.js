/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#050505',
        surface: '#0b0b0b',
        'surface-2': '#111111',
        line: '#292929',
        'line-strong': '#555555',
        muted: '#999999',
        dim: '#666666',
      },
      fontFamily: {
        mono: ['"DM Mono"', 'monospace'],
        sans: ['"Space Grotesk"', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
