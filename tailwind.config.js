/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
      },
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        highlight: "#F59E0B",
        info: "#3B82F6",
        danger: "#d92b1c",
        background: "#F3F4F6",
      },
      fontFamily: {
        source: ['"Source Sans Pro"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        sans: ['"Source Sans Pro"', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        'open-sans': ['"Open Sans"', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
        ubuntu: ['Ubuntu', 'sans-serif'],
        playfair: ['"Playfair Display"', 'serif'],
      }
    },
  },
  plugins: [],
}
