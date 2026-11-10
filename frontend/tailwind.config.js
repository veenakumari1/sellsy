/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#FBF1F3",
          100: "#F6E1E5",
          200: "#EBC3CB",
          300: "#DC9AA7",
          400: "#C26679",
          500: "#A3243A",
          600: "#7B1425",
          700: "#620F1E",
          800: "#4D0C18",
          900: "#380911",
          DEFAULT: "#7B1425",
        },
        navy: {
          900: "#14090B",
          800: "#2A1B1E",
          700: "#4A3A3D",
          600: "#6B5D60",
        },
        paper: "#FAF8F5",
        ink: "#14090B",
        wine: { DEFAULT: "#7B1425", 2: "#A3243A" },
        line: "#E8E2DC",
        surface: "#FFFFFF",
        muted: "#6B6366",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-inter-tight)", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};