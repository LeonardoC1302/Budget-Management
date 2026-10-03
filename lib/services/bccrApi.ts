// Minimal client for the Banco Central de Costa Rica economic data API
// (SDDE). Server-only: it reads BCCR_SDDE_TOKEN, which never reaches the
// browser. Generate the token at the BCCR economic indicators site under
// Mi Perfil → Generar token.
// API reference: Estándar electrónico para usar el nuevo Sistema de
// Divulgación de Datos Económicos (SDDE), BCCR.

const API_BASE =
  "https://apim.bccr.fi.cr/SDDE/api/Bccr.GE.SDDE.Publico.Indicadores.API";

export interface SddeSeriesPoint {
  fecha: string;
  valorDatoPorPeriodo: number | null;
}

export interface SddeIndicator {
  codigoIndicador: string;
  nombreIndicador: string;
  series: SddeSeriesPoint[];
}

interface SddeResponse {
  estado: boolean;
  mensaje?: string;
  datos?: { indicadores?: SddeIndicator[] }[];
}

/** YYYY/MM/DD in Costa Rica, `daysAgo` days back. */
function crDate(daysAgo: number): string {
  const d = new Date(Date.now() - daysAgo * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(d)
    .replace(/-/g, "/");
}

/** Latest non-empty value in a series, with its date (YYYY-MM-DD). */
export function latestPoint(
  series: SddeSeriesPoint[],
): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  for (const p of series) {
    if (typeof p.valorDatoPorPeriodo !== "number" || p.valorDatoPorPeriodo <= 0) continue;
    if (!best || p.fecha > best.date) best = { value: p.valorDatoPorPeriodo, date: p.fecha };
  }
  return best;
}

/**
 * Every indicator in a BCCR table ("cuadro") over the last `lookbackDays`.
 * Daily rates are carried over weekends and holidays, so a short window
 * always holds the latest posting.
 */
export async function fetchSddeTable(
  table: number,
  lookbackDays = 10,
): Promise<SddeIndicator[]> {
  const token = process.env.BCCR_SDDE_TOKEN?.trim();
  if (!token) {
    throw new Error("BCCR_SDDE_TOKEN is not set; BCCR exchange rates are unavailable.");
  }
  const params = new URLSearchParams({
    fechaInicio: crDate(lookbackDays),
    fechaFin: crDate(0),
    idioma: "ES",
  });
  const res = await fetch(`${API_BASE}/cuadro/${table}/series?${params}`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `BCCR rejected the token (${res.status}). Generate a new one under Mi Perfil → Generar token and update BCCR_SDDE_TOKEN.`,
    );
  }
  if (res.status === 429) throw new Error("BCCR rate limit reached (429).");
  if (!res.ok) throw new Error(`BCCR responded with ${res.status}`);
  const body = (await res.json()) as SddeResponse;
  if (!body.estado) throw new Error(`BCCR error: ${body.mensaje ?? "unknown"}`);
  return body.datos?.[0]?.indicadores ?? [];
}
