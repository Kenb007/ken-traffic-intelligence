import type { Metadata } from "next"
import { Newsreader, Outfit } from "next/font/google"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
})

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
})

export const metadata: Metadata = {
  title: "Harbour corridors · Hong Kong Transport Department",
  description:
    "Live strategic-road speeds and traffic notices over satellite imagery of Hong Kong.",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${newsreader.variable} dark h-full antialiased`}>
      <body className={`${outfit.className} min-h-full`}>{children}</body>
    </html>
  )
}
