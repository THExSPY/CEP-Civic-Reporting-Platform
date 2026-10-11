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
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#0e7490",
          600: "#0c6178",
          700: "#0a4f63",
          800: "#083d4d",
          900: "#062f3b",
        },
      },
      keyframes: {
        slidein: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        fadein: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        slidein: "slidein .22s ease-out",
        fadein: "fadein .2s ease-out",
      },
    },
  },
  plugins: [],
};
