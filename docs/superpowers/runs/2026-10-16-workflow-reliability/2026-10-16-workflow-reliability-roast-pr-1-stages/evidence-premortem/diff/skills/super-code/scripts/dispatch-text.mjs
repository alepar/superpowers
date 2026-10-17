diff --git a/skills/super-code/scripts/dispatch-text.mjs b/skills/super-code/scripts/dispatch-text.mjs
index 7683faed..bfdc9e63 100644
--- a/skills/super-code/scripts/dispatch-text.mjs
+++ b/skills/super-code/scripts/dispatch-text.mjs
@@ -26,18 +26,24 @@ Run, epic, branch, integration worktree and mergeCheck come from the ledger's la
 
 kinds and options:
   implement         --id ID --n N [--parents P1,P2] [--reentry] [--recut]
-  review            --id ID --n N --base SHA
+  review            --id ID --n N --base SHA --head SHA [--result-file F]
+                    (verification-only: the implementer JSON RESULT supplies completionKind,
+                    sourceTree, evidence and requiredLiveChecks)
+  verification-close --id ID --result-file F (the accepted verification basis)
   fix               --id ID --n N --base SHA --kind review|seam|check --finding-file F
   seam-review       --id ID --n N --base SHA --merge-base SHA --head SHA --overlap F1,F2
                     (an overlap entry "consumes <id>" names a consumed blocker, not a file)
-  check-fix-review  --id ID --n N --pre-fix-head SHA --errors-file F
+  check-fix-review  --id ID --n N --pre-fix-head SHA --head SHA --errors-file F
   merge             --id ID --n N --base SHA [--stacked] [--seam-cleared] [--review-bead ID]
                     [--resolved-bead ID] [--consumes ID1,ID2]
   plan              --ids ID1,ID2 [--mode ready|rest|refill] [--reentry-ids ID1,ID2]
   triage            --id ID --blocker BEAD
+  check-evidence    --results-file F
+                    (JSON array of {dispatch, result} replies; outputs the shared Workflow
+                    classification, retaining source/check provenance and evidence gaps)
   assemble          --consumer final-review|roast-code|history|assess --instance I
-                    [--threshold N] [--base SHA] [--head REF] [--spec P1,P2]
-  final-review      --mode single|cluster|seam|stub [--dir D] [--capped] [--sweep F|deferred]
+                    [--threshold N] [--base SHA] [--head SHA] [--spec P1,P2]
+  final-review      --mode single|cluster|seam|stub --base SHA --head SHA [--dir D] [--capped] [--sweep F|deferred]
                     [--metrics F] [--cluster N --name NAME] [--reviewed N1,N2|none] [--unreviewed F]
                     (single: --sweep/--metrics default to the ledger's last Sweep: line and last four
                     Metrics: lines; cluster needs --dir --cluster --name; seam needs --dir --reviewed,
@@ -47,7 +53,8 @@ kinds and options:
 common options:
   --plan <file>        the plan file (default: <ledger dir>/<epic>-plan.md)
   --test-paths P1,P2   config.testPaths, when the run set one
-  --run-tag T          names the assembled-input directories (default: the Launch: line's runTag, else the epic)
+  --run-tag T          groups the enclosing run (default: the Launch: line's runTag, else the epic)
+  --invocation-id I     must match the persisted Launch invocationId for review output
   --epic, --branch, --worktree, --merge-check   override the Launch: line`
 
 const FLAGS = new Set(['stdout', 'reentry', 'recut', 'stacked', 'seam-cleared', 'capped', 'help'])
@@ -75,7 +82,7 @@ function launchFrom(ledgerText) {
   if (line.startsWith('args ')) {
     try {
       const a = JSON.parse(line.slice(5))
-      return { epic: a.epicId, branch: a.integrationBranch, worktree: a.integrationWorktree, runTag: a.runTag, sweep: a.deferSweep ? 'deferred' : undefined, mergeCheck: a.config?.mergeCheck, testPaths: a.config?.testPaths }
+      return { epic: a.epicId, branch: a.integrationBranch, worktree: a.integrationWorktree, runTag: a.runTag, invocationId: a.invocationId, sweep: a.deferSweep ? 'deferred' : undefined, mergeCheck: a.config?.mergeCheck, testPaths: a.config?.testPaths, reviewBase: a.reviewBase, reviewHead: a.reviewHead }
     } catch { return {} }
   }
   const f = {}
@@ -83,7 +90,7 @@ function launchFrom(ledgerText) {
     const m = part.match(/^(\S+)\s+(.*)$/)
     if (m) f[m[1]] = m[2].trim()
   }
-  return { epic: f.epic, branch: f.branch, worktree: f.integrationWorktree, runTag: f.runTag, mergeCheck: f.mergeCheck, sweep: f.sweep }
+  return { epic: f.epic, branch: f.branch, worktree: f.integrationWorktree, runTag: f.runTag, invocationId: f.invocationId, mergeCheck: f.mergeCheck, sweep: f.sweep, reviewBase: f.reviewBase, reviewHead: f.reviewHead }
 }
 
 // The ledger's last `Sweep: ` line (text after the prefix) and the last four `Metrics: ` lines (the
@@ -96,7 +103,7 @@ function loadBuilders(cfg) {
   try { src = readFileSync(join(codeSkill, 'coordinator.js'), 'utf8') } catch (e) { console.error(`dispatch-text: cannot read coordinator.js: ${e.message}`); process.exit(3) }
   const cut = src.search(/^while \(true\) \{$/m)
   if (cut < 0) { console.error('dispatch-text: coordinator.js has no top-level `while (true) {` round loop to cut at'); process.exit(3) }
-  const ret = `return { SWEEP_DEFERRED, planPrompt, implementPrompt, taskReviewPrompt, fixPrompt, seamReviewPrompt, checkFixReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt, finalSeamReviewPrompt, finalReviewStubPrompt, mergePrompt, triagePrompt, assemblePrompt, reviewBeadOf, mergeCheckCommand }\n`
+  const ret = `return { SWEEP_DEFERRED, planPrompt, implementPrompt, taskReviewPrompt, fixPrompt, seamReviewPrompt, checkFixReviewPrompt, finalReviewPrompt, finalClusterReviewPrompt, finalSeamReviewPrompt, finalReviewStubPrompt, mergePrompt, triagePrompt, assemblePrompt, reviewBeadOf, mergeCheckCommand, recordCheckEvidence, classifyCheckEvidence, verificationClosePrompt, verificationProblem }\n`
   const body = (src.slice(0, cut) + ret + src.slice(cut)).replace(/^export const meta/m, 'const meta')
   const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor
   const fn = new AsyncFunction('args', 'agent', 'log', 'phase', 'pipeline', 'parallel', 'budget', 'workflow', body)
@@ -117,14 +124,22 @@ const mergeCheck = o['merge-check'] ?? L.mergeCheck
 const testPaths = o['test-paths'] ? list(o['test-paths']) : L.testPaths
 const ws = dirname(resolve(o.ledger))
 const runTag = o['run-tag'] || L.runTag || epic
+const invocationId = L.invocationId
+const reviewOutput = kind === 'final-review' || (kind === 'assemble' && o.consumer === 'final-review')
+if (reviewOutput && (typeof invocationId !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(invocationId))) fail('review output needs a persisted filesystem-safe Launch invocationId')
+if (o['invocation-id'] !== undefined && o['invocation-id'] !== invocationId) fail('--invocation-id must match the persisted Launch invocationId')
 const planPath = o.plan || join(ws, `${epic}-plan.md`)
 
 const B = await loadBuilders({
-  epicId: epic, integrationBranch: branch, integrationWorktree: worktree, skillsRoot, runTag, dryRun: false,
+  epicId: epic, integrationBranch: branch, integrationWorktree: worktree, skillsRoot, runTag, ...(reviewOutput ? { invocationId } : {}), dryRun: false,
   config: { mergeCheck: mergeCheck && !/^none\b/.test(mergeCheck) ? mergeCheck : 'none', ...(testPaths ? { testPaths } : {}) },
 })
 
 const need = (...ks) => { for (const k of ks) if (!o[k]) fail(`${kind} needs --${k}`) }
+const commitId = value => {
+  if (!/^[0-9a-f]{7,64}$/.test(String(value))) fail(`captured commit id required, got ${value}`)
+  return value
+}
 const art = n => ({
   brief: `${ws}/task-${n}-brief.md`,
   report: `${ws}/task-${n}-report.md`,
@@ -132,22 +147,49 @@ const art = n => ({
   diff: tag => `${ws}/task-${n}-review-${tag}.diff`,
 })
 const taskWorktree = id => `${worktree}/.worktrees/${String(branch).replace(/\//g, '-')}--task-${id}`
-const task = () => ({ id: o.id, n: Number(o.n), branch: taskWorktree(o.id), base: o.base })
+const task = () => ({ id: o.id, n: Number(o.n), branch: taskWorktree(o.id), base: o.base, head: o.head })
 const readLines = k => readArg(k).split('\n').map(l => l.trim()).filter(Boolean)
 const readArg = k => { try { return readFileSync(o[k], 'utf8').trim() } catch (e) { fail(`cannot read --${k} ${o[k]}: ${e.message}`) } }
 
 let text, label
 switch (kind) {
+  case 'check-evidence': {
+    need('results-file')
+    let replies
+    try { replies = JSON.parse(readArg('results-file')) } catch (e) { fail(`invalid --results-file JSON: ${e.message}`) }
+    if (!Array.isArray(replies) || !replies.every(r => r && typeof r.dispatch === 'string' && /^[^:]+:[^:]+/.test(r.dispatch) && r.result && typeof r.result === 'object' && !Array.isArray(r.result))) fail('--results-file must be an array of {dispatch, result} replies')
+    for (const r of replies) B.recordCheckEvidence(r.result, r.dispatch)
+    text = JSON.stringify(B.classifyCheckEvidence(), null, 2)
+    label = 'check-evidence'
+    break
+  }
   case 'implement':
     need('id', 'n')
     text = B.implementPrompt(planPath, o.id, Number(o.n), branch, art(o.n), { parents: list(o.parents), reentry: !!o.reentry, recut: !!o.recut })
     label = `impl-${o.id}`
     break
-  case 'review':
-    need('id', 'n', 'base')
-    text = B.taskReviewPrompt(task(), planPath, art(o.n))
+  case 'verification-close': {
+    need('id', 'result-file')
+    let basis
+    try { basis = JSON.parse(readArg('result-file')) } catch (e) { fail('invalid --result-file JSON: ' + e.message) }
+    const problem = B.verificationProblem(basis, basis)
+    if (problem || basis.reviewStatus !== 'CLEAN' || !basis.reportPath?.trim() || !basis.reviewPath?.trim()) fail(problem || 'independent verification report and review paths required')
+    text = B.verificationClosePrompt(o.id, basis)
+    label = 'close-only-' + o.id
+    break
+  }
+  case 'review': {
+    need('id', 'n', 'base', 'head')
+    commitId(o.base); commitId(o.head)
+    let outcome = {}
+    if (o['result-file']) {
+      try { outcome = JSON.parse(readArg('result-file')) } catch (e) { fail('invalid --result-file JSON: ' + e.message) }
+      if (!outcome || typeof outcome !== 'object' || Array.isArray(outcome)) fail('--result-file must hold a RESULT object')
+    }
+    text = B.taskReviewPrompt({ ...outcome, ...task() }, planPath, art(o.n))
     label = `review-${o.id}`
     break
+  }
   case 'fix': {
     need('id', 'n', 'base', 'kind', 'finding-file')
     if (!['review', 'seam', 'check'].includes(o.kind)) fail('--kind is review, seam or check')
@@ -157,11 +199,13 @@ switch (kind) {
   }
   case 'seam-review':
     need('id', 'n', 'base', 'merge-base', 'head', 'overlap')
+    commitId(o.base); commitId(o['merge-base']); commitId(o.head)
     text = B.seamReviewPrompt(task(), { seamOverlap: list(o.overlap), mergeBase: o['merge-base'], head: o.head }, branch, art(o.n))
     label = `seam-review-${o.id}`
     break
   case 'check-fix-review':
-    need('id', 'n', 'pre-fix-head', 'errors-file')
+    need('id', 'n', 'pre-fix-head', 'head', 'errors-file')
+    commitId(o['pre-fix-head']); commitId(o.head)
     text = B.checkFixReviewPrompt(task(), o['pre-fix-head'], readArg('errors-file'), art(o.n))
     label = `check-fix-review-${o.id}`
     break
@@ -189,19 +233,21 @@ switch (kind) {
   case 'assemble': {
     need('consumer', 'instance')
     if (!['final-review', 'roast-code', 'history', 'assess'].includes(o.consumer)) fail('--consumer is final-review, roast-code, history or assess')
-    const opts = { specPaths: list(o.spec) }
+    const opts = { specPaths: list(o.spec), base: o.base || L.reviewBase, head: o.head || L.reviewHead }
     if (o.threshold !== undefined) { if (!/^\d+$/.test(o.threshold)) fail('--threshold is a non-negative integer'); opts.threshold = Number(o.threshold) }
-    if (o.base) opts.base = o.base
-    if (o.head) opts.head = o.head
+    if (['final-review', 'roast-code'].includes(o.consumer) && (!opts.base || !opts.head)) fail('assemble needs captured --base and --head (or Launch reviewBase/reviewHead)')
+    if (['final-review', 'roast-code'].includes(o.consumer)) { commitId(opts.base); commitId(opts.head) }
     text = B.assemblePrompt(o.consumer, o.instance, opts)
-    label = `assemble-${o.consumer}-${o.instance}`
+    label = `assemble-${o.consumer}-${o.consumer === 'final-review' ? invocationId + '-' : ''}${o.instance}`
     break
   }
   case 'final-review': {
     need('mode')
     if (!['single', 'cluster', 'seam', 'stub'].includes(o.mode)) fail('--mode is single, cluster, seam or stub')
-    const reviewPath = `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${runTag}.md`
-    const clusterPath = n => `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${runTag}-cluster-${n}.md`
+    const source = { base: o.base || L.reviewBase, head: o.head || L.reviewHead }
+    if (o.mode !== 'stub' && source.base && source.head) { commitId(source.base); commitId(source.head) }
+    const reviewPath = `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${invocationId}.md`
+    const clusterPath = n => `${worktree}/.superpowers/sdd/${epic}-plan/final-review-${invocationId}.cluster-${n}.md`
     const posInt = k => { if (!/^[1-9]\d*$/.test(String(o[k]))) fail(`--${k} is a positive integer`); return Number(o[k]) }
     // --reviewed N1,N2|none: the cluster ordinals whose review returned a verdict, in the order given.
     const reviewedPaths = () => {
@@ -212,25 +258,28 @@ switch (kind) {
       return ns.map(n => clusterPath(Number(n)))
     }
     if (o.mode === 'single') {
+      if (!source.base || !source.head) fail('final-review needs captured --base and --head (or Launch reviewBase/reviewHead)')
       const sweep = o.sweep === 'deferred' ? B.SWEEP_DEFERRED : o.sweep ? readArg('sweep')
         : lastSweep(ledgerText) ?? (L.sweep === 'deferred' ? B.SWEEP_DEFERRED : null)
       const metrics = o.metrics ? readLines('metrics') : lastMetrics(ledgerText)
-      text = B.finalReviewPrompt(epic, branch, worktree, '.superpowers/sdd/' + epic + '-plan/progress.md', planPath, sweep, metrics, { dir: o.dir || null, capped: !!o.capped, reviewPath })
-      label = 'final-review-single'
+      text = B.finalReviewPrompt(epic, branch, worktree, '.superpowers/sdd/' + epic + '-plan/progress.md', planPath, sweep, metrics, { dir: o.dir || null, capped: !!o.capped, reviewPath, base: source.base, head: source.head })
+      label = `final-review-${invocationId}-single`
     } else if (o.mode === 'cluster') {
       need('dir', 'cluster', 'name')
+      if (!source.base || !source.head) fail('final-review needs captured --base and --head (or Launch reviewBase/reviewHead)')
       const n = posInt('cluster')
-      text = B.finalClusterReviewPrompt(n, o.name, o.dir, clusterPath(n), epic, branch, worktree)
-      label = `final-review-cluster-${n}`
+      text = B.finalClusterReviewPrompt(n, o.name, o.dir, clusterPath(n), epic, branch, worktree, source)
+      label = `final-review-${invocationId}-cluster-${n}`
     } else if (o.mode === 'seam') {
       need('dir')
       const paths = reviewedPaths()
-      text = B.finalSeamReviewPrompt(o.dir, paths, reviewPath, epic, branch, worktree, o.unreviewed ? readLines('unreviewed') : [])
-      label = 'final-review-seam'
+      if (!source.base || !source.head) fail('final-review needs captured --base and --head (or Launch reviewBase/reviewHead)')
+      text = B.finalSeamReviewPrompt(o.dir, paths, reviewPath, epic, branch, worktree, o.unreviewed ? readLines('unreviewed') : [], source)
+      label = `final-review-${invocationId}-seam`
     } else {
       need('unreviewed')
       text = B.finalReviewStubPrompt(reviewedPaths(), readLines('unreviewed'), reviewPath)
-      label = 'final-review-stub'
+      label = `final-review-${invocationId}-stub`
     }
     break
   }
@@ -239,7 +288,7 @@ switch (kind) {
 }
 
 if (o.stdout) { process.stdout.write(text + '\n'); process.exit(0) }
-const out = o.out || join(ws, 'dispatch', `${label}.md`)
+const out = o.out || join(ws, 'dispatch', `${label}.${kind === 'check-evidence' ? 'json' : 'md'}`)
 mkdirSync(dirname(out), { recursive: true })
 writeFileSync(out, text + '\n')
 console.log(out)
