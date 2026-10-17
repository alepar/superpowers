diff --git a/skills/super-code/scripts/run-profile.mjs b/skills/super-code/scripts/run-profile.mjs
index c84390ea..3ed891e9 100644
--- a/skills/super-code/scripts/run-profile.mjs
+++ b/skills/super-code/scripts/run-profile.mjs
@@ -43,8 +43,9 @@ const USAGE = `usage: run-profile (--workflow <dir>... | --codex <thread>... | -
   --codex-home <dir>  where Codex keeps sessions/ (default: ~/.codex)
   --ledger <file>     the run's progress.md, for ordinary-subagent runs (default: the one the
                       coordinator's commands name): merge and task outcomes
-  --beads <file>      a saved \`bd list --all --json --limit 0\` dump, for ordinary-subagent runs
-                      (default: run bd in the coordinator's directory): the dependency graph
+  --beads <file>      a saved \`bd list --all --json --limit 0\` dump: creation evidence, and for
+                      ordinary-subagent runs the observed residual dependency graph
+                      (default for ordinary runs: run bd in the coordinator's directory)
   --cap <N>           the coordinator's slot cap (default: min(concurrency, runtimeSlots - 2) from
                       the Launch: line; for an ordinary-subagent run, its Launch: concurrency,
                       else 1; else unlimited)
@@ -305,7 +306,7 @@ function stageOf(kind, suffix) {
     case 'reopen': case 'discard': return 'cancel'
     case 'ledger': case 'ledger-append': case 'read-ledger': return 'ledger'
     case 'plan': case 'plan-rest': case 'split': case 'close-split': return 'planning'
-    case 'bd-ready': case 'bd-ready-topup': case 'bd-ready-recheck': case 'blocker-check': case 'close-epics': return 'ready'
+    case 'bd-ready': case 'bd-ready-topup': case 'bd-ready-recheck': case 'blocker-check': case 'close-epics': case 'resume-check': return 'ready'
     case 'edge-audit': case 'edge-cuts': case 'edge-add': return 'audit'
     case 'sweep': case 'final-review': case 'reconcile-buckets': case 'worktree-sweep': case 'assemble': return 'finish'
     default: return 'other'
@@ -489,7 +490,7 @@ function discover(projects, epic) {
 // with every other character of the bead id written `_`, and `__<n>` appended to a repeated name.
 const normName = s => String(s).toLowerCase().replace(/[^a-z0-9_]/g, '_')
 const RUN_KINDS = ['plan', 'plan-rest', 'final-review', 'sweep', 'worktree-sweep', 'reconcile-buckets', 'bd-ready', 'close-epics',
-  'edge-audit', 'edge-cuts', 'edge-add', 'read-ledger', 'ledger-append']
+  'edge-audit', 'edge-cuts', 'edge-add', 'read-ledger', 'ledger-append', 'resume-check']
 const KINDS_LONGEST_FIRST = [...BEAD_KINDS].sort((a, b) => b.length - a.length)
 // The label a Codex task name stands for; byNorm maps a normalized bead id to the id (null when two
 // ids normalize alike). Null when the name does not follow the rule.
@@ -852,8 +853,9 @@ if (opt.summarize) {
   const fits = ps.map(x => x.simulation?.fit).filter(f => typeof f === 'number').sort((a, b) => a - b)
   if (fits.length) out.push(`Baseline: model fit — median ${fits[Math.floor(fits.length / 2)]} · within 10% of actual ${fits.filter(f => f >= 0.9 && f <= 1.1).length} of ${fits.length} · lowest ${fits[0]}`)
   const w = {}, wn = {}
-  for (const x of ps) for (const b of x.beads) if (b.landed && b.waitCause !== 'none') { add(w, b.waitCause, b.waitMs); add(wn, b.waitCause, 1) }
-  out.push(`Baseline: waits, summed per bead (not wall time) — ${Object.keys(w).length ? Object.entries(w).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${H(v)} (${wn[k]})`).join(' · ') : 'none past dispatch latency'}`)
+  for (const x of ps) for (const b of x.beads) if (b.landed && b.waitCause !== 'none' && Number.isFinite(b.waitMs)) { add(w, b.waitCause, b.waitMs); add(wn, b.waitCause, 1) }
+  const unknownWaits = sum(ps.map(x => x.beads.filter(b => b.landed && !Number.isFinite(b.waitMs)).length))
+  out.push(`Baseline: waits, summed per bead (not wall time) — ${Object.keys(w).length ? Object.entries(w).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${H(v)} (${wn[k]})`).join(' · ') : unknownWaits ? 'none measured past dispatch latency' : 'none past dispatch latency'}${unknownWaits ? ` · unknown readiness for ${unknownWaits} landed bead(s); wait not measured` : ''}`)
   const rd = {}, rn = {}
   for (const x of ps) for (const [k, v] of Object.entries(x.criticalPath.redo ?? {})) { add(rd, k, v.ms); add(rn, k, v.beads.length) }
   if (Object.values(rd).some(v => v >= 1000)) out.push(`Baseline: redo on the critical path, up to — ${Object.entries(rd).filter(([, v]) => v >= 1000).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${H(v)} (${rn[k]})`).join(' · ')} (of ${H(sum(ps.map(x => x.window.graphMs)))} task-graph time)`)
@@ -937,6 +939,9 @@ const printContext = () => { const c = contextResult(runs); console.log([...c.li
 // and the merges, which the coordinator runs itself, from its own commands ----
 const ordinary = runs.filter(r => r.source !== 'workflow')
 const serialRuns = new Set(ordinary.map(r => r.runId))
+let tracker = null
+if (opt.beads) { try { tracker = JSON.parse(readFileSync(opt.beads, 'utf8')) } catch { die(2, `not a bd list JSON dump: ${opt.beads}`) } }
+const timestamp = t => typeof t === 'string' && Number.isFinite(Date.parse(t)) ? Date.parse(t) : null
 let ledger = null, leaves = null, noLaneTiming = 0
 if (ordinary.length) {
   const named = [...new Set(ordinary.flatMap(r => r.callerCalls.flatMap(c => [...c.text.matchAll(LEDGER_RE)].map(m => m[1]))))]
@@ -945,9 +950,9 @@ if (ordinary.length) {
   if (opt.ledger && !ledger) die(2, `cannot read the ledger: ${opt.ledger}`)
   const ep = opt.epic ?? ledger?.epic
   if (!ep) { printContext(); die(2, 'an ordinary-subagent run needs --epic <id> (or a --ledger whose Launch: line names it)') }
-  let dump = null
-  if (opt.beads) { try { dump = JSON.parse(readFileSync(opt.beads, 'utf8')) } catch { die(2, `not a bd list JSON dump: ${opt.beads}`) } }
-  else for (const r of ordinary) if ((dump = bdDump(r.cwd))) break
+  let dump = tracker
+  if (!opt.beads) for (const r of ordinary) if ((dump = bdDump(r.cwd))) break
+  tracker = dump
   leaves = Array.isArray(dump) ? bdLeaves(dump, ep) : null
   const ids = new Set([...(leaves?.keys() ?? []), ...(ledger?.ids ?? [])])
   const byNorm = new Map()
@@ -1018,8 +1023,14 @@ if (!timed.some(a => a.bead) && !timed.some(a => serialRuns.has(a.run))) {
   const why = !dirs.length && !codexIn.length && !subIn.length ? `no Workflow run directory found${opt.epic ? ` for ${opt.epic}` : ''}, nor an ordinary-subagent coordinator's log (this harness keeps none, or they were cleaned up)`
     : !runs.length ? `every run given was a dryRun launch (${skippedDry.map(r => r.runId).join(', ')})`
     : 'no timed task dispatch in the runs given (transcripts missing)'
-  printContext()
-  console.log(`Profile: unavailable — ${why}`)
+  const ctx = contextResult(runs)
+  const lines = [...ctx.lines, ...contextUnmeasured(ctx), `Profile: unavailable — ${why}`]
+  console.log(lines.join('\n'))
+  if (opt.out) {
+    writeFileSync(`${opt.out}.json`, JSON.stringify({ version: 1, epic, partial: true, unavailable: why,
+      invocations: [], context: contextJson(ctx.summary), summary: lines }, null, 2) + '\n')
+    writeFileSync(`${opt.out}.md`, [`# Run profile — ${epic ?? 'unknown epic'}`, '', '```', ...lines, '```', '', contextMarkdown(ctx.summary)].join('\n'))
+  }
   process.exit(3)
 }
 const invocations = runs.map(r => {
@@ -1057,7 +1068,7 @@ const runLevel = (() => {
   const mapped = Object.values(kinds).filter(k => k.mapped), unmapped = Object.values(kinds).filter(k => !k.mapped)
   return {
     unmapped: ds.filter(a => !a.mapped).length,
-    json: { dispatches: ds.length, wallMs: wall, busyMs: busy, byActive, peak, kinds: Object.values(kinds), coordinatorMergeMs: sum(merges.map(a => a.dur)) },
+    json: { scope: 'all-agent concurrency', dispatches: ds.length, wallMs: wall, busyMs: busy, byActive, peak, kinds: Object.values(kinds), coordinatorMergeMs: sum(merges.map(a => a.dur)) },
     lines: [
       `Profile: concurrency — ${ds.length} dispatches over ${fmtDur(wall)} · a dispatch running ${fmtDur(busy)} (${pct(busy, wall)}%) · dispatches at once: ${Object.entries(byActive).map(([k, v]) => `${k === '3' ? '3+' : k} for ${pct(v, wall)}%`).join(' · ')} of the time · peak ${peak}`,
       `Profile: dispatch time by kind, summed — ${[kt(mapped), unmapped.length ? `not named for a bead: ${kt(unmapped)}` : '', merges.length ? `merges run by the coordinator ${fmtDur(sum(merges.map(a => a.dur)))} (${merges.length})` : ''].filter(Boolean).join(' · ')}`,
@@ -1081,8 +1092,8 @@ if (!timed.some(a => a.bead)) {
 }
 
 // ---- the graph: every planner row seen, read from journal results (a planner cached on resume has
-// no transcript). Deps are the open in-tree blockers at that planning, so the union is the run's
-// graph; plus planner-found missing edges, and applied edge cuts with the time they landed ----
+// no transcript). This union is an observed invocation/residual graph, not reconstructed history;
+// plus planner-found missing edges, and applied edge cuts with the time they landed ----
 const runStart = new Map(invocations.map(v => [v.runId, v.start]))
 const doneAt = a => a.end ?? runStart.get(a.run) ?? windowStart
 const rows = new Map()
@@ -1094,28 +1105,33 @@ for (const a of allAgents.filter(x => /^(plan|plan-rest|edge-cuts)$/.test(x.kind
     for (const m of a.result.mapping) {
       if (!m || typeof m.id !== 'string') continue
       const row = rows.get(m.id) ?? { id: m.id, n: m.n, deps: new Set(), files: new Set(), opaque: false, graph: false, mappings: [] }
+      row.createdAt ??= timestamp(m.created_at ?? m.createdAt)
       for (const d of m.deps ?? []) if (d !== m.id) row.deps.add(d)
       for (const f of m.files ?? []) row.files.add(f)
       row.graph ||= Array.isArray(m.deps)
       row.opaque ||= m.opaque === true
-      row.mappings.push({ at, agent })
+      row.mappings.push({ at: a.end ?? null, agent })
       rows.set(m.id, row)
     }
     for (const e of a.result.missingEdges ?? []) if (e?.dependent && e?.blocker) rows.get(e.dependent)?.deps.add(e.blocker)
   }
   if (a.kind === 'edge-cuts') for (const c of a.result.applied ?? []) if (c?.dependent && c?.blocker) {
-    cuts.push({ dependent: c.dependent, blocker: c.blocker, kind: c.kind, at, agent })
+    cuts.push({ dependent: c.dependent, blocker: c.blocker, kind: c.kind, at: a.end ?? null, agent })
     for (const e of c.add ?? []) if (e?.dependent && e?.blocker) rows.get(e.dependent)?.deps.add(e.blocker)
   }
 }
-// An ordinary-subagent run has no planner rows in a journal: its graph is bd's, released when its
-// first planner returned.
+// Ordinary tracker edges describe the observed residual graph. A timed planner supplies a mapping
+// boundary, not creation or historical dependency releases. Without one the boundary stays unknown.
+const creation = new Map((Array.isArray(tracker) ? tracker : []).map(b => [b.id, timestamp(b.created_at)]))
+const trackerDeps = new Map((Array.isArray(tracker) ? tracker : []).map(b => [b.id,
+  (b.dependencies ?? []).filter(d => d.type === 'blocks').map(d => d.depends_on_id)]))
 if (leaves) {
   const plan0 = timed.filter(a => serialRuns.has(a.run) && a.stage === 'planning').sort((x, y) => x.end - y.end)[0] ?? null
-  for (const [id, deps] of leaves) if (!rows.has(id)) rows.set(id, { id, n: undefined, deps: new Set(deps), files: new Set(), opaque: false, graph: true, mappings: [{ at: plan0 ? plan0.end : windowStart, agent: plan0 }] })
+  for (const [id, deps] of leaves) if (!rows.has(id)) rows.set(id, { id, n: undefined, deps: new Set(deps), files: new Set(), opaque: false, graph: true, residual: true,
+    mappings: plan0 && (creation.get(id) ?? -Infinity) <= plan0.end ? [{ at: plan0.end, agent: plan0 }] : [] })
 }
 // The planning a dispatch at time t followed: the bead's latest mapping by then.
-const mappingFor = (id, t) => { const ms = rows.get(id)?.mappings ?? []; return ms.filter(m => m.at <= t + EPS).at(-1) ?? ms[0] ?? null }
+const mappingFor = (id, t) => (rows.get(id)?.mappings ?? []).filter(m => m.at !== null && m.at <= t + EPS).at(-1) ?? null
 const cutAt = (dependent, blocker) => cuts.find(c => c.dependent === dependent && c.blocker === blocker)?.at ?? Infinity
 const depsAt = (id, t) => [...(rows.get(id)?.deps ?? [])].filter(d => rows.has(d) && cutAt(id, d) > t)
 const dependentsOf = new Map()
@@ -1210,16 +1226,27 @@ for (const b of beads.values()) {
   const dur = as => sum(as.map(a => a.dur))
   const deps = depsAt(b.id, S)
   b.deps = deps
-  const ready = Math.max(mappingFor(b.id, S)?.at ?? invStart, ...deps.map(d => usableBy(d, S)).filter(Boolean).map(x => x.end))
+  b.createdAt = creation.get(b.id) ?? rows.get(b.id)?.createdAt ?? null
+  b.mappingReadyAt = mappingFor(b.id, S)?.at ?? null
+  // Include external/unobserved blockers too: dropping them from the modeled in-tree graph cannot
+  // establish when they became usable. An empty, known mapping needs no dependency release.
+  const required = [...new Set([...(rows.get(b.id)?.deps ?? []),
+    ...(rows.get(b.id)?.residual ? trackerDeps.get(b.id) ?? [] : [])])].filter(d => d !== b.id && cutAt(b.id, d) > S)
+  const releases = required.map(d => usableBy(d, S)?.end ?? null)
+  b.dependencyReadyAt = !rows.get(b.id)?.graph || releases.some(t => t === null) ? null
+    : required.length ? Math.max(...releases) : b.mappingReadyAt
+  const known = b.mappingReadyAt !== null && b.dependencyReadyAt !== null
+  const ready = known ? Math.max(b.createdAt ?? -Infinity, b.mappingReadyAt, b.dependencyReadyAt) : null
   // Ready before this invocation began (a relaunch, or the caller's next round): not a wait inside it.
-  b.carriedMs = Math.max(0, invStart - ready)
-  b.readyAt = Math.max(ready, invStart)
+  b.carriedMs = ready === null ? null : Math.max(0, invStart - ready)
+  b.readyAt = ready === null ? null : Math.max(ready, invStart)
   b.dispatchedAt = S
-  b.waitMs = Math.max(0, S - b.readyAt)
+  b.waitMs = ready === null ? null : Math.max(0, S - b.readyAt)
   const earlier = b.attempts.filter(x => x !== at && x.start < S)
   const earlierHere = earlier.filter(x => x.start >= invStart - EPS)
   const bounced = earlierHere.filter(x => x.status === 'STACK_CONFLICT')
-  if (b.waitMs <= DISPATCH_GAP) b.waitCause = 'none'
+  if (b.waitMs === null) b.waitCause = 'unknown'
+  else if (b.waitMs <= DISPATCH_GAP) b.waitCause = 'none'
   else if (bounced.length) b.waitCause = 'stack-conflict'
   else if (earlierHere.some(x => x.agents.some(a => a.stage === 'cancel'))) b.waitCause = 'cancelled'
   else if (earlierHere.length) b.waitCause = 'retry'
@@ -1262,6 +1289,7 @@ const runEnd = Math.max(...timed.map(a => a.end))
 const lastTaskStep = lastLanding ?? latest(timed.filter(a => a.bead && a.stage !== 'ledger')) ?? latest(timed)
 const graphEnd = lastTaskStep.end
 const actualGraphMs = graphEnd - windowStart
+const modelWindow = lastLanding ? 'first dispatch to last landing' : 'first dispatch to last task step'
 
 // ---- merge lane, runtime slots, conflict files ----
 const laneAgents = timed.filter(a => LANE.has(a.stage))
@@ -1281,7 +1309,7 @@ const lane = {
   lane.peakQueue = 0
   for (const [, d] of ev) { n += d; lane.peakQueue = Math.max(lane.peakQueue, n) }
 }
-const runtime = { slots: runtimeSlots, peak: 0, fullMs: 0 }
+const runtime = { scope: 'all-agent concurrency', slots: runtimeSlots, peak: 0, fullMs: 0 }
 {
   const ev = timed.filter(a => !a.synthetic).flatMap(a => [[a.start, 1], [a.end, -1]]).sort((x, y) => x[0] - y[0] || x[1] - y[1])
   let n = 0, prev = null
@@ -1291,6 +1319,14 @@ const runtime = { slots: runtimeSlots, peak: 0, fullMs: 0 }
     runtime.peak = Math.max(runtime.peak, n)
   }
 }
+const taskSlots = { scope: 'task-slot concurrency', cap: Number.isFinite(cap) ? cap : null, peak: 0, fullMs: 0 }
+{
+  let n = 0, prev = null
+  for (const [t, d] of slotSpans.filter(s => s.end > s.start).flatMap(s => [[s.start, 1], [s.end, -1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
+    if (prev !== null && n >= cap) taskSlots.fullMs += t - prev
+    n += d; prev = t; taskSlots.peak = Math.max(taskSlots.peak, n)
+  }
+}
 const FILE_RE = /(?:[\w@.+-]+\/)+[\w@.+-]+\.[A-Za-z0-9]{1,8}\b/g
 const conflict = new Map()
 const hit = (f, k) => { const c = conflict.get(f) ?? { file: f, stackConflicts: new Set(), seamOverlaps: 0 }; if (k) c.stackConflicts.add(k); else c.seamOverlaps++; conflict.set(f, c) }
@@ -1374,9 +1410,18 @@ const segments = []
     const a = step.agent
     const why = step.pred?.why
     if (step.pred && a.start > t) {
+      const b = beads.get(a.bead)
+      if (why !== 'relaunch' && a.attempt?.agents[0] === a && b?.final === a.attempt) {
+        const end = b.readyAt === null ? a.start : Math.min(a.start, Math.max(t, b.readyAt))
+        if (end > t) {
+          segments.push({ kind: b.readyAt === null ? 'unmeasured-gap' : 'pre-availability', bead: null,
+            label: `${b.readyAt === null ? 'readiness unknown' : 'before availability'} → ${a.label}`, start: t, ms: end - t })
+          t = end
+        }
+      }
       const gap = a.start - t
       const kind = why === 'slot' || why === 'hot-file' || why === 'relaunch' ? why : gap <= DISPATCH_GAP ? 'dispatch' : 'wait'
-      segments.push({ kind, bead: a.bead, label: `${why} → ${a.label}`, start: t, ms: gap })
+      if (gap) segments.push({ kind, bead: a.bead, label: `${why} → ${a.label}`, start: t, ms: gap })
       t = a.start
     }
     const s = Math.max(a.start, t)
@@ -1470,9 +1515,16 @@ const shape = shapeOf([...rows.keys()], id => [...(rows.get(id)?.deps ?? [])].fi
 // (a cut that landed later still bound it), and its release is the planning it followed.
 const simInput = new Map()
 if (rows.size) for (const b of landed) simInput.set(b.id, { id: b.id, I: b.implMs, R: b.reviewMs + b.fixMs, M: b.laneMs, seam: b.seamMs,
-  release: (mappingFor(b.id, b.dispatchedAt)?.at ?? invStartOf(b.final.run)) - windowStart, deps: [] })
+  release: Math.max(invStartOf(b.final.run), b.createdAt ?? -Infinity, b.mappingReadyAt ?? b.dispatchedAt,
+    ...(b.readyAt === null ? [b.dispatchedAt] : [])) - windowStart, deps: [] })
 for (const s of simInput.values()) {
   const b = beads.get(s.id)
+  // In-model dependencies release dynamically in each scenario. Only releases outside the model
+  // stay fixed to their observed times, or the estimate would erase the benefit of faster parents.
+  for (const d of b.deps.filter(d => !simInput.has(d))) {
+    const u = usableBy(d, b.dispatchedAt)
+    if (u) s.release = Math.max(s.release, u.end - windowStart)
+  }
   s.deps = b.deps.filter(d => simInput.has(d)).map(d => ({ id: d, late: !earlyUnblock || b.lateEdges.has(d) }))
 }
 function simulate(input, { cap = Infinity, lanes = 1 } = {}) {
@@ -1540,6 +1592,7 @@ else if (simInput.size) {
   const base = { cap, lanes: 1 }
   const asRun = simulate(simInput, base)
   const s = {
+    estimate: true, window: modelWindow,
     asRunMs: asRun, actualMs: actualGraphMs, fit: actualGraphMs > 0 ? Math.round(100 * asRun / actualGraphMs) / 100 : null,
     unlimitedSlotsMs: simulate(simInput, { ...base, cap: Infinity }),
     unlimitedLanesMs: simulate(simInput, { ...base, lanes: Infinity }),
@@ -1547,7 +1600,7 @@ else if (simInput.size) {
     graphChain: lowerBoundChain(simInput).chain,
     whatIfs: [],
   }
-  const push = (kind, target, ms, note) => { if (Number.isFinite(ms) && asRun - ms > Math.max(60000, asRun * 0.01)) s.whatIfs.push({ kind, target, ms, savingMs: asRun - ms, note }) }
+  const push = (kind, target, ms, note) => { if (Number.isFinite(ms) && asRun - ms > Math.max(60000, asRun * 0.01)) s.whatIfs.push({ kind, target, ms, savingMs: asRun - ms, note, estimate: true }) }
   push('slots', 'unlimited slots', s.unlimitedSlotsMs, 'no slot cap')
   push('lanes', 'unlimited merge lanes', s.unlimitedLanesMs, 'merges in parallel, each still after its stack parents')
   if ([...simInput.values()].some(x => x.deps.some(d => d.late))) push('early', 'every early unblock taken', simulate(withBeads(v => ({ ...v, deps: v.deps.map(d => ({ ...d, late: !earlyUnblock })) })), base), 'no stack conflicts: dependents stack on implemented blockers instead of waiting for their merge')
@@ -1576,9 +1629,12 @@ else if (simInput.size) {
 const lines = []
 let testTotals = null, slowTests = []
 const afterMs = Math.max(0, runEnd - graphEnd)
+const diagnosis = { planningMs: byCat.planning ?? 0, windowMs: actualGraphMs,
+  dominant: (byCat.planning ?? 0) > actualGraphMs / 2 ? 'planning' : 'task graph' }
 const catText = (obj, order = CAT_ORDER) => [...order, ...Object.keys(obj).filter(k => !order.includes(k)).sort()].filter(k => obj[k] >= 1000).map(k => `${k} ${fmtDur(obj[k])}`).join(' · ')
 lines.push(`Profile: ${epic ?? '(epic unknown)'} · ${invocations.length} invocation${invocations.length === 1 ? '' : 's'} · ${fmtTime(windowStart)} → ${fmtTime(runEnd)} · wall ${fmtDur(runEnd - windowStart)} (task graph ${fmtDur(actualGraphMs)}${afterMs ? `, after the last landing ${fmtDur(afterMs)}` : ''}) · agents ${realAgents.length} (timed ${realAgents.filter(a => a.start !== undefined).length}) · beads dispatched ${beads.size}, landed ${landed.length}, planned ${rows.size}`)
 const fan = shape.fanOut[0]
+lines.push('Profile: graph scope — observed invocation/residual graph; historical topology is unknown')
 lines.push(`Profile: shape — ${shape.beads} beads · ${shape.edges} edges · depth ${shape.depth} · width ${shape.width} · beads per level ${shape.levels.join('/') || '-'}${fan ? ` · widest fan-out ${fan.id} (${fan.direct} direct, ${fan.transitive} transitive dependents)` : ''}${cuts.length ? ` · ${cuts.length} edge cut(s) applied mid-run` : ''}`)
 if (sim?.failed) lines.push(`Profile: bound — model failed: the planner rows hold a dependency cycle or an edge nothing satisfies${shape.cycles.length ? ` (${shape.cycles.slice(0, 3).join(', ')})` : ''}`)
 else if (!sim) lines.push(`Profile: bound — no model: ${!rows.size ? (ordinary.length ? 'no dependency graph' : 'no planner rows, so the graph is unknown') : 'nothing landed'}`)
@@ -1586,8 +1642,8 @@ else {
   const above = sim.asRunMs - sim.lowerBoundMs
   const lanesGain = sim.asRunMs - sim.unlimitedLanesMs, slotsGain = sim.asRunMs - sim.unlimitedSlotsMs
   const ch = sim.graphChain
-  sim.verdict = above <= Math.max(60000, 0.1 * sim.asRunMs) ? (ch.length <= 1 ? 'bead-bound' : 'graph-bound') : lanesGain >= slotsGain ? 'merge-lane-bound' : 'slot-bound'
-  const verdict = above <= Math.max(60000, 0.1 * sim.asRunMs)
+  sim.verdict = diagnosis.dominant === 'planning' ? 'planning-bound' : above <= Math.max(60000, 0.1 * sim.asRunMs) ? (ch.length <= 1 ? 'bead-bound' : 'graph-bound') : lanesGain >= slotsGain ? 'merge-lane-bound' : 'slot-bound'
+  const verdict = diagnosis.dominant === 'planning' ? 'planning-bound: planning dominates the measured task window; task parallelism retains this planning time' : above <= Math.max(60000, 0.1 * sim.asRunMs)
     ? (ch.length <= 1 ? `bead-bound: ${ch[0] ?? 'one bead'} alone set the pace — split it or make it faster` : `graph-bound: the ${ch.length}-bead dependency chain set the pace — reshaping it is the lever`)
     : lanesGain >= slotsGain ? `merge-lane-bound: ${fmtDur(lanesGain)} of the ${fmtDur(above)} above the graph's bound is the serial merge lane`
     : `slot-bound: ${fmtDur(slotsGain)} of the ${fmtDur(above)} above the graph's bound is the slot cap`
@@ -1595,6 +1651,7 @@ else {
   lines.push(`Profile: bound — graph lower bound ${fmtDur(sim.lowerBoundMs)}${chainText} (unlimited slots and merge lanes) · model of the run ${fmtDur(sim.asRunMs)} (cap ${Number.isFinite(cap) ? cap : '∞'}, one merge lane) vs actual ${fmtDur(actualGraphMs)} (${sim.fit ? `${Math.round(100 * sim.fit)}%` : '?'}) → ${verdict}`)
 }
 lines.push(`Profile: critical path — ${fmtDur(pathMs)} = ${catText(byCat)}${laneContentionMs ? ` · of which other beads' merge-lane turns ${fmtDur(laneContentionMs)}` : ''}`)
+lines.push(`Profile: diagnosis — planning ${fmtDur(diagnosis.planningMs)} (${pct(diagnosis.planningMs, actualGraphMs)}% of ${modelWindow})${diagnosis.dominant === 'planning' ? ' · planning dominates; bead bottleneck below covers task work only' : ''}`)
 {
   // A bead's consecutive steps collapse into one entry; consecutive lane turns of different beads
   // into one `merge lane ×N` entry.
@@ -1631,7 +1688,7 @@ if (bottleneck) {
 }
 {
   const causes = {}
-  for (const b of landed) if (b.waitCause !== 'none') { const c = causes[b.waitCause] ?? { ms: 0, n: 0 }; c.ms += b.waitMs; c.n++; causes[b.waitCause] = c }
+  for (const b of landed) if (b.waitMs !== null && b.waitCause !== 'none') { const c = causes[b.waitCause] ?? { ms: 0, n: 0 }; c.ms += b.waitMs; c.n++; causes[b.waitCause] = c }
   const order = ['stack-conflict', 'waited-for-merge', 'slot', 'hot-file', 'ready-query', 'planning', 'cancelled', 'retry', 'unexplained']
   const total = sum(Object.values(causes).map(c => c.ms))
   const carried = landed.filter(b => b.carriedMs > 0)
@@ -1681,9 +1738,12 @@ lines.push(`Profile: merge lane — busy ${fmtDur(lane.busyMs)} of ${fmtDur(lane
 if (hotConflicts.length) lines.push(`Profile: conflicts — ${hotConflicts.slice(0, 4).map(c => `${c.file} (stack conflicts ${c.stackConflicts}, seam overlaps ${c.seamOverlaps}, declared by ${c.declaredBy})`).join(' · ')}`)
 if (runLevel) lines.push(...runLevel.lines)
 lines.push(`Profile: runtime — peak ${runtime.peak} agents at once${runtimeSlots ? ` of ${runtimeSlots} runtime slots · full ${pct(runtime.fullMs, runEnd - windowStart)}% of the run` : ''} · slot cap ${Number.isFinite(cap) ? cap : 'unknown'}`)
-for (const w of sim?.whatIfs.slice(0, 6) ?? []) lines.push(`Profile: what-if — ${w.target} → ${fmtDur(w.ms)} (−${fmtDur(w.savingMs)}, ${pct(w.savingMs, sim.asRunMs)}%) — ${w.note}`)
-if (sim && !sim.failed && !sim.whatIfs.length) lines.push(`Profile: what-if — none saves more than 1% of the modelled ${fmtDur(sim.asRunMs)}`)
+lines.push(`Profile: concurrency scope — all-agent concurrency peak ${runtime.peak} · task-slot concurrency peak ${taskSlots.peak}, cap ${Number.isFinite(cap) ? cap : 'unknown'} (ordinary chains retain a slot through merge)`)
+for (const w of sim?.whatIfs.slice(0, 6) ?? []) lines.push(`Profile: what-if estimate — ${w.target} → ${fmtDur(w.ms)} (−${fmtDur(w.savingMs)}, ${pct(w.savingMs, sim.asRunMs)}%) — ${w.note}; ${modelWindow}, planning retained`)
+if (sim && !sim.failed && !sim.whatIfs.length) lines.push(`Profile: what-if estimate — none saves more than 1% of the modelled ${fmtDur(sim.asRunMs)}; ${modelWindow}, planning retained`)
 const unmeasured = []
+const unknownReady = [...beads.values()].filter(b => b.readyAt === null)
+if (unknownReady.length) unmeasured.push(`availability/readiness timing unknown for ${unknownReady.length} bead(s): waits unmeasured; schedule estimates retain dispatch as the release boundary`)
 if (untimed.length) unmeasured.push(`${untimed.length} agent(s) without a transcript (cached on resume, or cleaned up)`)
 const noJournal = invocations.filter(v => !v.journal && v.source === 'workflow')
 if (noJournal.length) unmeasured.push(`${noJournal.length} invocation(s) without journal.jsonl: no planner graph or merge results there`)
@@ -1709,8 +1769,10 @@ if (opt.out) {
     version: 1, epic, cap: Number.isFinite(cap) ? cap : null, earlyUnblock, runtimeSlots,
     invocations: invocations.map(v => ({ runId: v.runId, dir: v.dir, source: v.source, start: T(v.start), end: T(v.end), agents: v.agents, timed: v.timed, journal: v.journal })),
     window: { start: T(windowStart), lastLanding: T(lastLanding?.end), end: T(runEnd), graphMs: actualGraphMs, wallMs: runEnd - windowStart },
+    graphScope: 'observed invocation/residual graph', diagnosis,
     shape, cuts: cuts.map(c => ({ dependent: c.dependent, blocker: c.blocker, kind: c.kind, at: T(c.at) })),
     beads: beadRows.map(b => ({ id: b.id, n: b.n ?? null, deps: b.deps, dependents: [...(dependentsOf.get(b.id) ?? [])], attempts: b.attempts.map(x => x.status), landed: b.landed,
+      createdAt: T(b.createdAt), mappingReadyAt: T(b.mappingReadyAt), dependencyReadyAt: T(b.dependencyReadyAt),
       readyAt: T(b.readyAt), dispatchedAt: T(b.dispatchedAt), landedAt: T(b.landedAt), waitMs: b.waitMs, waitCause: b.waitCause, carriedMs: b.carriedMs,
       implMs: b.implMs, implByTool: b.implByCat, implToolMs: b.implToolMs, reviewMs: b.reviewMs, fixMs: b.fixMs, stackWaitMs: b.stackWaitMs,
       queueWaitMs: b.queueWaitMs, laneMs: b.laneMs, seamMs: b.seamMs, blockerMs: b.blockerMs, reworkMs: b.reworkMs, criticalMs: b.criticalMs,
@@ -1718,15 +1780,15 @@ if (opt.out) {
     criticalPath: { ms: pathMs, byCategory: byCat, laneContentionMs, redo, segments: segments.map(s => ({ kind: s.kind, bead: s.bead, label: s.label, via: s.why ?? null, start: T(s.start), ms: s.ms })) },
     bottleneck: bottleneck ? { bead: bottleneck[0], ms: bottleneck[1].total, share: pathMs ? bottleneck[1].total / pathMs : 0, byCategory: bottleneck[1].byCat,
       implByTool: beads.get(bottleneck[0]).implByCat, calls: beads.get(bottleneck[0]).final.impl.flatMap(a => a.calls ?? []).sort((x, y) => y.ms - x.ms).slice(0, 10) } : null,
-    lane, runtime, concurrency: runLevel?.json ?? null, tests: testTotals, slowTests, conflicts: hotConflicts.slice(0, 20), simulation: sim, unmeasured, context: contextJson(ctxRes.summary), summary: lines,
+    lane, runtime, taskSlots, concurrency: runLevel?.json ?? null, tests: testTotals, slowTests, conflicts: hotConflicts.slice(0, 20), simulation: sim, unmeasured, context: contextJson(ctxRes.summary), summary: lines,
   }
   writeFileSync(`${opt.out}.json`, JSON.stringify(json, null, 2) + '\n')
   const md = [`# Run profile — ${epic ?? 'unknown epic'}`, '', '```', ...lines, '```', '']
-  md.push('## Per bead', '', 'Offsets are from the run\'s first dispatch. `wait` is from the moment every blocker was usable (its implementation under early unblock, else its merge) to the implementer starting, with its cause; `stack` is a stacked task waiting for its parents to merge; `queue` is the wait for the single merge lane; `lane` is its lane turn (merge plus seam work).', '')
+  md.push('## Per bead', '', 'Offsets are from the run\'s first dispatch. `wait` starts at evidenced creation/mapping/dependency availability, bounded by invocation start; unknown readiness means unknown wait. Creation, mapping and dependency timestamps stay distinct in JSON. `stack` waits for parents to merge; `queue` waits for the single merge lane; `lane` is its lane turn (merge plus seam work).', '')
   md.push('| bead | deps | dependents | attempts | wait (cause) | implement | of it: tools | review | fix | stack | queue | lane (seam) | landed | critical |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|')
   for (const b of beadRows) {
     const tools = catText(b.implByCat, TOOL_ORDER)
-    md.push(`| ${b.id} | ${b.deps.length} | ${dependentsOf.get(b.id)?.size ?? 0} | ${b.attempts.map(x => x.status ?? '?').join(', ')} | ${b.waitCause === 'none' ? '-' : `${fmtDur(b.waitMs)} (${b.waitCause})`} | ${fmtDur(b.implMs)} | ${tools || '-'} | ${fmtDur(b.reviewMs)} | ${b.fixMs ? fmtDur(b.fixMs) : '-'} | ${b.stackWaitMs ? fmtDur(b.stackWaitMs) : '-'} | ${b.queueWaitMs ? fmtDur(b.queueWaitMs) : '-'} | ${b.laneMs ? `${fmtDur(b.laneMs)}${b.seamMs ? ` (${fmtDur(b.seamMs)})` : ''}` : '-'} | ${b.landed ? off(b.landedAt) : 'not landed'} | ${b.criticalMs ? fmtDur(b.criticalMs) : ''} |`)
+    md.push(`| ${b.id} | ${b.deps.length} | ${dependentsOf.get(b.id)?.size ?? 0} | ${b.attempts.map(x => x.status ?? '?').join(', ')} | ${b.waitMs === null ? 'unknown' : b.waitCause === 'none' ? '-' : `${fmtDur(b.waitMs)} (${b.waitCause})`} | ${fmtDur(b.implMs)} | ${tools || '-'} | ${fmtDur(b.reviewMs)} | ${b.fixMs ? fmtDur(b.fixMs) : '-'} | ${b.stackWaitMs ? fmtDur(b.stackWaitMs) : '-'} | ${b.queueWaitMs ? fmtDur(b.queueWaitMs) : '-'} | ${b.laneMs ? `${fmtDur(b.laneMs)}${b.seamMs ? ` (${fmtDur(b.seamMs)})` : ''}` : '-'} | ${b.landed ? off(b.landedAt) : 'not landed'} | ${b.criticalMs ? fmtDur(b.criticalMs) : ''} |`)
   }
   md.push('', '## Critical path, step by step', '', '| at | step | kind | via | duration |', '|---|---|---|---|---|')
   for (const s of segments) md.push(`| ${off(s.start)} | ${s.label} | ${s.kind} | ${s.why ?? ''} | ${fmtDur(s.ms)} |`)
@@ -1739,7 +1801,7 @@ if (opt.out) {
     for (const c of hotConflicts.slice(0, 15)) md.push(`| ${c.file} | ${c.stackConflicts} | ${c.seamOverlaps} | ${c.declaredBy} |`)
   }
   if (sim && !sim.failed) {
-    md.push('', '## Schedule model', '', `Landed beads replayed with their measured implement, review+fix and lane times; planner timing kept as it ran; dependents start at a blocker's implementation except over edges where this run's dependent waited for the merge. Model of the run: ${fmtDur(sim.asRunMs)} against ${fmtDur(actualGraphMs)} measured. Estimates, not measurements.`, '')
+    md.push('', '## Schedule model', '', `Landed beads replayed with their measured implement, review+fix and lane times; creation, mapping and invocation bounds retained, with dispatch as the conservative release when readiness is unknown. In-model dependencies release at their modeled implementation/merge times; known releases outside the model stay fixed. Window: ${modelWindow}; planning retained. Model of the run: ${fmtDur(sim.asRunMs)} against ${fmtDur(actualGraphMs)} measured. Estimates, not measurements.`, '')
     md.push('| scenario | makespan | saving |', '|---|---|---|', `| as run (cap ${Number.isFinite(cap) ? cap : '∞'}, one merge lane) | ${fmtDur(sim.asRunMs)} | - |`, `| unlimited slots | ${fmtDur(sim.unlimitedSlotsMs)} | ${fmtDur(sim.asRunMs - sim.unlimitedSlotsMs)} |`, `| unlimited merge lanes | ${fmtDur(sim.unlimitedLanesMs)} | ${fmtDur(sim.asRunMs - sim.unlimitedLanesMs)} |`, `| graph lower bound (both) | ${fmtDur(sim.lowerBoundMs)} | ${fmtDur(sim.asRunMs - sim.lowerBoundMs)} |`)
     for (const w of sim.whatIfs.filter(w => w.kind !== 'slots' && w.kind !== 'lanes')) md.push(`| ${w.target} | ${fmtDur(w.ms)} | ${fmtDur(w.savingMs)} |`)
   }
