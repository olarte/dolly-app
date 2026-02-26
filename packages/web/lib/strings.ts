// All user-facing UI strings — Spanish for MVP (Colombia launch).
// Architecture supports i18n: swap this file per locale in the future.

export const UI = {
  // Navigation
  nav: {
    home: 'Inicio',
    leaderboard: 'Tabla',
    analytics: 'Análisis',
  },

  // Home
  home: {
    livePrice: 'DOLAR EN VIVO',
    opening: 'APERTURA',
    closesIn: 'CIERRA EN',
    markets: 'MARKETS',
  },

  // Market
  market: {
    sube: 'SUBE',
    baja: 'BAJA',
    pool: 'POOL',
    rules: 'RULES',
    holders: 'HOLDERS',
    activity: 'ACTIVITY',
    period: 'Periodo',
    closeDate: 'Fecha de cierre',
    resolutionTime: 'Tiempo de resolución',
  },

  // Market types
  marketType: {
    daily: 'DIARIO',
    weekly: 'SEMANAL',
    monthly: 'MENSUAL',
    special: 'ELECCIONES',
  },

  // Analytics
  analytics: {
    backToHome: '← BACK TO HOME',
    title: 'NOTICIAS Y ANÁLISIS',
    keyNews: 'NOTICIAS CLAVES',
  },

  // Leaderboard
  leaderboard: {
    backToHome: '← BACK TO HOME',
    title: 'LEADERBOARD GLOBAL',
    yourPosition: 'Your position',
    thisWeek: "THIS WEEK'S TOP GOATS",
    bets: 'bets',
    xp: 'xp',
  },

  // Common
  common: {
    backToHome: '← BACK TO HOME',
    offline: 'Sin conexión — reconecta para ver mercados en vivo',
  },
} as const
