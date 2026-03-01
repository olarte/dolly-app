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
    lastClose: 'ÚLTIMO CIERRE',
    marketClosed: 'MERCADO CERRADO',
    opensMonday: 'Abre el lunes',
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

  // Market questions by type
  marketQuestion: {
    daily: '¿Cierra hoy más alto que la apertura?',
    weekly: '¿Cierra la semana más alto que la apertura?',
    monthly: '¿Cierra el mes más alto que la apertura?',
  },

  // TRM
  trm: {
    source: 'Banco de la República',
    label: 'TRM OFICIAL',
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

  // Errors
  errors: {
    generic: 'Algo salió mal',
    network: 'Error de conexión',
    retry: 'Reintentar',
    priceUnavailable: 'Precio no disponible',
  },

  // Empty states
  empty: {
    noMarkets: 'No hay mercados activos',
    noPrice: 'No hay datos de precio',
    noNews: 'No hay noticias',
    noPlayers: 'No hay jugadores aún',
    noActivity: 'No hay actividad reciente',
  },

  // Pull to refresh
  refresh: {
    pulling: 'Tira para actualizar',
    release: 'Suelta para actualizar',
    loading: 'Actualizando...',
  },

  // Common
  common: {
    backToHome: '← BACK TO HOME',
    offline: 'Sin conexión — reconecta para ver mercados en vivo',
  },
} as const
