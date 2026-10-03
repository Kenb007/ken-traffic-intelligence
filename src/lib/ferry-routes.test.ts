import assert from "node:assert/strict"
import piersFile from "../../data/ferry-piers.json" with { type: "json" }
import { SUN_ROUTES, ferryBadge } from "./ferry-routes.ts"

const SPEC = [
  "CECC",
  "CCCE",
  "CEMW",
  "MWCE",
  "NPHH",
  "HHNP",
  "NPKC",
  "KCNP",
  "IIPECMUW",
  "IIMUWPEC",
  "IIMUWCMW",
  "IICMWMUW",
  "IICMWCHC",
  "IICHCCMW",
  "IICHCMUW",
  "IIMUWCHC",
]

assert.deepEqual(SUN_ROUTES.map((route) => route.code), SPEC)

const pierIds = new Set(piersFile.piers.map((pier) => pier.id))
for (const route of SUN_ROUTES) {
  assert.ok(pierIds.has(route.from), route.from)
  assert.ok(pierIds.has(route.to), route.to)
}

assert.equal(ferryBadge("IICMWCHC").tc, "橫水渡")
assert.equal(ferryBadge("IICMWCHC").en, "Inter-island")
assert.equal(ferryBadge("CECC").tc, "新渡輪")
assert.equal(ferryBadge("1").tc, "港九小輪")
assert.equal(ferryBadge("天星").tc, "天星")
assert.equal(ferryBadge("IICMWCHC").tc.includes("IICMWCHC"), false)
