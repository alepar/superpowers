import json,pathlib,subprocess,tempfile
root=pathlib.Path("/Users/alepar/.aisw/profiles/codex/codex-3/worktrees/02a7/superpowers")
inputs=pathlib.Path(__file__).resolve().parent
with tempfile.TemporaryDirectory(prefix="task6-r1-repro-",dir="/private/tmp") as temp:
 d=pathlib.Path(temp)
 for family in ["readiness","prior-close"]:
  for case in ["baseline","resumed"]:
   name=family+"-"+case
   for argv in ([str(root/"tests/super-code/run-profile-fixture.mjs"),str(inputs/(name+".json")),str(d/name)],[str(root/"skills/super-code/scripts/run-profile.mjs"),"--workflow",str(d/name),"--out",str(d/(name+"-profile"))]):
    p=subprocess.run(["node",*argv],capture_output=True,text=True);assert p.returncode==0,p.stderr
   data=json.loads((d/(name+"-profile.json")).read_text())
   keys=["id","attempts","landed","landedAt","verificationOnlyCompleted","dependencyReadyAt","readyAt","waitMs"]
   print(json.dumps(dict(case=name,beads=[{k:b[k] for k in keys} for b in data["beads"]],unmeasured=data["unmeasured"])))
