export const SUN_ROUTES: { code: string; from: string; to: string; destTc: string; destEn: string }[] = [
  { code: "CECC", from: "sun-central", to: "sun-cheung-chau", destTc: "長洲", destEn: "Cheung Chau" },
  { code: "CCCE", from: "sun-cheung-chau", to: "sun-central", destTc: "中環", destEn: "Central" },
  { code: "CEMW", from: "sun-central", to: "sun-mui-wo", destTc: "梅窩", destEn: "Mui Wo" },
  { code: "MWCE", from: "sun-mui-wo", to: "sun-central", destTc: "中環", destEn: "Central" },
  { code: "NPHH", from: "sun-north-point", to: "sun-hung-hom", destTc: "紅磡", destEn: "Hung Hom" },
  { code: "HHNP", from: "sun-hung-hom", to: "sun-north-point", destTc: "北角", destEn: "North Point" },
  { code: "NPKC", from: "sun-north-point", to: "sun-kowloon-city", destTc: "九龍城", destEn: "Kowloon City" },
  { code: "KCNP", from: "sun-kowloon-city", to: "sun-north-point", destTc: "北角", destEn: "North Point" },
  { code: "IIPECMUW", from: "hkkf-peng-chau", to: "sun-mui-wo", destTc: "梅窩", destEn: "Mui Wo" },
  { code: "IIMUWPEC", from: "sun-mui-wo", to: "hkkf-peng-chau", destTc: "坪洲", destEn: "Peng Chau" },
  { code: "IIMUWCMW", from: "sun-mui-wo", to: "sun-chi-ma-wan", destTc: "芝麻灣", destEn: "Chi Ma Wan" },
  { code: "IICMWMUW", from: "sun-chi-ma-wan", to: "sun-mui-wo", destTc: "梅窩", destEn: "Mui Wo" },
  { code: "IICMWCHC", from: "sun-chi-ma-wan", to: "sun-cheung-chau", destTc: "長洲", destEn: "Cheung Chau" },
  { code: "IICHCCMW", from: "sun-cheung-chau", to: "sun-chi-ma-wan", destTc: "芝麻灣", destEn: "Chi Ma Wan" },
  { code: "IICHCMUW", from: "sun-cheung-chau", to: "sun-mui-wo", destTc: "梅窩", destEn: "Mui Wo" },
  { code: "IIMUWCHC", from: "sun-mui-wo", to: "sun-cheung-chau", destTc: "長洲", destEn: "Cheung Chau" },
]

export function ferryBadge(code: string): { tc: string; en: string } {
  if (code === "天星") return { tc: "天星", en: "Star Ferry" }
  if (code.startsWith("II")) return { tc: "橫水渡", en: "Inter-island" }
  if (/^[A-Z]{4,}$/.test(code)) return { tc: "新渡輪", en: "Sun Ferry" }
  if (/^[1-4]$/.test(code)) return { tc: "港九小輪", en: "HKKF" }
  return { tc: code, en: code }
}
