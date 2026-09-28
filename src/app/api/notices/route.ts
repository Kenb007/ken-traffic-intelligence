import { fetchText } from "@/lib/fetch-text"
import type { NoticeItem, NoticesResponse } from "@/lib/types"

export const dynamic = "force-dynamic"

const FILES: { category: string; url: string }[] = [
  {
    category: "Special arrangements",
    url: "https://www.td.gov.hk/datagovhk_tis/traffic-notices/Special_Traffic_and_Transport_Arrangement.xml",
  },
  {
    category: "Road closures",
    url: "https://www.td.gov.hk/datagovhk_tis/traffic-notices/Notices_on_Temporary_Road_Closure.xml",
  },
  {
    category: "Expressways",
    url: "https://www.td.gov.hk/datagovhk_tis/traffic-notices/Notices_on_Expressways.xml",
  },
  {
    category: "Temporary speed limits",
    url: "https://www.td.gov.hk/datagovhk_tis/traffic-notices/Notices_on_Temporary_Speed_Limits.xml",
  },
]

export async function GET() {
  const results = await Promise.allSettled(
    FILES.map(async (file) => {
      const xml = await fetchText(file.url, 10 * 60 * 1000)
      return parseNotices(xml, file.category)
    }),
  )

  const notices = results.flatMap((result) => (result.status === "fulfilled" ? result.value : []))
  notices.sort((a, b) => dateValue(b.effective) - dateValue(a.effective))
  const errors = results.flatMap((result) =>
    result.status === "rejected"
      ? [result.reason instanceof Error ? result.reason.message : "Notice file failed"]
      : [],
  )

  const body: NoticesResponse = {
    ok: notices.length > 0 || errors.length === 0,
    error: errors.length > 0 ? errors.join(" ") : undefined,
    notices: notices.slice(0, 12),
  }
  return Response.json(body, { status: notices.length === 0 && errors.length > 0 ? 502 : 200 })
}

function parseNotices(xml: string, category: string): NoticeItem[] {
  return xml.split("<Notice>").slice(1).flatMap((block) => {
    const id = field(block, "TNID")
    const titleEn = decodeXml(field(block, "Title_EN"))
    const titleTc = decodeXml(field(block, "Title_TC"))
    if (!titleEn && !titleTc) return []
    return [
      {
        id: id || titleEn || titleTc,
        category,
        titleEn,
        titleTc,
        effective: field(block, "StartEffectiveDate"),
      },
    ]
  })
}

function field(block: string, name: string): string {
  return block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`))?.[1]?.trim() ?? ""
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .trim()
}

function dateValue(value: string): number {
  const match = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
  if (!match) return 0
  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  return Date.UTC(year, month - 1, day)
}
