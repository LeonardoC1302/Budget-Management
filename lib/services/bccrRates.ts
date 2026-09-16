// Scraper for tipodecambio.info's "Ventanilla" page — a table of USD/CRC
// buy/sell rates each Costa Rican financial institution posts at its window,
// aggregated from data published by the Banco Central de Costa Rica. The
// BCCR's own ventanilla page (gee.bccr.fi.cr) has gone offline, so this
// mirror is used instead. There is no public REST API for this feed, so we
// fetch the HTML and walk the table server-side. The upstream page is HTML
// meant for a browser; treat parsing as best-effort and surface a clear
// error when it fails.

const BCCR_URL = "https://tipodecambio.info/ventanilla.php?lang=en";
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

// tipodecambio.info groups entities under a `data-type` attribute on each
// row. We surface these to the UI translated. Any type not in this map falls
// back to its raw value rather than being dropped.
const CATEGORY_LABELS: Record<string, string> = {
  banco: "Banks",
  cooperativa: "Credit unions",
  casa: "Exchange houses",
  financiera: "Finance companies",
  mutual: "Mutual savings",
  puesto: "Stockbrokers",
};

function translateCategory(raw: string): string {
  return CATEGORY_LABELS[raw.toLowerCase().trim()] ?? raw;
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
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  let normalized: string;
  if (hasDot && hasComma) {
    // Latin American convention: "1.234,56" — dots are thousands separators.
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    // "512,34" → "512.34".
    normalized = cleaned.replace(",", ".");
  } else {
    normalized = cleaned;
  }
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Extract entity rows from the ventanilla HTML. Each row looks like:
 *   <tr data-type="banco" class="table-row">
 *     <td class="cell-entity">Name</td>
 *     <td class="cell-number ...">₡123.45</td>   (buy)
 *     <td class="cell-number ...">₡123.45</td>   (sell)
 *     <td class="cell-spread ...">1.23</td>
 *     <td class="cell-time">...</td>
 *   </tr>
 * The `data-type` attribute maps to the category via CATEGORY_LABELS.
 */
function parseVentanillaHtml(html: string): BccrEntityRate[] {
  const rows: BccrEntityRate[] = [];
  const trRegex =
    /<tr\s+data-type="([^"]*)"[^>]*>([\s\S]*?)<\/tr>/gi;
  const tdRegex = /<td\b[^>]*>([\s\S]*?)<\/td>/gi;

  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = trRegex.exec(html)) !== null) {
    const rawCategory = match[1];
    const cellsRaw = match[2];
    const cells: string[] = [];
    let cellMatch: RegExpExecArray | null;
    tdRegex.lastIndex = 0;
    while ((cellMatch = tdRegex.exec(cellsRaw)) !== null) {
      cells.push(stripTags(cellMatch[1]));
    }
    // A data row is [entity, buy, sell, spread, updated]. Anything narrower
    // is unexpected markup — skip it.
    if (cells.length < 3) continue;

    const name = cells[0];
    if (!name || name.length < 2) continue;

    const buy = parseNumber(cells[1]);
    const sell = parseNumber(cells[2]);
    if (buy === null && sell === null) continue;

    const id = slugify(name);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    rows.push({
      id,
      name,
      category: rawCategory ? translateCategory(rawCategory) : null,
      buy,
      sell,
    });
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
    throw new Error(`Ventanilla page responded with ${res.status}`);
  }
  // The site declares UTF-8; detect via Content-Type when possible, falling
  // back to utf-8 which matches the observed shape.
  const buffer = await res.arrayBuffer();
  const contentType = res.headers.get("content-type") ?? "";
  const charsetMatch = /charset=([^;]+)/i.exec(contentType);
  const charset = (charsetMatch?.[1] ?? "utf-8").trim().toLowerCase();
  const decoder = new TextDecoder(
    charset === "iso-8859-1" || charset === "latin1" ? "iso-8859-1" : "utf-8",
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
