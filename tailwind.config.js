/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette artisanale — lumière chaude d'un atelier baigné de soleil
        cream: '#FBF3E4',           // crème ambrée, comme la cire d'abeille
        'cream-warm': '#F6E8D0',     // crème dorée profonde
        'cream-deep': '#F0DBBE',     // crème cuivrée
        sand: '#EAD0A8',             // sable doré riche
        beige: '#EAD0A8',            // alias legacy
        'sand-light': '#F2E0C4',
        'sand-dark': '#D9BC92',
        honey: '#D88820',            // miel ambré riche et profond
        'honey-light': '#E8A53A',
        'honey-dark': '#A66810',
        amber: '#C77A1C',            // ambre chaud et lumineux
        'amber-light': '#E09A3E',
        'amber-dark': '#8E5210',
        copper: '#B5651D',           // cuivre brûlé
        'copper-light': '#D4853A',
        'copper-dark': '#7E4212',
        terracotta: '#C95F3A',       // terracotta de potier, chaud et terieux
        'terracotta-light': '#E07D52',
        'terracotta-dark': '#9A3F1E',
        rust: '#8A3318',             // rouille de fer chaud
        'rust-light': '#B04A28',
        wood: '#6B4A2E',             // brun noisette grillé
        'wood-light': '#8A6849',
        'wood-deep': '#2D1B0E',      // brun chocolat noir, jamais froid
        'wood-darker': '#1A0F06',    // espresso chaud
        sage: '#7E9462',              // vert mousse chaud, pas froid
        'sage-light': '#A0B583',
        'sage-dark': '#5C7244',
        olive: '#6B5B2E',             // olive doré
        wine: '#6B2415',             // bordeaux chaud profond
        'off-white': '#FEFBF3',
        'warm-white': '#FAF4E8',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Jost"', 'system-ui', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'],
      },
      fontSize: {
        'display': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'hero': ['clamp(3rem, 6vw, 5.5rem)', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
      },
      borderRadius: {
        soft: '0.75rem',
        softer: '1rem',
        'soft-lg': '1.5rem',
        'soft-xl': '2rem',
        pill: '9999px',
      },
      boxShadow: {
        soft: '0 2px 12px -4px rgba(45, 27, 14, 0.12)',
        card: '0 8px 30px -12px rgba(45, 27, 14, 0.20)',
        'card-hover': '0 16px 40px -12px rgba(45, 27, 14, 0.28)',
        elevated: '0 20px 60px -20px rgba(45, 27, 14, 0.35)',
        'warm-glow': '0 6px 28px -4px rgba(201, 95, 58, 0.40)',
        'honey-glow': '0 6px 28px -4px rgba(216, 136, 32, 0.40)',
        'inner-warm': 'inset 0 1px 0 0 rgba(255, 251, 243, 0.6)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gentle-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.6s ease-out',
        'fade-in-fast': 'fade-in-fast 0.3s ease-out',
        'scale-in': 'scale-in 0.4s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'gentle-pulse': 'gentle-pulse 3s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'warm-gradient': 'linear-gradient(135deg, #FBF3E4 0%, #F6E8D0 50%, #F0DBBE 100%)',
        'warm-radial': 'radial-gradient(ellipse at top, #FAF4E8 0%, #F6E8D0 100%)',
        'hero-gradient': 'linear-gradient(135deg, #F6E8D0 0%, #EAD0A8 40%, #D9BC92 100%)',
        'terracotta-gradient': 'linear-gradient(135deg, #C95F3A 0%, #B5651D 100%)',
        'wood-gradient': 'linear-gradient(180deg, #2D1B0E 0%, #1A0F06 100%)',
        'sunset-gradient': 'linear-gradient(135deg, #C95F3A 0%, #D88820 50%, #E8A53A 100%)',
        'linen-gradient': 'linear-gradient(180deg, #FBF3E4 0%, #F6E8D0 100%)',
      },
    },
  },
  plugins: [],
};
