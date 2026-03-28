/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // KONSISTEN WARNA
      colors: {
        primary: {
          DEFAULT: "#2563eb", // biru untuk link/tombol
          dark: "#1d4ed8",
          light: "#3b82f6",
        },
        gray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb", // border
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280", // teks label (abu-abu)
          600: "#4b5563", // teks biasa
          700: "#374151",
          800: "#1f2937",
          900: "#111827", // teks judul (hitam)
        },
      },

      // KONSISTEN FONT UKURAN
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px
      },

      // KONSISTEN FONT FAMILY
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },

      // KONSISTEN SPACING
      spacing: {
        card: "1.5rem",
        section: "2rem",
        "grid-gap": "1.5rem",
      },

      // KONSISTEN BORDER RADIUS
      borderRadius: {
        card: "0.5rem",
        button: "0.375rem",
      },

      // KONSISTEN SHADOW
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },

      // CUSTOM KEYFRAMES UNTUK ANIMASI MANUAL
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideInBottom: {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-in-bottom": "slideInBottom 0.7s ease-out forwards",
      },

      // KONSISTEN TRANSISI
      transitionProperty: {
        colors:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
    },
  },

  plugins: [
    // 1. Plugin Animasi (Wajib Install: npm install tailwindcss-animate)
    require("tailwindcss-animate"),

    // 2. Plugin Forms
    require("@tailwindcss/forms")({
      strategy: "class",
    }),

    // 3. Plugin Typography
    require("@tailwindcss/typography"),
  ],
};
