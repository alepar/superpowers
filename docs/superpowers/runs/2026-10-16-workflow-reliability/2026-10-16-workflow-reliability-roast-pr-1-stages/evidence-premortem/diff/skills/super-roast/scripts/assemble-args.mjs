diff --git a/skills/super-roast/scripts/assemble-args.mjs b/skills/super-roast/scripts/assemble-args.mjs
index 9a1e9b1c..48806c8c 100644
--- a/skills/super-roast/scripts/assemble-args.mjs
+++ b/skills/super-roast/scripts/assemble-args.mjs
@@ -19,7 +19,8 @@ const USAGE = `usage: assemble-args --mode pr|design --inputs <header inputs> [o
   --spec <path>                   design mode: the spec under review (required)
   --context <text|@file>          design mode: caller context the spec must satisfy
   --repo <dir> --base <ref> --head <ref>
-                                  PR mode: names the diff command and computes triage's stat
+                                  PR mode: captures verified commits for diff/source commands
+                                  and computes triage's stat
   --diff-stat <text|@file>        PR mode: triage input instead of computing it with git
   --artifact <text>               PR mode: how scouts/judges name the change (default: --inputs)
   --independence <text>           independence label (default: derived from config.models.judge,
@@ -133,14 +134,26 @@ function stanceBlocks(secs, file) {
 }
 
 // ---- inputs for the artifact under review ----
-const diffCmd = opt.repo && opt.base && opt.head ? `git -C ${resolve(opt.repo)} diff ${opt.base}...${opt.head}` : null
+const shell = s => "'" + String(s).replaceAll("'", "'\\''") + "'"
+let source = null
+if (mode === 'pr' && (opt.repo || opt.base || opt.head)) {
+  if (!(opt.repo && opt.base && opt.head)) die(2, '--repo, --base and --head go together')
+  try {
+    const commit = ref => execFileSync('git', ['-C', opt.repo, 'rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
+    source = { repo: resolve(opt.repo), base: commit(opt.base), head: commit(opt.head) }
+  } catch (e) { die(2, `cannot resolve PR source commits: ${e.message.split('\n')[0]}`) }
+}
+const diffCmd = source ? `git -C ${shell(source.repo)} diff ${source.base}...${source.head}` : null
+const sourceInput = source
+  ? `Captured source: base ${source.base}, head ${source.head}. Read source with \`git -C ${shell(source.repo)} show ${source.head}:<path>\`; all diffs use \`${diffCmd}\`.`
+  : 'The caller supplied patch data without a repository source pair. Review that data; obtain captured base/head commit identities before opening repository source or running a reproduction.'
 const artifact = opt.artifact ?? opt.inputs
 function triageInput() {
   if (mode === 'design') return `Spec file: ${opt.spec} — read it.`
   if (opt.diffStat) return textArg(opt.diffStat).trim()
   if (!diffCmd) die(2, 'PR mode needs --diff-stat, or --repo/--base/--head to compute it')
   try {
-    const range = `${opt.base}...${opt.head}`
+    const range = `${source.base}...${source.head}`
     const names = execFileSync('git', ['-C', opt.repo, 'diff', '--name-status', range], { encoding: 'utf8' }).trim()
     const stat = execFileSync('git', ['-C', opt.repo, 'diff', '--shortstat', range], { encoding: 'utf8' }).trim()
     return `Diff ${range}:\n${names}\n${stat}`
@@ -186,7 +199,7 @@ if (mode === 'pr') {
     let p = replaceLine(base, '[LANE]', fence(sec, 0, file), `${file} lane ${name}`)
     p = fillCategory(p, name, 'lane', `${file} lane ${name}`)
     assertClean(p, `scout ${name}`)
-    prompts.scouts[name] = p
+    prompts.scouts[name] = p + '\n\n' + sourceInput
   }
   for (const n of config.coreLanes) if (!prompts.scouts[n]) drift(`${file}: core lane '${n}' has no Lane block`)
 } else {
@@ -243,7 +256,7 @@ if (!prompts.dedupe.includes('{{FINDINGS_JSON}}')) drift('dedupe-prompt.md: {{FI
   prompts.seats = {}
   for (const n of ['reproduce', 'refute', 'ground']) {
     let p = replaceLine(core, '[SEAT PROCEDURE]', seatBlock(n), `${file} seat ${n}`)
-    if (prAdj) p += `\n\n${prAdj}`
+    if (prAdj) p += `\n\n${prAdj}\n\n${sourceInput}`
     assertClean(p, `seat ${n}`)
     if (!p.includes('{{FINDING_JSON}}')) drift(`${file}: {{FINDING_JSON}} missing`)
     prompts.seats[n] = p
@@ -276,6 +289,7 @@ const args = {
   mode, profile: opt.profile ?? 'not supplied by the caller — infer it from the repository and state it',
   inputs: opt.inputs, iteration: numbered ? Number(iteration) : iteration,
   priorReport, punchListed, independence, prompts, config,
+  ...(source ? { source } : {}),
 }
 const json = JSON.stringify(args, null, 2)
 
