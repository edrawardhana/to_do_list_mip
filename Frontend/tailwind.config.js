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
        // NAMA: [fontSize, { lineHeight, letterSpacing, fontWeight }]
        xs: ["0.75rem", { lineHeight: "1rem" }], // 12px - teks tabel header
        sm: ["0.875rem", { lineHeight: "1.25rem" }], // 14px - teks biasa, label
        base: ["1rem", { lineHeight: "1.5rem" }], // 16px - value, nama intern
        lg: ["1.125rem", { lineHeight: "1.75rem" }], // 18px - subjudul section
        xl: ["1.25rem", { lineHeight: "1.75rem" }], // 20px - judul section
        "2xl": ["1.5rem", { lineHeight: "2rem" }], // 24px - judul halaman utama
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }], // 30px - angka progress 50%
      },

      // KONSISTEN FONT FAMILY
      fontFamily: {
        sans: [
          "Inter", // font utama (harus diinstall)
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },

      // KONSISTEN SPACING (PADDING, MARGIN, GAP)
      spacing: {
        card: "1.5rem", // 24px - padding dalam card
        section: "2rem", // 32px - margin antar section
        "grid-gap": "1.5rem", // 24px - gap antar grid item
      },

      // KONSISTEN BORDER RADIUS
      borderRadius: {
        card: "0.5rem", // 8px - border radius card
        button: "0.375rem", // 6px - border radius tombol
      },

      // KONSISTEN SHADOW
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)", // shadow tipis
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      },

      // KONSISTEN ANIMASI
      transitionProperty: {
        colors:
          "color, background-color, border-color, text-decoration-color, fill, stroke",
      },
      transitionDuration: {
        DEFAULT: "200ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },

  // PLUGIN TAMBAHAN (OPSIONAL)
  plugins: [
    // Plugin untuk styling form elements (input, select, textarea)
    require("@tailwindcss/forms")({
      strategy: "class", // hanya terapkan jika pakai class 'form-input' dll
    }),

    // Plugin untuk typography (prose class)
    require("@tailwindcss/typography"),
  ],
};
