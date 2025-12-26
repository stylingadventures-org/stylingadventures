/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lala: {
          // Primary brand colors
          primary: '#8B5CF6', // Purple
          secondary: '#EC4899', // Pink
          accent: '#F59E0B', // Amber
          dark: '#1F2937', // Dark gray
          light: '#F9FAFB', // Light gray
          
          // Tier colors
          fan: '#6366F1', // Indigo
          bestie: '#06B6D4', // Cyan
          creator: '#10B981', // Emerald
          collab: '#F59E0B', // Amber
          admin: '#EF4444', // Red
          studios: '#8B5CF6', // Purple
        },
      },
      spacing: {
        sidebar: '280px',
        topbar: '64px',
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: 'calc(200% + 0px) 0' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
