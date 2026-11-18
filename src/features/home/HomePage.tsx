import { CategoryTiles } from "@/features/home/CategoryTiles"
import { Hero } from "@/features/home/Hero"
import { Lookbook } from "@/features/home/Lookbook"
import { NewArrivals } from "@/features/home/NewArrivals"
import { NewsletterSignup } from "@/features/subscribers/NewsletterSignup"
import { PromoBanner } from "@/features/home/PromoBanner"
import { ShopAll } from "@/features/home/ShopAll"
import { Story } from "@/features/home/Story"
import { Layout } from "@/features/shell/Layout"
import { Marquee } from "@/features/shell/Marquee"

export default function Home() {
  return (
    <Layout>
      <Hero />
      <Marquee />
      <CategoryTiles />
      <PromoBanner />
      <NewArrivals />
      <ShopAll />
      <Lookbook />
      <Story />
      <NewsletterSignup />
    </Layout>
  )
}
