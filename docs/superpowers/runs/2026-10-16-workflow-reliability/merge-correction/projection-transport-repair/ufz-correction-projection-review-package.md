fd52ffc7 fix(super-auto): consume complete aggregate finding projections

 skills/super-auto/scripts/report-status  |   4 +-
 tests/super-auto/projection-output-r1.sh | 138 +++++++++++++++++++++++++++++++
 2 files changed, 140 insertions(+), 2 deletions(-)

diff --git a/skills/super-auto/scripts/report-status b/skills/super-auto/scripts/report-status
index 2e997dd7..9cf02e4c 100755
--- a/skills/super-auto/scripts/report-status
+++ b/skills/super-auto/scripts/report-status
@@ -321,21 +321,21 @@ for(const [artifact,kind] of declared){
   const extracted=extract(artifact,s.source);
   try{
    if(extracted.status!==0)throw Error('original report unavailable or malformed');
    const actual=JSON.parse(extracted.stdout);
    if(actual.kind!==kind||content(actual)!==content(s))throw Error('retained extraction differs from complete original report');
   }catch(e){gap('source coverage: '+artifact+' ('+s.source+'): '+e.message)}
  }
 }
 // Use the same validated projection as Remaining and resume. Valid empty is distinct
 // from a missing extraction or an empty --keys stream carrying gaps.
-const projection=cp.spawnSync('bash',[path.join(scripts,'scope-dispositions'),'--project',run],{encoding:'utf8'});
+const projection=cp.spawnSync('bash',[path.join(scripts,'scope-dispositions'),'--project',run],{encoding:'utf8',maxBuffer:Infinity});
 try{
  if(![0,3].includes(projection.status))throw Error('unavailable');
  const p=JSON.parse(projection.stdout);if(!Array.isArray(p.findings)||!Array.isArray(p.gaps))throw Error('malformed');
  for(const g of p.gaps)gap('finding evidence: '+JSON.stringify(g));
  const sameRef=(a,b)=>a&&b&&a.source===b.source&&a.section===b.section&&a.position===b.position;
  for(const f of p.findings.filter(f=>f.outstanding)){
   const refs=f.occurrences.map(o=>({source:o.source,section:o.section,position:o.position}));
   // Explicit projection links establish one finding group. Assess it once through
   // any exact member ref, retaining every original source occurrence in the result.
   const judgment=(current?.findingAcceptance||[]).filter(j=>refs.some(ref=>sameRef(j?.ref,ref))).at(-1);
@@ -529,21 +529,21 @@ for(const r of latest.values()){
   if(actual!==f.sha256){integrityGaps.push(r.invocationId+': archive integrity mismatch: '+f.path);invalid=true}
  }
  if(!r.complete||invalid)pending++;
  errors+=(r.gaps||[]).length;
 }
 errors+=integrityGaps.length;
 for(const g of integrityGaps)console.log('review collection gap: '+g);
 if(pending)console.log('review collections pending: '+pending);
 if(errors)console.log('review collection gaps: '+errors);
 if(/^- finding-/m.test(text)){
- const p=cp.spawnSync('bash',[path.join(scripts,'scope-dispositions'),'--project',run],{encoding:'utf8'});
+ const p=cp.spawnSync('bash',[path.join(scripts,'scope-dispositions'),'--project',run],{encoding:'utf8',maxBuffer:Infinity});
  try{if(![0,3].includes(p.status))throw Error();const d=JSON.parse(p.stdout),n=d.findings.filter(f=>f.outstanding).length;if(n)console.log('outstanding findings: '+n);if(d.gaps.length)console.log('finding evidence gaps: '+d.gaps.length)}catch{console.log('finding projection unavailable — retain known findings')}
 }else if([...latest.values()].some(r=>r.reviewPath!==null))console.log('finding evidence gaps: source extraction unavailable');
 STATUS
 )
   else
     continuity='finding projection unavailable — retain known findings; review collection unverified'
   fi
 fi
 
 if [ "${RS_SKIP_ACCEPTANCE:-}" != 1 ] && awk '/^- root-acceptance/ { found=1; exit } END { exit !found }' "$run"; then
diff --git a/tests/super-auto/projection-output-r1.sh b/tests/super-auto/projection-output-r1.sh
index 1a5eda16..99c8c0d7 100644
--- a/tests/super-auto/projection-output-r1.sh
+++ b/tests/super-auto/projection-output-r1.sh
@@ -133,20 +133,158 @@ class ProjectionOutput(unittest.TestCase):
         self.assertEqual(piped.stderr, b'')
         regular = (self.directory / 'acceptance.json').read_bytes()
         if not empty:
             self.assertGreater(len(regular), 65536)
         self.assertEqual(piped.stdout, regular, 'acceptance must flush every output byte')
         result = json.loads(piped.stdout)
         self.assertEqual(result['eligible'], not gap)
         self.assertEqual(result['nonblockingFindings'], [] if empty else self.refs[2:])
         print(f'acceptance transport empty={empty} gap={gap}: {len(regular)} bytes, exit {piped.returncode}')
 
+    def test_aggregate_projection_above_default_buffer(self):
+        # Catch aggregate transport truncation separately from per-report extraction.
+        # First establish review/live/human prerequisites without a large projection.
+        self.write_run(empty=True)
+        acceptance_command = ['bash', str(SCRIPTS / 'report-status'), '--acceptance', str(self.run)]
+        prerequisite = subprocess.run(acceptance_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
+        self.assertEqual(prerequisite.returncode, 0, prerequisite.stderr)
+        self.assertEqual(prerequisite.stderr, b'')
+        self.assertEqual(json.loads(prerequisite.stdout), dict(
+            owner='super-auto', sourceTree='a' * 40, eligible=True,
+            pending=[], gaps=[], nonblockingFindings=[]))
+
+        sources, occurrences, refs, dispositions = [], [], [], []
+        extraction_sizes = []
+        for report in range(24):
+            source_id, artifact = f'aggregate/report-{report}', f'review-{report}.md'
+            report_occurrences = []
+            for item in range(16):
+                key = f'[Should-fix] retained-{report}-{item}:1'
+                report_occurrences.append(dict(section='Confirmed findings', position=item + 1,
+                    key=key, text=key + ' — ' + ('Retained aggregate verification evidence. ' * 60)))
+            source = dict(version=1, source=source_id, artifact=artifact, kind='roast',
+                          verdict='Should-fix (16 confirmed)', occurrences=report_occurrences)
+            report_path = self.directory / artifact
+            report_path.write_text('super-roast verdict: Should-fix (16 confirmed)\n'
+                                   '## Confirmed findings\n' +
+                                   ''.join('- ' + o['text'] + '\n' for o in report_occurrences))
+            # Real complete extraction independently validates every source, including
+            # the last retained item, and demonstrates that no individual output is large.
+            extracted = subprocess.run(['bash', str(SCRIPTS.parent.parent / 'super-code/scripts/report-verdict'),
+                '--complete', '--source', source_id, str(report_path)],
+                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
+            self.assertEqual(extracted.returncode, 0, extracted.stderr)
+            self.assertEqual(extracted.stderr, b'')
+            self.assertLess(len(extracted.stdout), 65536)
+            extraction_sizes.append(len(extracted.stdout))
+            self.assertEqual(json.loads(extracted.stdout), dict(source, artifact=str(report_path)))
+            sources.append(source)
+            occurrences.extend(dict(source=source_id, artifact=artifact, **o) for o in report_occurrences)
+            report_refs = [dict(source=source_id, section='Confirmed findings', position=i + 1)
+                           for i in range(16)]
+            refs.extend(report_refs)
+            dispositions.extend([
+                dict(ref=report_refs[0], disposition='resolved', judgment='supported',
+                     basis='Fix independently verified', evidence=['verification.log'],
+                     verification='Relevant fix check passed'),
+                dict(ref=report_refs[1], disposition='rejected', judgment='supported',
+                     basis='Independent scope review', evidence=['scope-review.md'])])
+        self.acceptance['findingAcceptance'] = [dict(ref=ref, judgment='supported', effect='nonblocking',
+            basis='Outside required acceptance scope', evidence=['scope-review.md']) for ref in refs]
+        lines = ['phase: code', 'flags: skipPlanRoast=false skipCodeRoast=false',
+                 'roast-code: ' + ', '.join(s['artifact'] for s in sources), 'approvals:']
+        lines.extend('- finding-source · ' + json.dumps(s) for s in sources)
+        lines.extend('- finding-disposition · ' + json.dumps(d) for d in dispositions)
+        finding_lines = lines[:]
+        lines.append('- root-acceptance · ' + json.dumps(self.acceptance))
+        self.run.write_text('\n'.join(lines) + '\n')
+        projection = subprocess.run(self.projection_command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
+        self.assertEqual(projection.returncode, 0, projection.stderr)
+        self.assertEqual(projection.stderr, b'')
+        self.assertGreater(len(projection.stdout), 1048576)
+        projected = json.loads(projection.stdout)
+        self.assertEqual(projected['gaps'], [])
+        self.assertEqual(projected['metrics']['sources'], 24)
+        self.assertEqual(projected['metrics']['occurrences'], 384)
+        self.assertEqual(projected['metrics']['occurrenceGroups'], 384)
+        self.assertEqual(projected['metrics']['outstanding'], 336)
+        self.assertEqual([o for f in projected['findings'] for o in f['occurrences']], occurrences)
+        self.assertEqual([f['ref'] for f in projected['findings']], refs)
+        self.assertEqual([f['outstanding'] for f in projected['findings']],
+                         ([False, False] + [True] * 14) * 24)
+        actual_dispositions = [dict((k, v) for k, v in d.items() if k not in ('origin', 'supported'))
+                               for f in projected['findings'] for d in f['dispositions']]
+        self.assertEqual(actual_dispositions, dispositions)
+        self.assertTrue(all(d['supported'] for f in projected['findings'] for d in f['dispositions']))
+        print(f'aggregate projection: {len(projection.stdout)} bytes, 24 sources, 384 exact refs, '
+              f'336 outstanding; maximum extraction {max(extraction_sizes)} bytes')
+        nonblocking = [ref for i, ref in enumerate(refs) if i % 16 >= 2]
+
+        for case in ['valid', 'missing-live', 'missing-human', 'missing-artifact', 'malformed-json']:
+            acceptance = json.loads(json.dumps(self.acceptance))
+            case_lines = finding_lines[:]
+            if case == 'missing-live':
+                # Simulated success must never satisfy a required live measurement.
+                acceptance['evidence'][0]['kind'] = 'simulated'
+            elif case == 'missing-human':
+                acceptance['decisions'] = []
+            elif case == 'missing-artifact':
+                (self.directory / sources[-1]['artifact']).unlink()
+            elif case == 'malformed-json':
+                case_lines.append('- finding-disposition · {')
+            case_lines.append('- root-acceptance · ' + json.dumps(acceptance))
+            self.run.write_text('\n'.join(case_lines) + '\n')
+            before = {p.name: p.read_bytes() for p in self.directory.iterdir() if p.is_file()}
+            # Ordinary status must retain its computed count even when acceptance is pending.
+            with self.subTest(case=case, consumer='ordinary'):
+                status = subprocess.run(['bash', str(SCRIPTS / 'report-status'), str(self.run)],
+                                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
+                self.assertEqual(status.returncode, 0, status.stderr)
+                self.assertEqual(status.stderr, b'')
+                status_text = status.stdout.decode()
+                self.assertNotIn('projection unavailable', status_text)
+                self.assertIn('qualifier: outstanding findings: 336', status_text)
+                if case in ('missing-artifact', 'malformed-json'):
+                    self.assertIn('qualifier: finding evidence gaps: 1', status_text)
+                if case == 'missing-live':
+                    self.assertIn('measurement: unavailable (live required)', status_text)
+                if case == 'missing-human':
+                    self.assertIn('finish: human decision pending', status_text)
+            with self.subTest(case=case, consumer='acceptance'):
+                result = subprocess.run(acceptance_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
+                self.assertEqual(result.returncode, 0 if case == 'valid' else 3, result.stderr)
+                self.assertEqual(result.stderr, b'')
+                accepted = json.loads(result.stdout)
+                self.assertFalse(any('projection unavailable' in g for g in accepted['gaps']), accepted)
+                self.assertEqual(accepted['nonblockingFindings'], nonblocking)
+                self.assertEqual(accepted['eligible'], case == 'valid')
+                expected_pending = {
+                    'missing-live': ['measurement: unavailable (live required); owner: super-auto'],
+                    'missing-human': ['finish: human decision pending; owner: human'],
+                }.get(case, [])
+                self.assertEqual(accepted['pending'], expected_pending)
+                if case in ('missing-artifact', 'malformed-json'):
+                    self.assertTrue(any(g.startswith('finding evidence:') for g in accepted['gaps']), accepted)
+                    reason = 'source artifact unavailable' if case == 'missing-artifact' else 'malformed finding JSON'
+                    self.assertTrue(any(reason in g for g in accepted['gaps']), accepted)
+                else:
+                    self.assertEqual(accepted['gaps'], [])
+                print(f'aggregate {case}: acceptance exit {result.returncode}, '
+                      f'{len(accepted["nonblockingFindings"])} exact outstanding refs')
+            self.assertEqual({p.name: p.read_bytes() for p in self.directory.iterdir() if p.is_file()}, before,
+                             'both read-only consumers must preserve all canonical run/artifact bytes')
+            if case == 'missing-artifact':
+                last = sources[-1]
+                (self.directory / last['artifact']).write_text(
+                    'super-roast verdict: Should-fix (16 confirmed)\n## Confirmed findings\n' +
+                    ''.join('- ' + o['text'] + '\n' for o in last['occurrences']))
+
     def test_large_acceptance_transport(self):
         self.check_acceptance_transport()
 
     def test_large_gap_acceptance_transport(self):
         self.check_acceptance_transport(gap=True)
 
     def test_small_acceptance_transport(self):
         self.check_acceptance_transport(empty=True)
 
     def test_acceptance_closed_pipe(self):
