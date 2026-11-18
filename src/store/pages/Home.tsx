import { CategoryTiles } from "@/store/components/home/CategoryTiles"
import { Hero } from "@/store/components/home/Hero"
import { Lookbook } from "@/store/components/home/Lookbook"
import { NewArrivals } from "@/store/components/home/NewArrivals"
import { NewsletterSignup } from "@/store/components/home/NewsletterSignup"
import { PromoBanner } from "@/store/components/home/PromoBanner"
import { ShopAll } from "@/store/components/home/ShopAll"
import { Story } from "@/store/components/home/Story"
import { Layout } from "@/store/components/Layout"
import { Marquee } from "@/store/components/Marquee"

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
