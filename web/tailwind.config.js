/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "-apple-system", "BlinkMacSystemFont", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#07090c",
        panel: "rgba(255, 255, 255, 0.045)",
        "panel-strong": "rgba(255, 255, 255, 0.075)",
        "panel-soft": "rgba(255, 255, 255, 0.025)",
        hairline: "rgba(255, 255, 255, 0.085)",
        "hairline-strong": "rgba(255, 255, 255, 0.16)",
        text: {
          DEFAULT: "rgba(255, 255, 255, 0.94)",
          dim: "rgba(255, 255, 255, 0.58)",
          mute: "rgba(255, 255, 255, 0.34)",
        },
        accent: {
          DEFAULT: "rgba(190, 220, 250, 0.92)",
          soft: "rgba(140, 190, 240, 0.55)",
          glow: "rgba(120, 180, 255, 0.18)",
          fill: "rgba(120, 180, 255, 0.18)",
        },
        danger: "rgba(255, 110, 110, 0.88)",
        mint: "rgba(120, 220, 180, 0.88)",
      },
      backdropBlur: {
        glass: "18px",
        "glass-strong": "28px",
      },
      borderRadius: {
        glass: "14px",
        "glass-sm": "9px",
      },
      boxShadow: {
        rest: "0 1px 0 rgba(255, 255, 255, 0.04) inset, 0 8px 22px rgba(0, 0, 0, 0.35)",
        sel: "0 0 0 1px rgba(140, 190, 240, 0.55) inset, 0 0 24px rgba(120, 180, 255, 0.18)",
      },
    },
  },
  plugins: [],
};
