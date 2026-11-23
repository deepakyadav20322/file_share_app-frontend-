/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SendAnyFile brand: the lime green from the original logo and buttons, on deep ink-green.
        brand: {
          DEFAULT: "#6EED1F",
          50: "#F2FDE8",
          100: "#E3FBCB",
          200: "#C6F79A",
          300: "#A4F365",
          400: "#88F03C",
          500: "#6EED1F",
          600: "#52C80F",
          700: "#2F7D12",
        },
        ink: { 950: "#06130C", 900: "#0A1E13", 800: "#10301E", 700: "#1A4730" },
        paper: "#F5FAEF",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "draw-check": {
          "0%": { strokeDashoffset: "30" },
          "100%": { strokeDashoffset: "0" },
        },
        "pop": {
          "0%": { transform: "scale(.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "draw-check": "draw-check 0.5s 0.15s ease-out forwards",
        "pop": "pop 0.4s ease-out",
      },
    },
  },
  plugins: [],
}
