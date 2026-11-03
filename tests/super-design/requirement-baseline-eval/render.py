import sys,os,re,json,random,shutil,subprocess,textwrap
O,R,W=sys.argv[1:]
cov=['case-1','case-3','case-5']; fin=['case-2','case-4','case-6']
runs=[(c,r) for c in cov+fin for r in (1,2,3)]
random.seed(20261103); random.shuffle(runs)
m={}
tpl=textwrap.dedent(open(f'{W}/skills/super-design/coverage-reviewer-prompt.md').read().split('```')[1].split('prompt: |\n',1)[1])
for i,(c,r) in enumerate(runs,1):
    rid=f'run-{i:02d}'; run=f'{R}/{rid}'; os.makedirs(run); m[rid]={'case':c,'rep':r}
    src=f'{O}/{c}'
    if c in cov:
        shutil.copytree(f'{src}/repo',run+'/repo')
        subprocess.check_call('git init -q && git add -A && git -c user.email=e@e -c user.name=e -c commit.gpgsign=false commit -qm tree',shell=True,cwd=run+'/repo')
        shutil.copy(f'{src}/spec-before.md',run+'/before.md'); shutil.copy(f'{src}/spec-after.md',run+'/after.md')
        inp=subprocess.run(['bash',f'{W}/skills/super-design/scripts/coverage-inputs','--from',f'{src}/tree.json','rl',run+'/after.md'],capture_output=True,text=True,check=True).stdout
        assert inp.startswith('## Requirement baseline'),rid
        base=inp.split('## Goals',1)[0].split('## Requirement baseline',1)[1].strip()
        g,t=inp.split('## Goals',1)[1].split('## Task tree',1)
        diff=subprocess.run(['diff','-u','before.md','after.md'],cwd=run,capture_output=True,text=True).stdout
        rec=open(f'{src}/record.md').read().strip()
        changed='Revision of the root spec (no tasks were created or amended by a previous coverage round):\n\n'+diff+'\n'+rec
        vals={'BASELINE':base,'GOALS':g.strip(),'TASK_TREE':t.strip(),'REQUIREMENTS_CANONICAL':open(f'{src}/requirements.md').read().strip(),'PRECHECK':'none','CHANGED_TASKS':changed,'COVERAGE_LEDGER':'none','APPENDED_SPECS':''}
        body=re.sub(r'\[([A-Z_]{4,})(?: — [^\]]*)?\]',lambda x:vals.get(x.group(1),x.group(0)),tpl)
        body=body.replace('[ROOT_GOAL_SHORT]','relay')
        left=re.findall(r'\[[A-Z_]{4,}[^\]]{0,20}',body); assert not left,(rid,left)
        for need in ('unchanged:','requirements:','--- before.md','+++ after.md','B1 ·','- [ ]'): assert need in body,(rid,need)
        assert base in body and t.strip() in body
        open(run+'/prompt.md','w').write(body)
    else:
        repo=run+'/repo'; os.makedirs(repo+'/docs')
        sh=lambda cmd: subprocess.run(cmd,shell=True,cwd=repo,check=True,capture_output=True,text=True).stdout.strip()
        sh('git init -q && git config user.email dev@example.com && git config user.name dev && git config commit.gpgsign false')
        shutil.copy(f'{src}/spec.md',repo+'/docs/spec.md'); sh('git add -A && git commit -qm base'); B=sh('git rev-parse HEAD')
        for x in os.listdir(f'{src}/landed'):
            s=f'{src}/landed/{x}'; d=f'{repo}/{x}'
            (shutil.copytree if os.path.isdir(s) else shutil.copy)(s,d)
        sh('git add -A && git commit -qm landed'); H=sh('git rev-parse HEAD')
        sh('bd init --quiet --prefix ev >/dev/null 2>&1 || true')
        E=sh("bd create --type epic --title 'Relay permissions' -d 'Spec: docs/spec.md' --silent")
        os.makedirs(f'{repo}/.superpowers/sdd/{E}-plan'); L=f'{repo}/.superpowers/sdd/{E}-plan/progress.md'
        open(L,'w').write(f'Launch: epic {E} · invocationId inv-1 · branch main · integrationWorktree {repo}\n')
        p=subprocess.run(['bash',f'{W}/skills/super-code/scripts/dispatch-text','--ledger',L,'--stdout','final-review','--mode','single','--base',B,'--head',H],capture_output=True,text=True,cwd=repo)
        assert p.returncode==0,(rid,p.stderr[-300:])
        body=p.stdout
        assert 'REQUIREMENT BASELINE' in body,rid
        open(run+'/prompt.md','w').write(body)
json.dump(m,open(f'{R}/run-map.json','w'),indent=1)
print(len(m))
