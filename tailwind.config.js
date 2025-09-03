module.exports = {
  content: ["./pages/*.{html,js}", "./index.html", "./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: "#1A1A1A", // Premium foundation
        secondary: "#2D2D2D", // Subtle elevation
        accent: "#FF0080", // Electric excitement
        
        // Background Colors
        background: "#0F0F0F", // Deep canvas
        surface: "#242424", // Gentle layering
        
        // Text Colors
        'text-primary': "#FFFFFF", // Crystal clarity
        'text-secondary': "#B0B0B0", // Clear hierarchy
        
        // Status Colors
        success: "#00FF88", // Collector victory
        warning: "#FFD700", // Premium alert
        error: "#FF4444", // Helpful guidance
        
        // Border Colors
        border: "#333333", // Subtle borders
        'border-accent': "#FF0080", // Electric borders
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'premium': '0 4px 20px rgba(255, 0, 128, 0.1)',
        'rare': '0 8px 40px rgba(255, 0, 128, 0.2)',
      },
      transitionDuration: {
        '300': '300ms',
        '200': '200ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'ease-out',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}