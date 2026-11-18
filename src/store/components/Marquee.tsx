import { marqueeItems } from "@/store/data/products"
import { cn } from "@/store/utils/cn"
import { tr } from "@/store/i18n"

/** One loop of the strip. Repeated so a single track always spans wide screens. */
function Track() {
  return (
    <div className="marquee-track">
      {[0, 1].flatMap((copy) =>
        marqueeItems.map((item) => (
          <span
            key={`${copy}-${item.text}`}
            className={cn(item.jp && "jp")}
            lang={item.jp ? "ja" : undefined}
          >
            {tr(item.text)}
          </span>
        )),
      )}
    </div>
  )
}

/** Decorative strip. Its message (new drop, free shipping) also lives in the
 *  announcement bar, so it is hidden from assistive tech. */
export function Marquee() {
  return (
    <div className="marquee" aria-hidden="true">
      <Track />
      <Track />
    </div>
  )
}
