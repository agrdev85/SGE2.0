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
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
      },
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "modal-pop": {
          "0%": { opacity: "0", transform: "scale(0.95) translate(-50%, -50%)" },
          "100%": { opacity: "1", transform: "scale(1) translate(-50%, -50%)" },
        },
        "modal-pulse-out": {
          "0%": { opacity: "1", transform: "scale(1) translate(-50%, -50%)" },
          "50%": { opacity: "0.8", transform: "scale(1.02) translate(-50%, -50%)" },
          "100%": { opacity: "0", transform: "scale(0.95) translate(-50%, -50%)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-3px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(3px)" },
        },
        "overlay-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "overlay-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "icon-pop": {
          "0%": { transform: "scale(0)" },
          "50%": { transform: "scale(1.2)" },
          "100%": { transform: "scale(1)" },
        },
        "bounce-in": {
          "0%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.3)" },
          "50%": { transform: "translate(-50%, -50%) scale(1.05)" },
          "70%": { transform: "translate(-50%, -50%) scale(0.9)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-enter": {
          "0%": { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          "100%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-exit": {
          "0%": { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -54%) scale(0.96)" },
        },
        "glass-overlay": {
          "0%": { opacity: "0", backdropFilter: "blur(0px)" },
          "100%": { opacity: "1", backdropFilter: "blur(24px)" },
        },
        "glass-exit": {
          "0%": { opacity: "1", backdropFilter: "blur(24px)" },
          "100%": { opacity: "0", backdropFilter: "blur(0px)" },
        },
        "icon-float": {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "50%": { transform: "translateY(-6px) scale(1.05)" },
        },
        "icon-glow": {
          "0%, 100%": { filter: "drop-shadow(0 0 8px currentColor)" },
          "50%": { filter: "drop-shadow(0 0 16px currentColor)" },
        },
        "btn-press": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "modal-pop": "modal-pop 250ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "modal-pulse-out": "modal-pulse-out 200ms ease-out forwards",
        "shake": "shake 400ms ease-in-out",
        "overlay-in": "overlay-in 200ms ease-out",
        "overlay-out": "overlay-out 200ms ease-out forwards",
        "icon-pop": "icon-pop 300ms ease-out",
        "bounce-in": "bounce-in 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "dialog-enter": "dialog-enter 350ms cubic-bezier(0.32, 0.72, 0, 1)",
        "dialog-exit": "dialog-exit 200ms ease-in forwards",
        "glass-overlay": "glass-overlay 300ms ease-out",
        "glass-exit": "glass-exit 200ms ease-in forwards",
        "icon-float": "icon-float 2s ease-in-out infinite",
        "icon-glow": "icon-glow 1.5s ease-in-out infinite",
        "btn-press": "btn-press 150ms ease-out",
      },
      boxShadow: {
        'glow': '0 0 40px -10px hsl(var(--primary) / 0.4)',
        'glow-sm': '0 0 20px -5px hsl(var(--primary) / 0.3)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
