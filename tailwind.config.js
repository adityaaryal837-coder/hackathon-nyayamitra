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
        // ── Primary Brand Palette ──────────────────────────────────────
        brand: {
          50:  '#EBF4FF',
          100: '#DBEEFF',
          200: '#BEE3F8',
          300: '#90CDF4',
          400: '#63B3ED',
          500: '#4299E1',   // primary blue
          600: '#3182CE',
          700: '#2B6CB0',
          800: '#2C5282',
          900: '#1A365D',
        },
        // ── Gold Accent ────────────────────────────────────────────────
        gold: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F6C90E',
          500: '#D4AF37',   // primary gold
          600: '#B8962E',
          700: '#92740A',
          800: '#78610A',
          900: '#5C4A08',
        },
        // ── Legacy aliases (kept for Sidebar.tsx etc.) ─────────────────
        legal: {
          navy: {
            DEFAULT: '#0B192C',
            light:   '#1E3E62',
            dark:    '#06101C',
          },
          bone: {
            DEFAULT: '#FAF9F6',
            light:   '#FFFFFF',
            dark:    '#F0EEE9',
          },
          gold: {
            DEFAULT: '#D4AF37',
            light:   '#E6C76A',
            dark:    '#B8962E',
          },
          blue: {
            DEFAULT: '#4299E1',
            light:   '#EBF4FF',
            medium:  '#BEE3F8',
            dark:    '#1A365D',
          },
        },
      },
      fontFamily: {
        // English: Fredoka
        sans:      ['var(--font-fredoka)', 'Fredoka', 'system-ui', 'sans-serif'],
        // Nepali: Google Sans (Noto Sans Devanagari fallback)
        nepali:    ['var(--font-noto-devanagari)', 'Noto Sans Devanagari', 'sans-serif'],
        // Keep serif slot for headings that used Cinzel
        serif:     ['var(--font-fredoka)', 'Fredoka', 'Georgia', 'serif'],
      },
      fontSize: {
        'hero':    ['clamp(2.5rem,6vw,4.5rem)',  { lineHeight: '1.1' }],
        'section': ['clamp(1.75rem,4vw,3rem)',   { lineHeight: '1.2' }],
        'card':    ['clamp(1.1rem,2vw,1.5rem)',  { lineHeight: '1.3' }],
      },
      borderRadius: {
        '2xl':  '16px',
        '3xl':  '20px',
        '4xl':  '24px',
        '5xl':  '32px',
      },
      backdropBlur: {
        xs:  '2px',
        sm:  '8px',
        md:  '12px',
        lg:  '20px',
        xl:  '32px',
      },
      boxShadow: {
        'glass':       '0 8px 32px rgba(0,0,0,0.08)',
        'glass-dark':  '0 8px 32px rgba(0,0,0,0.35)',
        'gold-glow':   '0 0 20px rgba(212,175,55,0.35)',
        'blue-glow':   '0 0 20px rgba(66,153,225,0.35)',
        'card-hover':  '0 20px 40px rgba(0,0,0,0.12)',
        'sidebar':     '4px 0 24px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse-slow':   'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':      'fadeIn 0.5s ease-out forwards',
        'slide-up':     'slideUp 0.6s ease-out forwards',
        'slide-in-left':'slideInLeft 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
        'float-1':      'floatY 5s ease-in-out infinite',
        'float-2':      'floatY 6s ease-in-out infinite 1.5s',
        'float-3':      'floatY 7s ease-in-out infinite 3s',
        'spin-slow':    'spin 8s linear infinite',
        'shimmer':      'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(24px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        floatY: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
