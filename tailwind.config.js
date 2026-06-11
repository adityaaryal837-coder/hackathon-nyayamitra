/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        legal: {
          navy: {
            DEFAULT: "#0D1B2A",
            light: "#1B263B",
            dark: "#08111D",
            glass: "rgba(13, 27, 42, 0.75)",
          },
          bone: {
            DEFAULT: "#F4F3EF",
            light: "#FAF9F6",
            dark: "#E8E6E0",
            glass: "rgba(250, 249, 246, 0.8)",
          },
          gold: {
            DEFAULT: "#C5A880",
            light: "#D4AF37",
            dark: "#A68050",
          },
          blue: {
            DEFAULT: "#3F72AF",
            light: "#DBE2EF",
            dark: "#112D4E",
          }
        },
      },
      fontFamily: {
        serif: ["var(--font-cinzel)", "Cinzel", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(31, 38, 135, 0.07)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
        "gold-glow": "0 0 15px rgba(197, 168, 128, 0.3)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.6s ease-out forwards",
        "balance-sway": "balanceSway 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        balanceSway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        }
      }
    },
  },
  plugins: [],
};
