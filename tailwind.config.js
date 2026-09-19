/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        river: {
          50: "#eef8ff",
          500: "#0e7490",
          600: "#0c6178",
        },
      },
    },
  },
  plugins: [],
};
