
/* ---------- FAQ ---------- */
export type FaqItem = { q: string; a: string; links?: { label: string; href: string }[] }
export type FaqGroup = { id: string; title: string; items: FaqItem[] }

export const faqGroups: FaqGroup[] = [
  {
    id: "orders",
    title: "Orders and payment",
    items: [
      {
        q: "How do I track my order?",
        a: "Once your order ships you get an SMS from dhd with a tracking number. You can also follow every step from packed to delivered in your account.",
        links: [{ label: "Open my orders", href: "#/account?tab=orders" }],
      },
      {
        q: "Can I change or cancel my order?",
        a: "We call you to confirm every order, and that is the moment to change a size, an address or cancel. After the call we pack within 24 hours, so write to us quickly with your order number.",
        links: [{ label: "Contact us", href: "#/contact" }],
      },
      {
        q: "Do I need an account to order?",
        a: "No. You only need your name, mobile number and address. An account saves your addresses, keeps your wishlist and shows tracking for every order in one place.",
      },
      {
        q: "How do I pay?",
        a: "Cash on delivery. You pay the courier in cash when your parcel arrives, after you have opened it and checked it. No card or advance payment is needed.",
      },
      {
        q: "Does loyalty unlock free home delivery?",
        a: "Yes. Once your delivered orders total {loyalty} or more, home delivery is free from then on — every order, every commune. Stop-desk remains at the commune price.",
      },
    ],
  },
  {
    id: "shipping",
    title: "Shipping",
    items: [
      {
        q: "How much is shipping?",
        a: `Delivery is calculated from your wilaya and your commune: from {minFee} to your door and up to {maxFee} in the far south. Stop-desk pickup is cheaper. Home delivery is free on orders over {price}.`,
        links: [{ label: "Shipping and returns", href: "#/shipping-returns" }],
      },
      {
        q: "Where do you deliver?",
        a: "All 58 wilayas, with dhd. Delivery takes 1 to 2 days around Alger and up to 5 to 7 days in the far south.",
      },
      {
        q: "What is a stop-desk?",
        a: "A dhd pickup point in your wilaya. It costs less than home delivery and you collect the parcel when it arrives, paying in cash at the desk.",
      },
    ],
  },
  {
    id: "returns",
    title: "Returns and exchanges",
    items: [
      {
        q: "What is your returns policy?",
        a: "You can return a piece within 7 days of delivery. It must be unworn, unwashed and have its tags attached.",
        links: [{ label: "Start a return", href: "#/contact" }],
      },
      {
        q: "When do I get my refund?",
        a: "Within 3 to 5 days of us receiving your parcel, in cash or by CCP / BaridiMob transfer.",
      },
      {
        q: "Can I exchange for a different size?",
        a: "Yes, if the size is in stock. Send the piece back and we ship the new size straight away. Delivery fees for exchanges are shared.",
      },
    ],
  },
  {
    id: "sizing",
    title: "Sizing and care",
    items: [
      {
        q: "How do Tengu pieces fit?",
        a: "Most hoodies and outerwear are cut oversized, joggers relaxed, tees regular to oversized. Every product shows its fit, and the size guide lists measurements for each size.",
        links: [{ label: "Size guide", href: "#/size-guide" }],
      },
      {
        q: "I am between sizes. What should I pick?",
        a: "For an oversized piece, take your usual size for the intended drape and size down for a closer fit. For regular and slim pieces, size up if you are between sizes.",
      },
      {
        q: "How should I wash heavyweight pieces?",
        a: "Turn inside out, wash cold with like colours, and hang dry or tumble low. Dark dyes settle after the first wash, so wash the first time on its own.",
      },
    ],
  },
  {
    id: "drops",
    title: "Drops and restocks",
    items: [
      {
        q: "What does sold out mean?",
        a: "We make small runs. When a run is gone it is gone, though some pieces return in later drops. Save a piece to your wishlist to keep an eye on it.",
        links: [{ label: "View my wishlist", href: "#/wishlist" }],
      },
      {
        q: "How do I hear about new drops?",
        a: "Join the list at the bottom of any page. We email for new drops and restocks only, and nothing else.",
      },
    ],
  },
]

/* ---------- Size guide ---------- */
export const guideSizes = ["S", "M", "L", "XL", "XXL", "XXXL"] as const

type Range = [number, number]
export type SizeTable = {
  id: string
  label: string
  note: string
  columns: string[]
  rows: Record<(typeof guideSizes)[number], (number | Range)[]>
}

/** All measurements in inches; the page converts to centimetres. */
export const sizeTables: SizeTable[] = [
  {
    id: "tops",
    label: "Hoodies and outerwear",
    note: "Body measurements, then the garment length and sleeve. Oversized pieces are cut roughly 4 to 6 inches wider than the chest range.",
    columns: ["Chest", "Waist", "Length", "Sleeve"],
    rows: {
      S: [[36, 38], [30, 32], 27, 24.5],
      M: [[38, 40], [32, 34], 28, 25],
      L: [[40, 42], [34, 36], 29, 25.5],
      XL: [[42, 45], [36, 39], 30, 26],
      XXL: [[45, 48], [39, 42], 31, 26.5],
      XXXL: [[48, 51], [42, 45], 32, 27],
    },
  },
  {
    id: "tees",
    label: "Tees",
    note: "Body measurements, then the garment length and sleeve. Tees run slightly shorter than hoodies.",
    columns: ["Chest", "Waist", "Length", "Sleeve"],
    rows: {
      S: [[36, 38], [30, 32], 26.5, 8.5],
      M: [[38, 40], [32, 34], 27.5, 9],
      L: [[40, 42], [34, 36], 28.5, 9.5],
      XL: [[42, 45], [36, 39], 29.5, 10],
      XXL: [[45, 48], [39, 42], 30.5, 10.5],
      XXXL: [[48, 51], [42, 45], 31.5, 11],
    },
  },
  {
    id: "joggers",
    label: "Joggers",
    note: "Body measurements at waist and hip, with the garment inseam and front rise.",
    columns: ["Waist", "Hip", "Inseam", "Rise"],
    rows: {
      S: [[30, 32], [37, 39], 28.5, 11.25],
      M: [[32, 34], [39, 41], 29, 11.5],
      L: [[34, 36], [41, 43], 29.5, 11.75],
      XL: [[36, 39], [43, 46], 30, 12],
      XXL: [[39, 42], [46, 49], 30.5, 12.5],
      XXXL: [[42, 45], [49, 52], 31, 13],
    },
  },
]

export const fitGuide = [
  { name: "Oversized", text: "Dropped shoulder, boxy body. Take your usual size for the full drape, or size down for a closer fit." },
  { name: "Relaxed", text: "Room through the body and leg without swimming. True to size for most people." },
  { name: "Regular", text: "A straight, classic cut. Size up if you are between sizes." },
  { name: "Slim", text: "Closer through the body. Size up if you want room to layer." },
]

export const measureSteps = [
  { title: "Chest", text: "Wrap the tape under your arms and across the fullest part of your chest. Keep it level and snug, not tight." },
  { title: "Waist", text: "Measure around your natural waist, just above the belly button. Breathe out and keep one finger under the tape." },
  { title: "Hip and inseam", text: "Hip is the fullest part of your hips. Inseam runs from the crotch to the ankle along the inside of your leg." },
]

/* ---------- Lookbook ---------- */
export const lookbookChapters = [
  {
    id: "after-dark",
    title: "After dark",
    note: "Shot between trains, after the shops close.",
  },
  {
    id: "off-the-ridge",
    title: "Off the ridge",
    note: "Quiet streets, early light, nowhere to be.",
  },
]
