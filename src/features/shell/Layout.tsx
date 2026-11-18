import type { ReactNode } from "react"
import { useReveal } from "@/features/shell/useReveal"
import { CartDrawer } from "@/features/cart/CartDrawer"
import { Footer } from "@/features/shell/Footer"
import { Header } from "@/features/shell/Header"

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
