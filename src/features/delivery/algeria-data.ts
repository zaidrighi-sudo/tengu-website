import wilayaCommunes from "@/features/delivery/wilaya-communes.json"

/**
 * Algerian delivery data: the wilayas and their communes live in
 * `wilaya-communes.json` (69 delivery areas), grouped into five delivery
 * zones. Delivery fees are in Algerian dinar (DA) and follow the usual
 * home / stop-desk split of national carriers such as dhd.
 * Pricing is per commune (`COMMUNE_FEES` on the client, `communeFees` in the
 * CMS). Communes without an override use the zone table: the CMS `zones`
 * array wins over the static defaults below.
 *
 * This module is i18n-free on purpose: Server Actions use it to price orders,
 * and `@/store/i18n` depends on React client APIs.
 */

export type Zone = {
  id: 1 | 2 | 3 | 4 | 5
  /** Door-to-door fee. */
  home: number
  /** Pick-up at a carrier desk (stop-desk). */
  desk: number
  /** Delivery time in days, inclusive range. */
  days: [number, number]
}

export const DEFAULT_ZONES: Record<Zone["id"], Zone> = {
  1: { id: 1, home: 550, desk: 350, days: [1, 2] },
  2: { id: 2, home: 800, desk: 450, days: [2, 3] },
  3: { id: 3, home: 950, desk: 550, days: [3, 4] },
  4: { id: 4, home: 1200, desk: 700, days: [3, 5] },
  5: { id: 5, home: 1500, desk: 900, days: [5, 7] },
}

export type Wilaya = { code: string; name: string; arabic: string; zone: Zone["id"] }

type RawWilaya = {
  code: number
  ascii: string
  arabic: string
  communes: { ascii: string; arabic: string }[]
}

/** Delivery zone per wilaya code, from the north (1) to the far south (5). */
const ZONE_BY_CODE: Record<string, Zone["id"]> = {
  "01": 5, // Adrar
  "02": 2, // Chlef
  "03": 3, // Laghouat
  "04": 3, // Oum El Bouaghi
  "05": 3, // Batna
  "06": 2, // Bejaia
  "07": 3, // Biskra
  "08": 5, // Bechar
  "09": 1, // Blida
  "10": 2, // Bouira
  "11": 5, // Tamanrasset
  "12": 3, // Tebessa
  "13": 2, // Tlemcen
  "14": 2, // Tiaret
  "15": 2, // Tizi Ouzou
  "16": 1, // Alger
  "17": 3, // Djelfa
  "18": 2, // Jijel
  "19": 2, // Setif
  "20": 3, // Saida
  "21": 2, // Skikda
  "22": 2, // Sidi Bel Abbes
  "23": 2, // Annaba
  "24": 2, // Guelma
  "25": 2, // Constantine
  "26": 2, // Medea
  "27": 2, // Mostaganem
  "28": 3, // M'Sila
  "29": 2, // Mascara
  "30": 4, // Ouargla
  "31": 2, // Oran
  "32": 3, // El Bayadh
  "33": 5, // Illizi
  "34": 2, // Bordj Bou Arreridj
  "35": 1, // Boumerdes
  "36": 2, // El Tarf
  "37": 5, // Tindouf
  "38": 2, // Tissemsilt
  "39": 4, // El Oued
  "40": 3, // Khenchela
  "41": 2, // Souk Ahras
  "42": 1, // Tipaza
  "43": 2, // Mila
  "44": 2, // Ain Defla
  "45": 3, // Naama
  "46": 2, // Ain Temouchent
  "47": 4, // Ghardaia
  "48": 2, // Relizane
  "49": 5, // Timimoun
  "50": 5, // Bordj Badji Mokhtar
  "51": 3, // Ouled Djellal
  "52": 5, // Beni Abbes
  "53": 5, // In Salah
  "54": 5, // In Guezzam
  "55": 4, // Touggourt
  "56": 5, // Djanet
  "57": 4, // El M'Ghair
  "58": 4, // El Meniaa
  "59": 3, // Aflou
  "60": 3, // Barika
  "61": 3, // El Kantara
  "62": 3, // Bir El Ater
  "63": 2, // El Aricha
  "64": 2, // Ksar Chellala
  "65": 3, // Ain Oussara
  "66": 3, // Messaad
  "67": 2, // Ksar El Boukhari
  "68": 3, // Bou Saada
  "69": 3, // El Abiodh Sidi Cheikh
}

/** The fixed wilaya list, built from the static dataset. */
export const DEFAULT_WILAYAS: Wilaya[] = (wilayaCommunes as RawWilaya[]).map((wilaya) => {
  const code = String(wilaya.code).padStart(2, "0")
  return {
    code,
    name: wilaya.ascii,
    arabic: wilaya.arabic,
    zone: ZONE_BY_CODE[code] ?? 3,
  }
})

/** Accent- and punctuation-insensitive key so older spellings still match. */
const nameKey = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")

/** Normalise a commune name the same way; commune fee rows are keyed by this. */
export const communeKey = nameKey

/** Communes per wilaya code, shared by client and server. */
export const COMMUNES_BY_CODE = new Map<string, { name: string; arabic: string }[]>(
  (wilayaCommunes as RawWilaya[]).map((wilaya) => [
    String(wilaya.code).padStart(2, "0"),
    wilaya.communes.map((commune) => ({ name: commune.ascii, arabic: commune.arabic })),
  ]),
)

/** `${wilayaCode}:${communeKey(name)}` for every known commune — used to validate fee rows. */
export const KNOWN_COMMUNES: ReadonlySet<string> = new Set(
  (wilayaCommunes as RawWilaya[]).flatMap((wilaya) => {
    const code = String(wilaya.code).padStart(2, "0")
    return wilaya.communes.map((commune) => `${code}:${communeKey(commune.ascii)}`)
  }),
)

const byName = new Map(DEFAULT_WILAYAS.map((wilaya) => [nameKey(wilaya.name), wilaya]))

/** The wilaya is stored by name in addresses; look it up by that name. */
export const wilayaByName = (name: string) => byName.get(nameKey(name))

/** Live delivery data. */
export const WILAYAS: Wilaya[] = [...DEFAULT_WILAYAS]
export const ZONES = { ...DEFAULT_ZONES } as Record<Zone["id"], Zone>
