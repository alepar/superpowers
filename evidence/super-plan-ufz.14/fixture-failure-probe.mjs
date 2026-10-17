// Exercise the actual replay fixture bodies with failed helper/inspection calls.
// The outer oracle owns and stops only children this probe created.
import * as fs from 'node:fs'
import * as cp from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
const fixtureRoot = path.resolve(process.argv[2] || '.')
const source = fs.readFileSync(path.join(fixtureRoot, 'tests/super-code/replay-harness.mjs'), 'utf8')
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
const scriptsDir = path.join(fixtureRoot, 'skills/super-code/scripts')
const helpersStart = source.indexOf('async function withFixtureProcesses(')
const helpersEnd = source.indexOf('// ---------- extraction ----------')
const helpers = helpersStart < 0 ? '' : source.slice(helpersStart, helpersEnd)
const first = source.indexOf("      scenario('scripts: remove-task-worktree —")
const second = source.indexOf("      scenario('scripts: stop-run-processes —", first)
const end = source.indexOf("      scenario('scripts: tree-deps —", second)
let failed = 0
for (const [fixture, body] of [['worktree', source.slice(first, second)], ['processes', source.slice(second, end)]]) {
  for (const mode of ['helper-throws', 'ps-unavailable']) {
    const owned = [], dirs = [], failures = []
    const sentinel = cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},300000)'], { stdio: 'ignore' })
    const spawn = (...args) => { const child = cp.spawn(...args); owned.push(child); return child }
    const execFileSync = (file, args, options) => {
      const result = cp.execFileSync(file, args, options)
      if (file === 'sh' && args[0] === '-c') owned.push({ pid: Number(result.trim()) })
      return result
    }
    const spawnSync = (file, args, options) => {
      if (mode === 'helper-throws' && file === '/bin/bash' && /(?:stop-run-processes|remove-task-worktree)$/.test(args[0])) throw Error('injected helper failure')
      if (mode === 'ps-unavailable' && file === 'ps') return { status: null, stdout: null, stderr: null, error: Error('injected ps unavailable') }
      // Keep the real owned processes alive until inspection fails; never run a helper's kill mode.
      if (mode === 'ps-unavailable' && file === '/bin/bash' && /(?:stop-run-processes|remove-task-worktree)$/.test(args[0])) return { status: 4, stdout: 'unknown: injected inspection failure\n', stderr: '' }
      return cp.spawnSync(file, args, options)
    }
    const args = { readFileSync: fs.readFileSync, mkdirSync: fs.mkdirSync, writeFileSync: fs.writeFileSync, rmSync: fs.rmSync, existsSync: fs.existsSync,
      mkdtempSync: (...a) => { const d = fs.mkdtempSync(...a); dirs.push(d); return d },
      os, path, process, execFileSync, spawnSync, spawn, scriptsDir, bashPath: '/bin/bash',
      scenario() {}, check(ok, message) { if (!ok) failures.push(message) } }
    let error
    try { await new AsyncFunction(...Object.keys(args), helpers + body)(...Object.values(args)) }
    catch (e) { error = e }
    await new Promise(resolve => setTimeout(resolve, 100))
    const alive = pid => { const r = cp.spawnSync('ps', ['-o', 'stat=', '-p', String(pid)], { encoding: 'utf8' }); if (r.error || typeof r.stdout !== 'string') throw Error('oracle inspection unavailable'); return r.stdout.trim() !== '' && !r.stdout.trim().startsWith('Z') }
    const leaked = owned.filter(c => alive(c.pid)).map(c => c.pid)
    const retained = dirs.filter(d => fs.existsSync(d))
    const preserved = alive(sentinel.pid)
    const explicit = mode === 'ps-unavailable' ? /inspect|unavailable/.test(error?.message ?? '') : error?.message === 'injected helper failure'
    const ok = leaked.length === 0 && retained.length === 0 && preserved && explicit && !!error
    console.log(`${ok ? 'PASS' : 'FAIL'} ${fixture}/${mode}: leaked=${JSON.stringify(leaked)} retained-fixture-dirs=${retained.length} sentinel-preserved=${preserved} error=${error?.message} assertions-before-error=${failures.length}`)
    if (!ok) failed++
    // Independent oracle teardown, including the deliberately unrelated sentinel.
    for (const c of [...owned, sentinel]) { try { process.kill(c.pid, 'SIGKILL') } catch (e) { if (e.code !== 'ESRCH') throw e } }
    await new Promise(resolve => setTimeout(resolve, 100))
    for (const d of dirs) fs.rmSync(d, { recursive: true, force: true })
  }
}
console.log(`fixture failure probe: ${4 - failed} passed, ${failed} failed`)
process.exitCode = failed ? 1 : 0
