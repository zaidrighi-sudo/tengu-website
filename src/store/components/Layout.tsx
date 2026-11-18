import type { ReactNode } from "react"
import { useReveal } from "@/store/utils/useReveal"
import { CartDrawer } from "./CartDrawer"
import { Footer } from "./Footer"
import { Header } from "./Header"

/** Shared page shell. `overlayHeader` lets a hero sit under a transparent navbar. */
export function Layout({
  children,
  overlayHeader = true,
}: {
  children: ReactNode
  overlayHeader?: boolean
}) {
  useReveal()

  return (
    <>
      <Header overlay={overlayHeader} />
      <main id="main">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  )
}
