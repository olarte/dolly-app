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
    resolutionSource: 'Fuente de Resolución',
    volume: 'VOL',
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
    opening: 'Apertura:',
    volume: 'VOL',
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

  // Deposit / Transactions
  deposit: {
    title: 'DEPOSITAR',
    balance: 'Balance',
    approving: 'Aprobando...',
    depositing: 'Depositando...',
    success: 'Depósito exitoso',
    error: 'Error en transacción',
    cta: 'DEPOSITAR',
    claim: 'RECLAMAR',
    claiming: 'Reclamando...',
    claimSuccess: 'Reclamación exitosa',
    selectCoin: 'Seleccionar moneda',
    enterAmount: 'Ingresa un monto',
    insufficientBalance: 'Balance insuficiente',
    yourDeposit: 'Tu depósito',
    payout: 'Pago',
    won: '¡Ganaste!',
    lost: 'No ganaste',
    retry: 'Reintentar',
  },

  // Wallet
  wallet: {
    connect: 'Conectar',
    connecting: 'Conectando...',
    disconnect: 'Desconectar',
  },

  // Common
  common: {
    backToHome: '← BACK TO HOME',
    offline: 'Sin conexión — reconecta para ver mercados en vivo',
  },
} as const
