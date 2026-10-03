import { execFileSync, spawnSync } from "node:child_process"

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim()
}

const branch = git(["branch", "--show-current"])
if (branch !== "main") {
  console.error(`Refusing to deploy from ${branch || "a detached commit"}. The live site is built from main only.`)
  process.exit(1)
}

const dirty = git(["status", "--porcelain"])
if (dirty) {
  console.error("Refusing to deploy a dirty tree. Commit on main first.")
  process.exit(1)
}

execFileSync("git", ["fetch", "origin", "main"], { stdio: "inherit" })
const head = git(["rev-parse", "HEAD"])
const originMain = git(["rev-parse", "origin/main"])
if (head !== originMain) {
  console.error("Refusing to deploy. This commit is not origin/main.")
  process.exit(1)
}

const result = spawnSync("vinext-cloudflare", ["deploy"], { stdio: "inherit" })
process.exit(result.status === null ? 1 : result.status)
