import type { Metadata } from "next"
import { IBM_Plex_Mono, Newsreader, Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
})

const hud = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-hud",
})

export const metadata: Metadata = {
  title: "Harbour corridors · Hong Kong Transport Department",
  description:
    "Live harbour speeds, cameras, road works, and toll points over satellite imagery of Hong Kong.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} ${hud.variable} dark h-full antialiased`}>
      <body className={`${outfit.className} min-h-full`}>{children}</body>
    </html>
  )
}
