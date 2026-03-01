// TRM (Tasa Representativa del Mercado) price source from Banco de la República
// Data from: https://www.datos.gov.co/resource/32sa-8pi3.json (free, no auth)
// TRM is published once per business day, typically around 5:30 PM COT

const TRM_API = 'https://www.datos.gov.co/resource/32sa-8pi3.json'

// --- Types ---

export interface TRMRecord {
  date: string   // YYYY-MM-DD
  rate: number   // TRM value (e.g. 4150.25)
}

interface TRMApiResponse {
  vigenciadesde: string  // ISO timestamp e.g. "2026-02-27T00:00:00.000"
  vigenciahasta: string
  valor: string          // e.g. "4150.2500"
}

// --- Cache ---

interface CachedTRM {
  data: TRMRecord[]
  fetchedAt: number
}

let trmCache: CachedTRM | null = null
const TRM_CACHE_TTL = 10 * 60 * 1000  // 10 minutes (TRM changes at most once/day)

// --- Colombian holidays 2026 ---
// Public holidays (festivos) — includes transferred Monday holidays (Ley Emiliani)
const COLOMBIAN_HOLIDAYS_2026 = new Set([
  '2026-01-01', // Año Nuevo
  '2026-01-12', // Día de los Reyes Magos (moved)
  '2026-03-23', // Día de San José (moved)
  '2026-03-29', // Domingo de Ramos
  '2026-04-02', // Jueves Santo
  '2026-04-03', // Viernes Santo
  '2026-05-18', // Ascensión del Señor (moved)
  '2026-06-08', // Corpus Christi (moved)
  '2026-06-15', // Sagrado Corazón (moved)
  '2026-06-29', // San Pedro y San Pablo (moved)
  '2026-07-20', // Día de la Independencia
  '2026-08-07', // Batalla de Boyacá
  '2026-08-17', // Asunción de la Virgen (moved)
  '2026-10-12', // Día de la Raza (moved)
  '2026-11-02', // Todos los Santos (moved)
  '2026-11-16', // Independencia de Cartagena (moved)
  '2026-12-08', // Inmaculada Concepción
  '2026-12-25', // Navidad
])

// --- Business day helpers ---

function formatDate(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay()
  if (day === 0 || day === 6) return false // Weekend
  return !COLOMBIAN_HOLIDAYS_2026.has(formatDate(date))
}

export function getNextBusinessDay(date: Date): Date {
  const next = new Date(date)
  do {
    next.setDate(next.getDate() + 1)
  } while (!isBusinessDay(next))
  return next
}

export function getPreviousBusinessDay(date: Date): Date {
  const prev = new Date(date)
  do {
    prev.setDate(prev.getDate() - 1)
  } while (!isBusinessDay(prev))
  return prev
}

export function getFirstBusinessDayOfMonth(year: number, month: number): Date {
  const date = new Date(year, month, 1)
  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() + 1)
  }
  return date
}

export function getLastBusinessDayOfMonth(year: number, month: number): Date {
  // Last day of the month
  const date = new Date(year, month + 1, 0)
  while (!isBusinessDay(date)) {
    date.setDate(date.getDate() - 1)
  }
  return date
}

// --- TRM API ---

async function fetchTRMRange(startDate: string, endDate: string): Promise<TRMRecord[]> {
  const params = new URLSearchParams({
    '$where': `vigenciadesde >= '${startDate}T00:00:00.000' AND vigenciadesde <= '${endDate}T23:59:59.000'`,
    '$order': 'vigenciadesde DESC',
    '$limit': '100',
  })

  const res = await fetch(`${TRM_API}?${params}`)
  if (!res.ok) throw new Error(`TRM API error: ${res.status}`)

  const data: TRMApiResponse[] = await res.json()
  return data.map((item) => ({
    date: item.vigenciadesde.slice(0, 10),
    rate: parseFloat(item.valor),
  }))
}

async function fetchRecentTRM(): Promise<TRMRecord[]> {
  if (trmCache && Date.now() - trmCache.fetchedAt < TRM_CACHE_TTL) {
    return trmCache.data
  }

  // Fetch last 30 days of TRM data
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  const records = await fetchTRMRange(formatDate(start), formatDate(end))
  trmCache = { data: records, fetchedAt: Date.now() }
  return records
}

/** Get TRM for a specific date. Returns the rate published for that date. */
export async function getTRM(date: Date): Promise<number> {
  const dateStr = formatDate(date)

  // Try cache first
  const cached = trmCache?.data.find((r) => r.date === dateStr)
  if (cached) return cached.rate

  // Fetch range around the date
  const start = new Date(date)
  start.setDate(start.getDate() - 5)
  const end = new Date(date)
  end.setDate(end.getDate() + 1)

  const records = await fetchTRMRange(formatDate(start), formatDate(end))

  // Merge into cache
  if (trmCache) {
    const existingDates = new Set(trmCache.data.map((r) => r.date))
    for (const record of records) {
      if (!existingDates.has(record.date)) {
        trmCache.data.push(record)
      }
    }
  }

  const match = records.find((r) => r.date === dateStr)
  if (!match) throw new Error(`No TRM data for ${dateStr}`)
  return match.rate
}

/** Get the most recent published TRM rate */
export async function getLatestTRM(): Promise<TRMRecord> {
  const records = await fetchRecentTRM()
  if (records.length === 0) throw new Error('No TRM data available')
  // Records are DESC order — first is most recent
  return records[0]
}

/** Get TRM records for a date range */
export async function getTRMRange(start: Date, end: Date): Promise<TRMRecord[]> {
  return fetchTRMRange(formatDate(start), formatDate(end))
}

/** Try to get TRM for a date, return null if not available yet */
export async function tryGetTRM(date: Date): Promise<number | null> {
  try {
    return await getTRM(date)
  } catch {
    return null
  }
}
