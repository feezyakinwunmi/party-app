/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        neon: {
          pink:   "#FF2D78",
          cyan:   "#00F5FF",
          purple: "#BF00FF",
          green:  "#39FF14",
          yellow: "#FFE600",
        },
        dark: {
          900: "#050508",
          800: "#0C0C14",
          700: "#13131F",
          600: "#1A1A2E",
          500: "#22223A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body:    ["var(--font-body)", "sans-serif"],
      },
      animation: {
        "spin-slow":  "spin 3s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "float":      "float 3s ease-in-out infinite",
        "glitch":     "glitch 0.4s steps(2) infinite",
        "slide-up":   "slideUp 0.4s ease-out",
        "fade-in":    "fadeIn 0.5s ease-out",
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%":      { transform: "translateY(-10px)" },
        },
        glitch: {
          "0%":   { clipPath: "inset(10% 0 80% 0)", transform: "translate(-2px)" },
          "25%":  { clipPath: "inset(60% 0 20% 0)", transform: "translate(2px)" },
          "50%":  { clipPath: "inset(30% 0 50% 0)", transform: "translate(-1px)" },
          "75%":  { clipPath: "inset(80% 0 5%  0)", transform: "translate(1px)" },
          "100%": { clipPath: "inset(10% 0 80% 0)", transform: "translate(0)" },
        },
        slideUp: {
          from: { transform: "translateY(20px)", opacity: "0" },
          to:   { transform: "translateY(0)",    opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
      },
      boxShadow: {
        "neon-pink":   "0 0 20px #FF2D7880, 0 0 40px #FF2D7840",
        "neon-cyan":   "0 0 20px #00F5FF80, 0 0 40px #00F5FF40",
        "neon-purple": "0 0 20px #BF00FF80, 0 0 40px #BF00FF40",
        "neon-green":  "0 0 20px #39FF1480, 0 0 40px #39FF1440",
      },
    },
  },
  plugins: [],
};
