import assert from "node:assert/strict"
import piersFile from "../../data/ferry-piers.json" with { type: "json" }
import { SUN_ROUTES } from "./ferry-routes.ts"

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
