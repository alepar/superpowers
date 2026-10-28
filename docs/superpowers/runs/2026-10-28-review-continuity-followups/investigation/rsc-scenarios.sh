#!/usr/bin/env bash
# usage: scenarios.sh <dispatch-text.mjs> <workdir>
set -u
DT=$1; R=$2; rm -rf "$R"; mkdir -p "$R"; cd "$R"
g(){ git -c user.name=x -c user.email=x@x "$@"; }
g init -q repo; cd repo
printf 'Launch: args {"epicId":"t","integrationBranch":"main","integrationWorktree":"%s","invocationId":"new-inv"}\n' "$PWD" > ../ledger.md
echo zero > product.txt; g add -A; g commit -qm zero; Z=$(git rev-parse HEAD)
REC='- review-collection · {"invocationId": "old-inv", "workspace": "/prior/workspace", "reviewPath": null, "review": "no work landed", "required": [], "settled": true, "complete": false, "gaps": ["retained prior failure"], "files": []}'
mkdir -p docs/prior/reviews/old-inv; printf '# Prior run\napprovals:\n%s\n' "$REC" > docs/prior/run.md
echo old > docs/prior/reviews/old-inv/final-review-old-inv.md; echo one > product.txt
g add -A; g commit -qm prior; B=$(git rev-parse HEAD)
n=0
sel(){ n=$((n+1)); out=$(node "$DT" --ledger ../ledger.md review-inputs --base "$1" --head "$2" --out-dir "$R/out-$n" 2>&1); echo "  exit=$? $(echo "$out" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s.trim().split("\n").pop());console.log(j.status,JSON.stringify(j.gaps))}catch{console.log(s)}})')"; }
echo two > product.txt; g commit -qam product; P=$(git rev-parse HEAD)
echo "A product-only range, untouched incomplete prior run (want 0):"; sel $B $P
echo "x" >> docs/prior/run.md; g commit -qam touch-run; T=$(git rev-parse HEAD)
echo "B range edits the prior run.md (want 3):"; sel $P $T
echo changed > docs/prior/reviews/old-inv/final-review-old-inv.md; g commit -qam touch-archive; A=$(git rev-parse HEAD)
echo "C range edits a file in the prior run's archive dir (want 3):"; sel $T $A
printf 'approvals:\n- review-collection · {not json\n' > docs/prior/run.md; g commit -qam corrupt; C=$(git rev-parse HEAD)
echo "D range corrupts the prior run.md (want 3):"; sel $A $C
g rm -q docs/prior/run.md; g commit -qm delete; D=$(git rev-parse HEAD)
echo "E range deletes the corrupt run.md (want 3, base-side corrupt):"; sel $C $D
echo three > product.txt; g commit -qam p2; P2=$(git rev-parse HEAD)
echo "F broad range including prior run's creation (want 3, inherited gap kept):"; g checkout -q -b broad $B; echo b > product.txt; g commit -qam broad; P3=$(git rev-parse HEAD); sel $Z $P3
