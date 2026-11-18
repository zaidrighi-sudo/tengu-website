import { getLang } from "@/store/i18n"

const formatters = new Map<string, Intl.NumberFormat>()

function numberFormat(): Intl.NumberFormat {
  const lang = getLang()
  let formatter = formatters.get(lang)
  if (!formatter) {
    formatter = new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
      maximumFractionDigits: 0,
    })
    formatters.set(lang, formatter)
  }
  return formatter
}

/** Algerian dinar, no decimals: `5,900 DA`, `5 900 DA`, `5,900 د.ج`. */
export const formatPrice = (value: number) =>
  `${numberFormat().format(value)}\u00a0${getLang() === "ar" ? "د.ج" : "DA"}`

/** Checkout money. The dinar has no minor unit in everyday use. */
export const formatMoney = formatPrice
