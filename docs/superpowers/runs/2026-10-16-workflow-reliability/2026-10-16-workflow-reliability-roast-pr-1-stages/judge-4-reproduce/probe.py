import pathlib,json,subprocess
root=pathlib.Path('/tmp/ufz-pr1/judge-4-reproduce'); scripts=root/'skills/super-auto/scripts'
occ=[dict(section='Confirmed findings',position=i+1,key=f'[Should-fix] file-{i}:1',text=f'Finding {i}: '+('Detailed retained verification evidence. '*24)) for i in range(128)]
source=dict(version=1,source='independent/final',artifact='review.md',kind='final-review',verdict='not ready',occurrences=occ)
(root/'review.md').write_text('verdict: not ready\n'+ '\n'.join(o['text'] for o in occ))
run=root/'run.md';run.write_text('phase: code\nflags: skipPlanRoast=false skipCodeRoast=false\napprovals:\n- finding-source · '+json.dumps(source)+'\n')
cmd=['bash',str(scripts/'scope-dispositions'),'--project',str(run)]
with (root/'projection-file.json').open('wb') as f:pfile=subprocess.run(cmd,stdout=f,stderr=subprocess.PIPE)
p=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE);(root/'projection-pipe.json').write_bytes(p.stdout)
d=json.loads((root/'projection-file.json').read_text())
try:json.loads(p.stdout);parse='ok'
except Exception as e:parse=str(e)
status=subprocess.run(['bash',str(scripts/'report-status'),str(run)],capture_output=True,text=True)
(root/'status.txt').write_text(status.stdout)
# Causal check in an owned copy only, preserving all other projection code.
fixed=scripts/'scope-dispositions-flush-probe';fixed.write_text((scripts/'scope-dispositions').read_text().replace('process.exit(gaps.length ? 3 : 0);','process.exitCode = gaps.length ? 3 : 0;'))
f=subprocess.run(['bash',str(fixed),'--project',str(run)],capture_output=True)
receipt=dict(node=subprocess.check_output(['node','--version'],text=True).strip(),file=dict(exit=pfile.returncode,bytes=(root/'projection-file.json').stat().st_size,findings=len(d['findings']),gaps=d['gaps']),pipe=dict(exit=p.returncode,bytes=len(p.stdout),stderr=p.stderr.decode(),parse=parse),status=dict(exit=status.returncode,stdout=status.stdout,stderr=status.stderr),flushProbe=dict(exit=f.returncode,bytes=len(f.stdout),findings=len(json.loads(f.stdout)['findings'])))
(root/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2))
