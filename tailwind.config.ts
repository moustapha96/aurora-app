import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Midnight Opulence Custom Colors
        gold: {
          DEFAULT: "hsl(var(--gold))",
          light: "hsl(var(--gold-light))",
          dark: "hsl(var(--gold-dark))",
        },
        ivory: "hsl(var(--text-ivory))",
        "text-secondary": "hsl(var(--text-secondary))",
        "black-deep": "hsl(var(--black-deep))",
        "black-charcoal": "hsl(var(--black-charcoal))",
        "black-medium": "hsl(var(--black-medium))",
        "black-light": "hsl(var(--black-light))",
        "black-elevated": "hsl(var(--black-elevated))",
        "navy-deep": "hsl(var(--navy-deep))",
        "navy-secondary": "hsl(var(--navy-secondary))",
        "card-elevated": "hsl(var(--card-elevated))",
        "card-surface": "hsl(var(--card-surface))",
      },
      fontFamily: {
        serif: ['Playfair Display', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'SF Pro', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(2.5rem, 5vw, 3.5rem)', { letterSpacing: '0.1em', lineHeight: '1.1' }],
        'h1': ['clamp(2rem, 4vw, 3rem)', { letterSpacing: '0.08em', lineHeight: '1.2' }],
        'h2': ['clamp(1.5rem, 3vw, 2rem)', { letterSpacing: '0.06em', lineHeight: '1.3' }],
        'h3': ['clamp(1.125rem, 2vw, 1.5rem)', { letterSpacing: '0.04em', lineHeight: '1.4' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-lg': ['1.0625rem', { lineHeight: '1.7' }],
        'button': ['0.875rem', { letterSpacing: '0.05em', fontWeight: '500' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'card': '0.75rem',
        'button': '0.375rem',
      },
      boxShadow: {
        'gold': 'var(--shadow-gold)',
        'elegant': 'var(--shadow-elegant)',
        'premium': 'var(--shadow-premium)',
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'glow': 'var(--shadow-glow)',
        'button': 'var(--shadow-button)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "scale-in": {
          from: { transform: "scale(0.97)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      transitionTimingFunction: {
        'luxury': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
