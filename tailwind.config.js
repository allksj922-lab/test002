/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#09090b", // Deep Zinc-950
        surface: "#121316", // Subtle charcoal slate
        surfaceHover: "#18191e",
        volt: {
          DEFAULT: "#ccff00", // Athletic Electric Lime
          hover: "#b5e600",
          dim: "#ccff0015",
          border: "#ccff0033",
        },
        blaze: {
          DEFAULT: "#ff5722", // Safety runner orange
          dim: "#ff572215",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
