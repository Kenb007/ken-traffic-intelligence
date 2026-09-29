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
  title: "Traffic Intelligence · Hong Kong",
  description:
    "Live strategic-road speeds, harbour crossings, land control points, and weather warnings over Hong Kong.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} ${hud.variable} dark h-full antialiased`}>
      <body className={`${outfit.className} min-h-full`}>{children}</body>
    </html>
  )
}
