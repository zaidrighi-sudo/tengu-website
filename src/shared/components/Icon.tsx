import type { ReactNode } from "react"

export type IconName =
  | "arrow"
  | "bag"
  | "close"
  | "menu"
  | "search"
  | "user"
  | "instagram"
  | "x"
  | "youtube"
  | "grid"
  | "lock"
  | "return"
  | "truck"
  | "check"
  | "alert"
  | "chevron"
  | "mail"
  | "box"
  | "plus"
  | "heart"
  | "eye"
  | "eye-off"
  | "pin"
  | "minus"
  | "phone"
  | "cash"
  | "external-link"
  | "log-out"

const paths: Record<IconName, ReactNode> = {
  phone: (
    <>
      <path d="M6.5 4h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A14.5 14.5 0 0 1 4.5 6a2 2 0 0 1 2-2Z" />
    </>
  ),
  cash: (
    <>
      <rect x="3" y="6.5" width="18" height="11" rx="1" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6.5 9.5v5" />
      <path d="M17.5 9.5v5" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  bag: (
    <>
      <path d="M5.5 8.5h13l-1 12h-11l-1-12Z" />
      <path d="M9 9V6.5a3 3 0 0 1 6 0V9" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </>
  ),
  menu: (
    <>
      <path d="M4 8h16" />
      <path d="M4 16h16" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20.5c.6-4 3.5-6 7.5-6s6.9 2 7.5 6" />
    </>
  ),
  instagram: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.75" />
      <path d="M16.9 7.1h.01" />
    </>
  ),
  x: (
    <>
      <path d="m5 5 14 14" />
      <path d="M19 5 5 19" />
    </>
  ),
  grid: (
    <>
      <rect x="4" y="4" width="6.5" height="6.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="9.5" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
    </>
  ),
  return: (
    <>
      <path d="M9 6 4.5 10.5 9 15" />
      <path d="M4.5 10.5H15a4.5 4.5 0 0 1 0 9h-3" />
    </>
  ),
  truck: (
    <>
      <path d="M3 6.5h11v10H3z" />
      <path d="M14 10h4l3 3.2v3.3h-7" />
      <circle cx="7.5" cy="17.5" r="1.75" />
      <circle cx="17" cy="17.5" r="1.75" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.4h.01" />
    </>
  ),
  chevron: <path d="m7 10 5 5 5-5" />,
  mail: (
    <>
      <rect x="3.5" y="5.5" width="17" height="13" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  box: (
    <>
      <path d="M12 3.5 20 8v8.5L12 21l-8-4.5V8l8-4.5Z" />
      <path d="m4 8 8 4.5L20 8" />
      <path d="M12 12.5V21" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </>
  ),
  heart: (
    <path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" />
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M9.9 5.7A9 9 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a15 15 0 0 1-2.6 3.4" />
      <path d="M6.3 7.3A15 15 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.7-.8" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="m3.5 3.5 17 17" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s6.5-5.7 6.5-11A6.5 6.5 0 0 0 5.5 10c0 5.3 6.5 11 6.5 11Z" />
      <circle cx="12" cy="10" r="2.25" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  youtube: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="3.5" />
      <path d="m10.25 9.5 4 2.5-4 2.5v-5Z" />
    </>
  ),
  "external-link": (
    <>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
    </>
  ),
  "log-out": (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17 21 12 16 7" />
      <path d="M21 12H9" />
    </>
  ),
}

export function Icon({ name, className = "" }: { name: IconName; className?: string }) {
  return (
    <svg
      className={`icon ${className}`}
      data-icon={name}
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  )
}
