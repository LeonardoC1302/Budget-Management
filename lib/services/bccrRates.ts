// Window (ventanilla) USD/CRC rates posted by every authorized exchange
// intermediary in Costa Rica, from the Banco Central de Costa Rica's
// economic data API (see lib/services/bccrApi.ts). Table 1015, "Lista de
// intermediarios cambiarios autorizados y sus tipos de cambio vigentes de
// ventanilla", has one daily buy and one daily sell series per institution.

import {
  fetchSddeTable,
  latestPoint,
  type SddeIndicator,
} from "@/lib/services/bccrApi";

const WINDOW_RATES_TABLE = 1015;
const BCCR_TTL_MS = 30 * 60 * 1000;
// Serve the last good snapshot while the API is down, up to this age.
const STALE_LIMIT_MS = 24 * 60 * 60 * 1000;

export interface BccrEntityRate {
  id: string;
  name: string;
  // Group the institution belongs to (e.g. "Banks"). Null when unknown.
  category: string | null;
  // Bank buys USD from the customer (compra). USD → CRC direction.
  buy: number | null;
  // Bank sells USD to the customer (venta). CRC → USD direction.
  sell: number | null;
}

export interface BccrSnapshot {
  fetchedAt: string;
  // Date of the most recent rate in the snapshot (YYYY-MM-DD, Costa Rica).
  asOf?: string;
  entities: BccrEntityRate[];
}

type Side = "buy" | "sell";

// BCCR indicator code → [institution code, side]. Generated from the BCCR
// indicator catalog, where each series key ends in .TC_CR.EN_<code> (buy)
// or .TC_VR.EN_<code> (sell). Spread series (TC_DC) are left out.
const SERIES: Record<number, [string, Side]> = {
  3148: ["BANCOSTA", "buy"],
  3149: ["BANNACIO", "buy"],
  3151: ["BCT", "buy"],
  3152: ["DAVIVIENDA", "buy"],
  3179: ["POPULAR", "buy"],
  3180: ["CATHAY", "buy"],
  3181: ["BANSANJO", "buy"],
  3183: ["LAFISE", "buy"],
  3184: ["IMPROSA", "buy"],
  3186: ["PROMERICA", "buy"],
  3187: ["SCOTIABK", "buy"],
  3189: ["FICOMECA", "buy"],
  3193: ["CAFSA", "buy"],
  3194: ["MUALAP", "buy"],
  3195: ["MUCAP", "buy"],
  3196: ["CREDECOOP", "buy"],
  3197: ["COOCIQUE", "buy"],
  3198: ["COOPESM", "buy"],
  3200: ["COOPENAE", "buy"],
  3201: ["TELEDOL", "buy"],
  3203: ["GLOBALEXCH", "buy"],
  3207: ["BANCOSTA", "sell"],
  3208: ["BANNACIO", "sell"],
  3209: ["POPULAR", "sell"],
  3210: ["BCT", "sell"],
  3211: ["DAVIVIENDA", "sell"],
  3214: ["CATHAY", "sell"],
  3215: ["BANSANJO", "sell"],
  3217: ["LAFISE", "sell"],
  3218: ["IMPROSA", "sell"],
  3220: ["PROMERICA", "sell"],
  3221: ["SCOTIABK", "sell"],
  3223: ["FICOMECA", "sell"],
  3227: ["CAFSA", "sell"],
  3228: ["MUALAP", "sell"],
  3229: ["MUCAP", "sell"],
  3230: ["CREDECOOP", "sell"],
  3231: ["COOCIQUE", "sell"],
  3232: ["COOPESM", "sell"],
  3234: ["COOPENAE", "sell"],
  3271: ["TELEDOL", "sell"],
  3277: ["GLOBALEXCH", "sell"],
  3289: ["COOPEALIANZA", "buy"],
  3290: ["COOPEALIANZA", "sell"],
  3337: ["PBBNVALORES", "buy"],
  3338: ["PBBNVALORES", "sell"],
  3552: ["PBBCT", "buy"],
  3553: ["PBBCT", "sell"],
  3566: ["BANGENCR", "buy"],
  3568: ["BANGENCR", "sell"],
  3593: ["MULTIMONEY", "buy"],
  3594: ["MULTIMONEY", "sell"],
  3597: ["COOPEAN1", "buy"],
  3598: ["COOPEAN1", "sell"],
  18922: ["PBMERCAVALORES", "buy"],
  18923: ["PBMERCAVALORES", "sell"],
  19728: ["PBBPDC", "buy"],
  19729: ["PBBPDC", "sell"],
  23701: ["PBSAMA", "buy"],
  23702: ["PBSAMA", "sell"],
  25385: ["CMB", "buy"],
  25386: ["CMB", "sell"],
  86037: ["COOPEMEP", "buy"],
  86038: ["COOPEMEP", "sell"],
  90285: ["COOPECAJA", "buy"],
  90286: ["COOPECAJA", "sell"],
  91016: ["ARI", "buy"],
  91017: ["ARI", "sell"],
  91018: ["AIRPAK", "buy"],
  91019: ["AIRPAK", "sell"],
  91317: ["WIZ", "buy"],
  91318: ["WIZ", "sell"],
  91331: ["PRIVAL", "buy"],
  91332: ["PRIVAL", "sell"],
};

// Institution code → the id, name and group Perch has always used for it.
// Ids must not change: recurring items and transactions store them.
const INSTITUTIONS: Record<string, { id: string; name: string; category: string }> = {
  BANCOSTA: { id: "banco-de-costa-rica", name: "Banco de Costa Rica", category: "Banks" },
  BANNACIO: { id: "banco-nacional-de-costa-rica", name: "Banco Nacional de Costa Rica", category: "Banks" },
  BANSANJO: { id: "banco-bac-san-jose-s-a", name: "Banco BAC San José S.A.", category: "Banks" },
  BCT: { id: "banco-bct-s-a", name: "Banco BCT S.A.", category: "Banks" },
  CATHAY: { id: "banco-cathay-de-costa-rica-s-a", name: "Banco Cathay de Costa Rica S.A.", category: "Banks" },
  CMB: { id: "banco-cmb-costa-rica-s-a", name: "Banco CMB (Costa Rica) S.A.", category: "Banks" },
  DAVIVIENDA: { id: "banco-davivienda-costa-rica-s-a", name: "Banco Davivienda (Costa Rica) S.A", category: "Banks" },
  BANGENCR: { id: "banco-general-costa-rica-s-a", name: "Banco General (Costa Rica) S.A.", category: "Banks" },
  IMPROSA: { id: "banco-improsa-s-a", name: "Banco Improsa S.A.", category: "Banks" },
  LAFISE: { id: "banco-lafise-s-a", name: "Banco Lafise S.A.", category: "Banks" },
  POPULAR: { id: "banco-popular-y-de-desarrollo-comunal", name: "Banco Popular y de Desarrollo Comunal", category: "Banks" },
  PROMERICA: { id: "banco-promerica-s-a", name: "Banco Promérica S.A.", category: "Banks" },
  // Formerly Scotiabank; the BCCR still files it under SCOTIABK.
  SCOTIABK: { id: "davibank-de-costa-rica-s-a", name: "DAVIBANK de Costa Rica S.A.", category: "Banks" },
  COOCIQUE: { id: "cooperativa-coocique-r-l", name: "Cooperativa COOCIQUE R.L.", category: "Credit unions" },
  COOPEALIANZA: { id: "cooperativa-coopealianza-r-l", name: "Cooperativa Coopealianza R.L.", category: "Credit unions" },
  COOPEAN1: { id: "coope-ande-n-1-r-l", name: "Coope-ANDE N°1 R.L.", category: "Credit unions" },
  COOPECAJA: { id: "coopecaja-r-l", name: "Coopecaja R.L.", category: "Credit unions" },
  COOPEMEP: { id: "coopemep-r-l", name: "Coopemep R.L.", category: "Credit unions" },
  COOPENAE: { id: "cooperativa-nacional-de-educadores-r-l-coopenae", name: "Cooperativa Nacional de Educadores R.L. (COOPENAE)", category: "Credit unions" },
  COOPESM: { id: "cooperativa-san-marcos-r-l", name: "Cooperativa San Marcos R.L.", category: "Credit unions" },
  CREDECOOP: { id: "cooperativa-credecoop-r-l", name: "Cooperativa CREDECOOP R.L.", category: "Credit unions" },
  AIRPAK: { id: "airpak-casa-de-cambio", name: "Airpak Casa de Cambio", category: "Exchange houses" },
  ARI: { id: "ari-casa-de-cambio-internacional-s-a", name: "ARI Casa de Cambio Internacional S.A", category: "Exchange houses" },
  GLOBALEXCH: { id: "casa-de-cambio-global-exchange", name: "Casa de Cambio Global Exchange", category: "Exchange houses" },
  TELEDOL: { id: "casa-de-cambio-teledolar-s-a", name: "Casa de Cambio Teledolar S. A.", category: "Exchange houses" },
  WIZ: { id: "casa-de-cambio-cambia-con-wiz-limitada", name: "Casa de Cambio Cambia con Wiz Limitada", category: "Exchange houses" },
  CAFSA: { id: "financiera-cafsa-s-a", name: "Financiera Cafsa S.A.", category: "Finance companies" },
  FICOMECA: { id: "financiera-comeca-s-a", name: "Financiera Comeca S.A.", category: "Finance companies" },
  MULTIMONEY: { id: "financiera-multimoney-s-a", name: "Financiera MultiMoney S.A.", category: "Finance companies" },
  MUALAP: { id: "grupo-mutual-alajuela-la-vivienda-de-ahorro-y-prestamo", name: "Grupo Mutual Alajuela - La Vivienda de Ahorro y Préstamo", category: "Mutual savings" },
  MUCAP: { id: "mutual-cartago-de-ahorro-y-prestamo", name: "Mutual Cartago de Ahorro y Préstamo", category: "Mutual savings" },
  PBBCT: { id: "bct-valores-puesto-de-bolsa-s-a", name: "BCT Valores, Puesto De Bolsa, S.A.", category: "Stockbrokers" },
  PBBNVALORES: { id: "bn-valores-s-a-puesto-de-bolsa", name: "BN Valores S.A., Puesto de Bolsa", category: "Stockbrokers" },
  PBBPDC: { id: "popular-valores-puesto-de-bolsa", name: "Popular Valores, Puesto de Bolsa", category: "Stockbrokers" },
  PBMERCAVALORES: { id: "mercado-valores-de-costa-rica-puesto-de-bolsa", name: "Mercado Valores de Costa Rica Puesto de Bolsa", category: "Stockbrokers" },
  PBSAMA: { id: "pb-inversiones-sama", name: "PB Inversiones SAMA", category: "Stockbrokers" },
  PRIVAL: { id: "prival-securities-puesto-de-bolsa-s-a", name: "PRIVAL Securities Puesto de Bolsa S.A", category: "Stockbrokers" },
};

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

/**
 * Side and institution for a series the map doesn't know yet (an
 * institution authorized after the map was generated), from its name:
 * "Tipo de cambio compra X", "X. TC Venta", "X, compra", ...
 */
function guessSeries(name: string): { side: Side; label: string } | null {
  if (/diferencial|^dc\b/i.test(name)) return null;
  const side: Side | null = /\bcompra\b/i.test(name)
    ? "buy"
    : /\bventa\b/i.test(name)
      ? "sell"
      : null;
  if (!side) return null;
  const label = name
    .replace(/tipo de cambio (compra|venta)/i, "")
    .replace(/[.,]?\s*(tc\s+)?(compra|venta)\s*$/i, "")
    .trim();
  return label ? { side, label } : null;
}

function parseWindowRates(indicators: SddeIndicator[]): { entities: BccrEntityRate[]; asOf?: string } {
  const byId = new Map<string, BccrEntityRate>();
  let asOf: string | undefined;

  for (const indicator of indicators) {
    const point = latestPoint(indicator.series ?? []);
    if (!point) continue;
    if (!asOf || point.date > asOf) asOf = point.date;

    const known = SERIES[Number(indicator.codigoIndicador)];
    let side: Side;
    let institution: { id: string; name: string; category: string | null };
    if (known) {
      side = known[1];
      institution = INSTITUTIONS[known[0]] ?? {
        id: slugify(known[0]),
        name: known[0],
        category: null,
      };
    } else {
      const guess = guessSeries(indicator.nombreIndicador);
      if (!guess) continue;
      side = guess.side;
      institution = { id: slugify(guess.label), name: guess.label, category: null };
    }

    const entity = byId.get(institution.id) ?? {
      ...institution,
      buy: null,
      sell: null,
    };
    entity[side] = point.value;
    byId.set(institution.id, entity);
  }

  const entities = [...byId.values()]
    .filter((e) => e.buy !== null || e.sell !== null)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  return { entities, asOf };
}

export async function getBccrSnapshot(
  options: { force?: boolean } = {},
): Promise<BccrSnapshot> {
  if (!options.force && cache && Date.now() - cache.storedAt < BCCR_TTL_MS) {
    return cache.snapshot;
  }
  try {
    const { entities, asOf } = parseWindowRates(await fetchSddeTable(WINDOW_RATES_TABLE));
    if (entities.length === 0) {
      throw new Error("BCCR returned no window rates.");
    }
    const snapshot: BccrSnapshot = {
      fetchedAt: new Date().toISOString(),
      asOf,
      entities,
    };
    cache = { snapshot, storedAt: Date.now() };
    return snapshot;
  } catch (err) {
    // Rates move once or twice a day: a recent snapshot beats no rates.
    if (cache && Date.now() - cache.storedAt < STALE_LIMIT_MS) {
      console.warn("[bccr] using cached window rates:", err);
      return cache.snapshot;
    }
    throw err;
  }
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
