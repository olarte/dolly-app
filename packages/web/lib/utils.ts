/**
 * Format a number as currency with locale-appropriate separators.
 */
export function formatCurrency(
  value: number,
  options?: { symbol?: string; decimals?: number }
): string {
  const { symbol = '$', decimals = 2 } = options ?? {}
  const formatted = value.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${symbol}${formatted}`
}

/**
 * Format a multiplier value (e.g., 1.58x).
 */
export function formatMultiplier(value: number): string {
  return `${value.toFixed(2)}x`
}

/**
 * Format a pool amount (e.g., "$1.2M" or "$500K").
 */
export function formatPool(value: number): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

/**
 * Classnames utility — simple cn helper.
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
