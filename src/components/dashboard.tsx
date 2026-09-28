"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CityMap } from "@/components/city-map"
import { SidePanel } from "@/components/side-panel"
import type { JourneyResponse, NoticesResponse, TrafficResponse } from "@/lib/types"

export function Dashboard() {
  const search = useSearchParams()
  const forceDown = search.get("feed") === "down"
  const mapDown = search.get("map") === "down"
  const [open, setOpen] = useState(true)
  const [flyToken, setFlyToken] = useState(0)
  const [terrain, setTerrain] = useState<"pending" | "on" | "off">("pending")
  const [traffic, setTraffic] = useState<TrafficResponse | null>(null)
  const [trafficError, setTrafficError] = useState<string | null>(null)
  const [trafficLoading, setTrafficLoading] = useState(true)
  const [notices, setNotices] = useState<NoticesResponse | null>(null)
  const [noticesError, setNoticesError] = useState<string | null>(null)
  const [noticesLoading, setNoticesLoading] = useState(true)
  const [journey, setJourney] = useState<JourneyResponse | null>(null)
  const [journeyLoading, setJourneyLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const url = forceDown ? "/api/traffic?simulate=fail" : "/api/traffic"
      try {
        const response = await fetch(url, { cache: "no-store" })
        const body = (await response.json()) as TrafficResponse
        if (cancelled) return
        setTraffic(body)
        setTrafficError(body.ok ? null : body.error ?? `Speed feed failed (${response.status})`)
      } catch (error) {
        if (cancelled) return
        setTrafficError(error instanceof Error ? error.message : "Speed feed failed")
      } finally {
        if (!cancelled) setTrafficLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [forceDown])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/notices", { cache: "no-store" })
        const body = (await response.json()) as NoticesResponse
        if (cancelled) return
        setNotices(body)
        setNoticesError(!response.ok || !body.ok ? body.error ?? `Notices failed (${response.status})` : body.error ?? null)
      } catch (error) {
        if (cancelled) return
        setNoticesError(error instanceof Error ? error.message : "Notices failed")
      } finally {
        if (!cancelled) setNoticesLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 5 * 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/journey", { cache: "no-store" })
        const body = (await response.json()) as JourneyResponse
        if (!cancelled) setJourney(body)
      } catch {
        if (!cancelled) {
          setJourney({
            tdas: {
              ok: false,
              error: "Journey forecast failed to load.",
              speedText: null,
              eta: null,
              distance: null,
              tunnel: null,
              alternates: [],
            },
            jtis: {
              ok: false,
              error: "Journey time indicators failed to load.",
              capturedAt: null,
              red: 0,
              amber: 0,
              green: 0,
              other: 0,
              harbour: [],
            },
          })
        }
      } finally {
        if (!cancelled) setJourneyLoading(false)
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), 60_000)
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return (
    <main className="relative h-dvh overflow-hidden bg-[#061018]">
      <CityMap
        corridors={traffic?.ok ? traffic.corridors : []}
        flyToken={flyToken}
        disabled={mapDown}
        onTerrain={(available) => setTerrain(available ? "on" : "off")}
      />
      <div className="pointer-events-none absolute top-4 left-14 z-10 hidden rounded-full border border-white/15 bg-[#07131c]/80 px-3 py-1 text-xs text-zinc-100 sm:block">
        Victoria Harbour · strategic roads
      </div>
      <SidePanel
        open={open}
        onToggle={() => setOpen((value) => !value)}
        onReplay={() => setFlyToken((value) => value + 1)}
        traffic={traffic}
        trafficLoading={trafficLoading}
        trafficError={trafficError}
        notices={notices}
        noticesLoading={noticesLoading}
        noticesError={noticesError}
        journey={journey}
        journeyLoading={journeyLoading}
        terrain={terrain}
      />
    </main>
  )
}
