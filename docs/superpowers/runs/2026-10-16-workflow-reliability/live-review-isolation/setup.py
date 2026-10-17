import pathlib, subprocess, json, hashlib, time, os
R=pathlib.Path('/private/tmp/ufz-live-isolation'); P=pathlib.Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers/.worktrees/super-auto-workflow-reliability--task-super-plan-ufz.6'); C=R/'caller'
for x in ['evidence','prompts','seat-a','seat-b','control','bin','source-excerpts']: (R/x).mkdir(exist_ok=True)
C.mkdir(); (C/'lib').mkdir()
def run(args,cwd=C,check=True):
 p=subprocess.run(args,cwd=cwd,text=True,capture_output=True); e={'time':time.time(),'cwd':str(cwd),'argv':args,'exit':p.returncode,'stdout':p.stdout,'stderr':p.stderr}; (R/'evidence/setup-commands.jsonl').open('a').write(json.dumps(e)+'\n');
 if check and p.returncode: raise Exception(e)
 return p.stdout.strip()
run(['git','init','-b','integration']);run(['git','config','user.email','fixture@example.invalid']);run(['git','config','user.name','Owned isolation fixture'])
(C/'.gitignore').write_text('build/\n.superpowers/\n')
(C/'caller-sentinel.txt').write_text('caller sentinel: immutable bytes\n')
(C/'caller-session.txt').write_text('caller owns this pending session text\n')
(C/'integration.txt').write_text('integration 0\n')
(C/'lib/generated.mjs').write_text('export const generated = false;\n')
(C/'lib/format.mjs').write_text("export function formatAmount(cents) { return '$' + (cents / 100).toFixed(2); }\n")
(C/'reproduce.mjs').write_text("import fs from 'node:fs';\nimport path from 'node:path';\nimport { formatAmount } from './lib/format.mjs';\nfs.writeFileSync('lib/generated.mjs', 'export const generated = true;\\n');\nconst out = path.resolve(process.env.OUT_DIR || 'build'); fs.mkdirSync(out,{recursive:true});\nconst values = [-150,-50,0,50,150].map(cents => ({cents,actual:formatAmount(cents)}));\nfs.writeFileSync(path.join(out,'amounts.json'), JSON.stringify(values,null,2)+'\\n');\nfs.writeFileSync(path.join(process.env.TMPDIR || out,'repro-temp.txt'),'owned reproduction temp\\n');\nconsole.log(JSON.stringify({cwd:process.cwd(),out,values}));\n")
(C/'README.md').write_text('Format integer cents as dollars with two decimal places; retain negative signs including amounts between -99 and -1 cents. reproduce.mjs generates source and build output in its working tree. OUT_DIR chooses build output; TMPDIR chooses temporary output.\n')
run(['git','add','.']);run(['git','commit','-m','fixture base']);base=run(['git','rev-parse','HEAD'])
(C/'lib/format.mjs').write_text("export function formatAmount(cents) { return '$' + Math.trunc(cents / 100) + '.' + String(Math.abs(cents % 100)).padStart(2, '0'); }\n")
run(['git','add','lib/format.mjs']);run(['git','commit','-m','format cents without floating point']);head=run(['git','rev-parse','HEAD'])
(C/'build').mkdir();(C/'build/caller-output.txt').write_text('caller build output immutable\n')
(R/'seat-b/existing-output.txt').write_text('seat B prior output: preserve exactly\n')
ws=C/'.superpowers/sdd/ufz-live-review-plan';ws.mkdir(parents=True)
plan=ws/'ufz-live-review-plan.md';plan.write_text('# Fixture review plan\nReview integer-cent formatting against README.md.\n')
ledger=ws/'progress.md';ledger.write_text('Launch: args '+json.dumps({'epicId':'ufz-live-review','integrationBranch':'integration','integrationWorktree':str(C),'invocationId':'seat-b-live','runTag':'live-isolation','reviewBase':base,'reviewHead':head,'config':{'mergeCheck':'none'}})+'\nassembler: unavailable — controlled fixture exit 3, direct-input review required\n')
(R/'bin/bd').write_text('#!/bin/sh\nif [ "$1" = show ] && [ "$2" = ufz-live-review ] && [ "$3" = --json ]; then\n  cat '+str(R/'spec.json')+'\nelse\n  echo "read-only fixture bd: unsupported operation" >&2; exit 2\nfi\n');(R/'bin/bd').chmod(0o755)
(R/'spec.json').write_text(json.dumps({'id':'ufz-live-review','description':'Format integer cents as dollars with exactly two decimal places, preserving sign for all negative values. Requirements in README.md.','status':'open'})+'\n')
(R/'unavailable-assembler.py').write_text("import sys\nprint('assembler intentionally unavailable in controlled fixture',file=sys.stderr)\nsys.exit(3)\n")
run(['python3',str(R/'unavailable-assembler.py')],cwd=R,check=False)
run(['node',str(P/'skills/super-roast/scripts/assemble-args.mjs'),'--mode','pr','--inputs',f'integration@{head} vs {base}','--repo',str(C),'--base',base,'--head',head,'--out',str(R/'evidence/pr-args.json')])
args=json.loads((R/'evidence/pr-args.json').read_text());(R/'prompts/seat-a-operative.md').write_text(args['prompts']['scouts']['correctness'])
b=run(['node',str(P/'skills/super-code/scripts/dispatch-text.mjs'),'--ledger',str(ledger),'--stdout','final-review','--mode','single','--base',base,'--head',head,'--plan',str(plan)])
(R/'prompts/seat-b-operative.md').write_text(b+'\n')
files=['skills/super-roast/scout-prompts-pr.md','skills/super-roast/scripts/assemble-args.mjs','skills/super-code/coordinator.js','skills/super-code/scripts/dispatch-text.mjs','skills/super-code/task-reviewer-prompt.md','skills/subagent-driven-development/scripts/review-package']
manifest={}
for f in files:
 data=(P/f).read_bytes(); name=f.replace('/','__');(R/'source-excerpts'/name).write_bytes(data);manifest[f]={'sha256':hashlib.sha256(data).hexdigest(),'copy':'source-excerpts/'+name}
# Save exact relevant excerpt independently of full-source copies.
lines=(P/'skills/super-code/coordinator.js').read_text().splitlines(True); data=''.join(lines[2851:2880]).encode();(R/'source-excerpts/review-source-and-final.txt').write_bytes(data);manifest['coordinator.js:2852-2880']={'sha256':hashlib.sha256(data).hexdigest(),'copy':'source-excerpts/review-source-and-final.txt'}
(R/'source-manifest.json').write_text(json.dumps({'product':str(P),'commit':run(['git','rev-parse','HEAD'],cwd=P),'files':manifest},indent=2)+'\n')
identity={'base':base,'head':head,'headTree':run(['git','rev-parse',head+'^{tree}']),'caller':str(C),'started':time.time()}
(R/'identities.json').write_text(json.dumps(identity,indent=2)+'\n')
for seat in ['seat-a','seat-b']:
 extra='Your review needs a live reproduction of the changed amount formatter, using reproduce.mjs (which writes source and build output). Run it and inspect output; do not edit product logic to fix findings.' if seat=='seat-a' else 'Independently inspect the captured source and spec and produce the final-review artifact from your operative prompt. The assembler is unavailable (controlled exit 3 recorded); use the operative direct-input fallback. Your scratch directory already contains existing-output.txt from an earlier operation.'
 (R/'prompts'/f'{seat}-task.md').write_text(f'''You are one independent LIVE review seat. Read and follow {R}/prompts/{seat}-operative.md. Model for this authorized eval is gpt-6.1-sol medium (overrides any template model label). No Herdr writes or product-repository mutations. No additional agents.\n\nContext: owned disposable caller repository {C}; captured base {base}; captured head {head}. Your scratch area is {R}/{seat}. The other concurrently reviewing seat has its own scratch and artifacts. {extra}\n\nInstrumentation: run ALL substantive shell/review commands through `python3 {R}/record-command.py {seat} --cwd <working-directory> -- <command> <args...>`; it captures raw commands, stdout/stderr/exits and Git trace. For a shell command use `-- /bin/bash -c '<script>'`. This is observation instrumentation, not a review policy. Save detailed review/evidence to {R}/{seat}/response.md as well as any artifact your operative prompt declares. Save chronological decisions and any unsupported observations there. Leave review-owned worktrees for the evaluator to inventory and clean after evidence capture.\n\nTiming protocol (checkpoint commands also go through recorder): first inspect initial caller commit/status and prepare your review resources, then create {R}/control/{seat}.ready. Wait for {R}/control/stage1 using polling up to 30 seconds per tool call. After stage1 exists, do substantive initial captured diff/source inspection (and Seat A reproduction); write a brief phase-1 evidence record then create {R}/control/{seat}.phase1. Wait for {R}/control/stage2 using short polling. After stage2 exists, recheck captured source/diff plus observed caller commit/status, finish the independent review and report. No need to wait more than 10 minutes total.\n\nThe fixture `bd` command is at {R}/bin/bd; recorder puts that bin directory first on PATH. Acceptance/spec input is in {R}/spec.json and caller README.md. Use only available evidence and report limitations.\n''')
print(json.dumps(identity,indent=2))
