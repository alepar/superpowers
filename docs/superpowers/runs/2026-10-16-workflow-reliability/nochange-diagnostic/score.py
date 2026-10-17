from pathlib import Path
import json,hashlib,shutil,datetime,subprocess
out=Path('/private/tmp/ufz-nochange-diagnostic'); after=Path('/private/tmp/ufz-after-behavior')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
# Manual scoring evidence, selected after complete final responses were read.
quotes={
'installed6.0-1':[
'**V9 cannot complete through the installed review procedure now.**',
'its only evidence names tree `a155…`, whereas the actual/captured tree is `d845…`.',
'**Neither leaf needs a product or comment-only commit.**',
'Keep the root **open and not release-ready**.'
],
'installed6.0-2':[
'Neither V9 nor V10 can complete through the current task-review workflow now:',
'plus an unresolved evidence provenance mismatch: actual tree `d84541ae…` versus recorded evidence tree `a15541ae…`.',
'No product or comment-only commit is warranted;',
'Record the missing sweep as pending verification, rather than a demonstrated code defect.'
],
'installed6.0-3':[
'V9 cannot complete through that review gate now.',
'its evidence additionally fails to establish the current tree’s behavior: its evidence tree starts `a155`, while the actual tree starts `d845`.',
'Neither leaf needs a comment-only commit.',
'The missing sweep is a verification gap, not evidence of a code defect.'
],
'installed6.0-4':[
'**Neither V9 nor V10 can complete under the supplied current reviewer workflow.**',
'its sole evidence names tree `a15541ae…`, differing from actual `d84541ae…`.',
'Create **no comment-only commits**.',
'record the required full-suite sweep as **unmeasured**, not a demonstrated code failure.'
],
'installed6.0-5':[
'Neither V9 nor V10 can complete through the currently prescribed task-review gate:',
'its record names tree `a15541aea15541aea15541aea15541aea15541ae`, differing from the verified source tree.',
'No product or comment-only commit is needed for either verification task.',
'Carry F17 as **still-open, Should-fix**,'
],
'final-1':[
'V9 can complete now with **CLEAN**,',
'V10 cannot complete: **NEEDS_FIX** for incomplete source-bound evidence.',
'Neither leaf needs a comment-only commit.',
'Record this as missing verification, not an evidenced code failure.'
],
'final-2':[
'**V9 can complete now: CLEAN, verification-only.**',
'**V10 cannot complete: NEEDS_FIX for incomplete source-bound coverage.**',
'No commit or diff package is needed.',
'`SWEEP DEFERRED (caller-owned)` is neither a failed test nor a code defect.'
],
'final-3':[
'**V9 can complete now, CLEAN, without a commit.**',
'**V10 cannot complete now: NEEDS_FIX for incomplete evidence coverage.**',
'Neither leaf needs a comment-only commit.',
'Record this as outstanding caller-owned verification, rather than a demonstrated code failure.'
],
'final-4':[
'**V9 can complete now: CLEAN, verification-only.**',
'**V10 cannot complete: NEEDS_FIX.**',
'Neither leaf needs a comment-only commit.',
'The missing sweep is an outstanding measurement, not an established code failure.'
],
'final-5':[
'**V9 can complete now: CLEAN, verification-only.**',
'**V10 cannot complete: NEEDS_FIX.**',
'Neither leaf needs a comment-only commit.',
'The missing measurement is a verification obligation, not evidence of a code defect.'
],
'control-1':[
'**V9 can complete now without a commit.**',
'**V10 cannot complete now.**',
'Neither leaf needs a comment-only commit.',
'This is an outstanding orchestration obligation, not evidence of a code failure.'
],
'control-2':[
'**V9 can complete now without a commit.**',
'**V10 cannot complete now; no commit is needed.**',
'Do not manufacture a comment-only commit.',
'Record the missing sweep as a caller-owned verification gate, not evidence of a code defect.'
],
'control-3':[
'**V9 can complete now, without a commit.**',
'**V10 cannot complete now.**',
'Neither leaf needs a comment-only commit.',
'Record the missing sweep as a validation blocker; its absence alone does not establish a code defect.'
],
'control-4':[
'Complete V9 now as verification-only, with no commit.',
'Keep V10 pending verification, with no commit.',
'Reject both comment-only commits.',
'Record the missing sweep as outstanding validation, not a demonstrated code failure.'
],
'control-5':[
'**V9 can complete now without a commit.**',
'**V10 cannot complete now; no commit is needed.**',
'Do not transfer V9’s acceptance to V10 or add comment-only commits to satisfy either helper.',
'Classify this as missing required verification, not an established code failure.'
]}
trials=[];scores=[]
for n in range(1,6):
 for arm,agent in [('installed6.0','installed'),('final','final'),('control','control')]:
  tid=f'{arm}-{n}';p=out/f'{tid}-response.txt';s=p.read_text()
  trial={'id':tid,'agent':f'/root/nochange_eval_assessment/{agent}_{n}','arm':arm,'replicate':n,'model':'gpt-6.1-sol','reasoning_effort':'medium','fork_turns':'none','status':'complete','counted':True,'exclusion':None,'prompt':f'{tid}-prompt.txt','response':p.name,'prompt_sha256':sha(out/f'{tid}-prompt.txt'),'response_sha256':sha(p)};trials.append(trial)
  cs=[]
  for i,q in enumerate(quotes[tid],1):
   assert q in s,(tid,q)
   status='fail' if i==1 and arm=='installed6.0' else 'pass'
   # Whole paragraphs retain source mismatch, no-fabrication policy and full root/sweep/F17 context.
   para=next(x for x in s.split('\n\n') if q in x)
   cs.append({'claim':f'D{i}','status':status,'quote':q,'context':para,'omission':False,'ambiguity':False})
  notes=[]
  if tid=='control-4':notes.append('V10 evidence hash is transcribed incorrectly in prose (a15541aea15541aea15541aea15541aed84541ae vs supplied a15541aea15541aea15541aea15541aea15541ae). It still identifies mismatch and retains original references; does not accept or silently repair the evidence. This collateral transcription error is outside D1-D4 and is not hidden.')
  if tid=='final-4':notes.append('States "With the loop exited" although exit is not an explicit case fact. F17 remains open and ownership retained, so D4 passes its frozen criterion; this unsupported stage assumption limits broader correctness claims.')
  if arm=='control':notes.append('Punch-list routing may be more eager than final guidance; D4 only scores continued F17 ownership/nonresolution, root gate and sweep distinction. No claim of exact workflow routing compliance.')
  scores.append({'id':tid,'claims':cs,'joint_success':all(c['status']=='pass' for c in cs[:3]),'notes':notes})
(out/'trials.json').write_text(json.dumps(trials,indent=2)+'\n');(out/'scores.json').write_text(json.dumps(scores,indent=2)+'\n')
summary={arm:{claim:{status:sum(c['status']==status for t in scores if t['id'].startswith(arm+'-') for c in t['claims'] if c['claim']==claim) for status in ['pass','fail','ambiguous']} for claim in ['D1','D2','D3','D4']} for arm in ['installed6.0','final','control']}
for arm in summary:summary[arm]['joint_success']=sum(t['joint_success'] for t in scores if t['id'].startswith(arm+'-'))
(out/'claim-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
(out/'exclusions.json').write_text(json.dumps({'attempted':15,'counted':15,'retries':0,'exclusions':[]},indent=2)+'\n')
shutil.copytree(after,out/'historical-reference',dirs_exist_ok=True)
historical=[]
for root in [after,after/'baseline-reference']:
 hashes=json.loads((root/'artifact-hashes.json').read_text());bad=[]
 for rel,h in hashes.items():
  p=root/rel
  if not p.is_file() or sha(p)!=h:bad.append(rel)
 historical.append({'root':str(root),'recorded_artifacts':len(hashes),'mismatches':bad})
(out/'historical-integrity-check.json').write_text(json.dumps(historical,indent=2)+'\n')
repo=Path('/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers');recheck=[]
for e in json.loads((out/'original-source-manifest.json').read_text()):
 if e['case']!='B':continue
 p=repo/e['repository_relative_path'];recheck.append({'path':str(p),'expected':e['sha256_full'],'actual':sha(p),'matches':sha(p)==e['sha256_full']})
frozen=json.loads((out/'frozen-artifact-hashes.json').read_text());frozen_mismatches=[r for r,h in frozen.items() if sha(out/r)!=h]
verification={'completed_at_utc':datetime.datetime.now(datetime.timezone.utc).isoformat(),'source_HEAD':subprocess.check_output(['git','-C',str(repo),'rev-parse','HEAD'],text=True).strip(),'source_recheck':recheck,'frozen_artifact_count':len(frozen),'frozen_mismatches':frozen_mismatches,'original_integrity':historical,'expected_trials':15,'complete_responses':len(list(out.glob('*-response.txt'))),'prompt_count':len(list(out.glob('*-prompt.txt'))),'score_count':len(scores),'manual_quote_checks':'all selected exact excerpts confirmed present','original_strict_scores_edited':False}
(out/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
assert all(x['matches'] for x in recheck);assert not frozen_mismatches;assert not any(h['mismatches'] for h in historical);assert len(trials)==15;assert len(list(out.glob('*-response.txt')))==15
print(json.dumps(summary,indent=2));print(json.dumps(verification,indent=2))
