// Scraper for the Banco Central de Costa Rica "Tipo de cambio de ventanilla"
// page — the list of USD/CRC buy/sell rates each commercial bank posts at its
// window. There is no public REST API for this feed, so we fetch the HTML and
// walk the table server-side. The upstream page is HTML meant for a browser;
// treat parsing as best-effort and surface a clear error when it fails.

const BCCR_URL =
  "https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmConsultaTCVentanilla.aspx";
const BCCR_TTL_MS = 30 * 60 * 1000;

export interface BccrEntityRate {
  id: string;
  name: string;
  // Translated "Tipo de Entidad" section this entity belongs to on the BCCR
  // page (e.g. "Public banks"). Null only if the upstream section is unknown.
  category: string | null;
  // Bank buys USD from the customer (compra). USD → CRC direction.
  buy: number | null;
  // Bank sells USD to the customer (venta). CRC → USD direction.
  sell: number | null;
}

// BCCR groups entities under Spanish "Tipo de Entidad" sections. We surface
// these to the UI translated. Any section not in this map falls back to its
// original Spanish label rather than being dropped.
const CATEGORY_LABELS: Record<string, string> = {
  "bancos publicos": "Public banks",
  "bancos privados": "Private banks",
  financieras: "Finance companies",
  "mutuales de vivienda": "Housing mutuals",
  cooperativas: "Cooperatives",
  "casas de cambio": "Exchange houses",
  "puestos de bolsa": "Brokerages",
};

function normalizeCategoryKey(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function translateCategory(raw: string): string {
  return CATEGORY_LABELS[normalizeCategoryKey(raw)] ?? raw;
}

export interface BccrSnapshot {
  fetchedAt: string;
  entities: BccrEntityRate[];
}

let cache: { snapshot: BccrSnapshot; storedAt: number } | null = null;

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(parseInt(code, 10)),
    );
}

function stripTags(fragment: string): string {
  return decodeEntities(fragment.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseNumber(raw: string): number | null {
  const cleaned = raw.replace(/\s+/g, "");
  if (!cleaned) return null;
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  let normalized: string;
  if (hasDot && hasComma) {
    // Latin American convention: "1.234,56" — dots are thousands separators.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // "512,34" → "512.34". BCCR ventanilla uses this shape.
    normalized = cleaned.replace(",", ".");
  } else {
    normalized = cleaned;
  }
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Extract entity rows from the ventanilla HTML. The upstream table has six
 * columns: [Tipo de Entidad, Entidad Autorizada, Compra, Venta, Diferencial,
 * Última Actualización]. The first column only renders text on the first row
 * of each section — subsequent rows leave it as `&nbsp;` — so we track the
 * "current section" as we walk rows and stamp every entity with it.
 */
function parseVentanillaHtml(html: string): BccrEntityRate[] {
  const rows: BccrEntityRate[] = [];
  const trRegex = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;

  const seen = new Set<string>();
  let currentCategory: string | null = null;
  let match: RegExpExecArray | null;
  while ((match = trRegex.exec(html)) !== null) {
    const cellsRaw = match[1];
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    tdRegex.lastIndex = 0;
    while ((cellMatch = tdRegex.exec(cellsRaw)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    // A data row is [category?, entity, compra, venta, diferencial, updated].
    // Anything narrower is a layout row (title, notes) — skip it.
    if (cells.length < 4) continue;

    const buy = parseNumber(cells[2]);
    const sell = parseNumber(cells[3]);
    // Header row ("Compra"/"Venta" text) has no numbers in these slots and
    // gets filtered here without a separate check.
    if (buy === null && sell === null) continue;

    const name = cells[1];
    if (!name || name.length < 2) continue;

    // First cell either declares a new section or is blank ("&nbsp;", which
    // stripTags collapses to "") for continuation rows within the section.
    const rawCategory = cells[0];
    if (rawCategory) currentCategory = translateCategory(rawCategory);

    const id = slugify(name);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push({ id, name, category: currentCategory, buy, sell });
  }

  return rows;
}

async function fetchBccrHtml(): Promise<string> {
  const res = await fetch(BCCR_URL, {
    // The page varies constantly; skip Next.js data cache.
    cache: "no-store",
    headers: {
      // A plain UA improves the odds the site returns a full page.
      "User-Agent":
        "Mozilla/5.0 (compatible; BudgetManager/1.0; +https://github.com)",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`BCCR responded with ${res.status}`);
  }
  // BCCR serves the page as ISO-8859-1; if we let fetch decode as UTF-8 the
  // accented entity names come back as mojibake. Detect via Content-Type when
  // possible, otherwise fall back to latin-1 which matches the observed shape.
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "";
  const charsetMatch = /charset=([^;]+)/i.exec(contentType);
  const charset = (charsetMatch?.[1] ?? "iso-8859-1").trim().toLowerCase();
  const decoder = new TextDecoder(
    charset === "utf-8" || charset === "utf8" ? "utf-8" : "iso-8859-1",
  );
  return decoder.decode(buffer);
}

export async function getBccrSnapshot(
  options: { force?: boolean } = {},
): Promise<BccrSnapshot> {
  if (!options.force && cache && Date.now() - cache.storedAt < BCCR_TTL_MS) {
    return cache.snapshot;
  }
  const html = await fetchBccrHtml();
  const entities = parseVentanillaHtml(html);
  if (entities.length === 0) {
    throw new Error("Could not parse any entities from the BCCR ventanilla page");
  }
  const snapshot: BccrSnapshot = {
    fetchedAt: new Date().toISOString(),
    entities,
  };
  cache = { snapshot, storedAt: Date.now() };
  return snapshot;
}

export type FxDirection = "USD_TO_CRC" | "CRC_TO_USD";

export interface ResolvedBccrRate {
  entity: BccrEntityRate;
  rate: number;
  side: "compra" | "venta";
}

/**
 * Resolve the effective rate the customer would receive at a given entity
 * for a USD↔CRC exchange:
 *   USD → CRC: the customer gives USD to the bank → bank's *compra* (buy).
 *   CRC → USD: the customer receives USD from the bank → bank's *venta* (sell).
 * The returned rate is expressed as CRC per 1 USD. Returns null when the
 * entity has not posted a rate for the required side.
 */
export function pickBccrRate(
  entity: BccrEntityRate,
  direction: FxDirection,
): ResolvedBccrRate | null {
  if (direction === "USD_TO_CRC") {
    if (entity.buy === null) return null;
    return { entity, rate: entity.buy, side: "compra" };
  }
  if (entity.sell === null) return null;
  return { entity, rate: entity.sell, side: "venta" };
}
