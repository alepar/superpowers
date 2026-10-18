#!/usr/bin/env bash
# A forced exit must not truncate retained findings on a pipe or hide them from acceptance.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
python3 - "$REPO_ROOT" <<'PY'
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(sys.argv.pop())
SCRIPTS = ROOT / 'skills/super-auto/scripts'


class ProjectionOutput(unittest.TestCase):
    def setUp(self):
        self.workspace = tempfile.TemporaryDirectory()
        self.addCleanup(self.workspace.cleanup)
        self.directory = pathlib.Path(self.workspace.name)
        self.run = self.directory / 'run.md'
        # The retained judge-4 reproducer's full 128-occurrence data, without trimming text.
        self.occurrences = [dict(section='Confirmed findings', position=i + 1,
                                 key=f'[Should-fix] file-{i}:1',
                                 text=f'Finding {i}: ' + ('Detailed retained verification evidence. ' * 24))
                            for i in range(128)]
        self.source = dict(version=1, source='independent/final', artifact='review.md',
                           kind='final-review', verdict='not ready', occurrences=self.occurrences)
        self.refs = [dict(source=self.source['source'], section=o['section'], position=o['position'])
                     for o in self.occurrences]
        self.dispositions = [dict(ref=self.refs[0], disposition='resolved', judgment='supported',
                                  basis='Fix independently verified', evidence=['verification.log'],
                                  verification='Relevant fix check passed'),
                             dict(ref=self.refs[1], disposition='rejected', judgment='supported',
                                  basis='Independent review rejected this finding', evidence=['review.md'])]
        tree = 'a' * 40
        self.acceptance = dict(version=1, owner='super-auto', sourceTree=tree, requirements=[
            dict(id='review', kind='review', owner='super-auto'),
            dict(id='measurement', kind='measurement', owner='super-auto', command='suite',
                 configuration='fixture', requiredLive=True),
            dict(id='finish', kind='human', owner='human')],
            evidence=[dict(sourceTree=tree, command='suite', configuration='fixture', kind='live',
                           outcome='pass', location='fixture.log')],
            reviews=[dict(id='review', sourceTree=tree, outcome='pass', location='review.md')],
            decisions=[dict(id='finish', authority='human', decision='accept', evidence=['human-choice'])],
            recovery=dict(obligations=[], gaps=[]),
            checkEvidence=dict(records=[], gaps=[], requiredLiveChecks=[]), runFailures=[],
            findingAcceptance=[dict(ref=ref, judgment='supported', effect='nonblocking',
                                    basis='Outside required acceptance scope', evidence=['scope-review.md'])
                               for ref in self.refs])

    def write_run(self, empty=False, gap=False):
        source = dict(self.source, occurrences=[] if empty else self.occurrences)
        (self.directory / 'review.md').write_text('verdict: not ready\n' +
                                                 '\n'.join(o['text'] for o in source['occurrences']))
        lines = ['phase: code', 'flags: skipPlanRoast=false skipCodeRoast=false', 'approvals:',
                 '- finding-source · ' + json.dumps(source)]
        if not empty:
            lines.extend('- finding-disposition · ' + json.dumps(d) for d in self.dispositions)
        if gap:
            lines.append('- finding-disposition · {}')
        lines.append('- root-acceptance · ' + json.dumps(self.acceptance))
        self.run.write_text('\n'.join(lines) + '\n')

    def projection_command(self):
        return ['bash', str(SCRIPTS / 'scope-dispositions'), '--project', str(self.run)]

    def check_projection(self, empty=False, gap=False):
        self.write_run(empty=empty, gap=gap)
        # A real file establishes that serialization itself is complete; PIPE exercises
        # the asynchronous stdout boundary used by report-status's spawnSync consumer.
        with (self.directory / 'projection.json').open('wb') as output:
            direct = subprocess.run(self.projection_command(), stdout=output, stderr=subprocess.PIPE)
        piped = subprocess.run(self.projection_command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        expected_code = 3 if gap else 0
        self.assertEqual(direct.returncode, expected_code, direct.stderr)
        self.assertEqual(piped.returncode, expected_code, piped.stderr)
        self.assertEqual(piped.stderr, b'')
        if not empty:
            self.assertGreater((self.directory / 'projection.json').stat().st_size, 131072)
        self.assertEqual(piped.stdout, (self.directory / 'projection.json').read_bytes(),
                         'pipe must preserve every serialized byte, including the final JSON delimiter')
        projection = json.loads(piped.stdout)
        expected = [] if empty else [dict(source='independent/final', artifact='review.md', **o)
                                    for o in self.occurrences]
        self.assertEqual([o for f in projection['findings'] for o in f['occurrences']], expected)
        self.assertEqual(projection['metrics']['occurrences'], 0 if empty else 128)
        self.assertEqual(projection['metrics']['outstanding'], 0 if empty else 126)
        self.assertEqual(len(projection['gaps']), 1 if gap else 0)
        if not empty:
            self.assertEqual([f['outstanding'] for f in projection['findings']], [False, False] + [True] * 126)
            self.assertEqual([f['dispositions'][0]['disposition'] for f in projection['findings'][:2]],
                             ['resolved', 'rejected'])
            self.assertTrue(all(f['dispositions'][0]['supported'] for f in projection['findings'][:2]))
        print(f'projection empty={empty} gap={gap}: {len(piped.stdout)} bytes, exit {piped.returncode}')

    def check_acceptance(self, empty=False, gap=False):
        self.write_run(empty=empty, gap=gap)
        result = subprocess.run(['bash', str(SCRIPTS / 'report-status'), '--acceptance', str(self.run)],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        acceptance = json.loads(result.stdout)
        self.assertFalse(any('projection unavailable' in g for g in acceptance['gaps']), acceptance)
        self.assertEqual(result.returncode, 3 if gap else 0, result.stderr)
        self.assertEqual(result.stderr, b'')
        self.assertEqual(acceptance['eligible'], not gap)
        self.assertEqual(acceptance['pending'], [])
        self.assertEqual(acceptance['nonblockingFindings'], [] if empty else self.refs[2:])
        if gap:
            self.assertTrue(any('finding evidence:' in g for g in acceptance['gaps']), acceptance)
        else:
            self.assertEqual(acceptance['gaps'], [])
        print(f'acceptance empty={empty} gap={gap}: {len(acceptance["nonblockingFindings"])} retained refs, exit {result.returncode}')

    def large_acceptance(self):
        # Long source identities exercise the acceptance sink, not only projection output.
        source = 'independent/' + ('source-identity-' * 45)
        self.source['source'] = source
        for ref in self.refs:
            ref['source'] = source

    def check_acceptance_transport(self, empty=False, gap=False):
        self.large_acceptance()
        self.write_run(empty=empty, gap=gap)
        command = ['bash', str(SCRIPTS / 'report-status'), '--acceptance', str(self.run)]
        with (self.directory / 'acceptance.json').open('wb') as output:
            direct = subprocess.run(command, stdout=output, stderr=subprocess.PIPE)
        piped = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        expected = 3 if gap else 0
        self.assertEqual(direct.returncode, expected, direct.stderr)
        self.assertEqual(piped.returncode, expected, piped.stderr)
        self.assertEqual(piped.stderr, b'')
        regular = (self.directory / 'acceptance.json').read_bytes()
        if not empty:
            self.assertGreater(len(regular), 65536)
        self.assertEqual(piped.stdout, regular, 'acceptance must flush every output byte')
        result = json.loads(piped.stdout)
        self.assertEqual(result['eligible'], not gap)
        self.assertEqual(result['nonblockingFindings'], [] if empty else self.refs[2:])
        print(f'acceptance transport empty={empty} gap={gap}: {len(regular)} bytes, exit {piped.returncode}')

    def test_aggregate_projection_above_default_buffer(self):
        # Catch aggregate transport truncation separately from per-report extraction.
        # First establish review/live/human prerequisites without a large projection.
        self.write_run(empty=True)
        acceptance_command = ['bash', str(SCRIPTS / 'report-status'), '--acceptance', str(self.run)]
        prerequisite = subprocess.run(acceptance_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertEqual(prerequisite.returncode, 0, prerequisite.stderr)
        self.assertEqual(prerequisite.stderr, b'')
        self.assertEqual(json.loads(prerequisite.stdout), dict(
            owner='super-auto', sourceTree='a' * 40, eligible=True,
            pending=[], gaps=[], nonblockingFindings=[]))

        sources, occurrences, refs, dispositions = [], [], [], []
        extraction_sizes = []
        for report in range(24):
            source_id, artifact = f'aggregate/report-{report}', f'review-{report}.md'
            report_occurrences = []
            for item in range(16):
                key = f'[Should-fix] retained-{report}-{item}:1'
                report_occurrences.append(dict(section='Confirmed findings', position=item + 1,
                    key=key, text=key + ' — ' + ('Retained aggregate verification evidence. ' * 60)))
            source = dict(version=1, source=source_id, artifact=artifact, kind='roast',
                          verdict='Should-fix (16 confirmed)', occurrences=report_occurrences)
            report_path = self.directory / artifact
            report_path.write_text('super-roast verdict: Should-fix (16 confirmed)\n'
                                   '## Confirmed findings\n' +
                                   ''.join('- ' + o['text'] + '\n' for o in report_occurrences))
            # Real complete extraction independently validates every source, including
            # the last retained item, and demonstrates that no individual output is large.
            extracted = subprocess.run(['bash', str(SCRIPTS.parent.parent / 'super-code/scripts/report-verdict'),
                '--complete', '--source', source_id, str(report_path)],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.assertEqual(extracted.returncode, 0, extracted.stderr)
            self.assertEqual(extracted.stderr, b'')
            self.assertLess(len(extracted.stdout), 65536)
            extraction_sizes.append(len(extracted.stdout))
            self.assertEqual(json.loads(extracted.stdout), dict(source, artifact=str(report_path)))
            sources.append(source)
            occurrences.extend(dict(source=source_id, artifact=artifact, **o) for o in report_occurrences)
            report_refs = [dict(source=source_id, section='Confirmed findings', position=i + 1)
                           for i in range(16)]
            refs.extend(report_refs)
            dispositions.extend([
                dict(ref=report_refs[0], disposition='resolved', judgment='supported',
                     basis='Fix independently verified', evidence=['verification.log'],
                     verification='Relevant fix check passed'),
                dict(ref=report_refs[1], disposition='rejected', judgment='supported',
                     basis='Independent scope review', evidence=['scope-review.md'])])
        self.acceptance['findingAcceptance'] = [dict(ref=ref, judgment='supported', effect='nonblocking',
            basis='Outside required acceptance scope', evidence=['scope-review.md']) for ref in refs]
        lines = ['phase: code', 'flags: skipPlanRoast=false skipCodeRoast=false',
                 'roast-code: ' + ', '.join(s['artifact'] for s in sources), 'approvals:']
        lines.extend('- finding-source · ' + json.dumps(s) for s in sources)
        lines.extend('- finding-disposition · ' + json.dumps(d) for d in dispositions)
        finding_lines = lines[:]
        lines.append('- root-acceptance · ' + json.dumps(self.acceptance))
        self.run.write_text('\n'.join(lines) + '\n')
        projection = subprocess.run(self.projection_command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertEqual(projection.returncode, 0, projection.stderr)
        self.assertEqual(projection.stderr, b'')
        self.assertGreater(len(projection.stdout), 1048576)
        projected = json.loads(projection.stdout)
        self.assertEqual(projected['gaps'], [])
        self.assertEqual(projected['metrics']['sources'], 24)
        self.assertEqual(projected['metrics']['occurrences'], 384)
        self.assertEqual(projected['metrics']['occurrenceGroups'], 384)
        self.assertEqual(projected['metrics']['outstanding'], 336)
        self.assertEqual([o for f in projected['findings'] for o in f['occurrences']], occurrences)
        self.assertEqual([f['ref'] for f in projected['findings']], refs)
        self.assertEqual([f['outstanding'] for f in projected['findings']],
                         ([False, False] + [True] * 14) * 24)
        actual_dispositions = [dict((k, v) for k, v in d.items() if k not in ('origin', 'supported'))
                               for f in projected['findings'] for d in f['dispositions']]
        self.assertEqual(actual_dispositions, dispositions)
        self.assertTrue(all(d['supported'] for f in projected['findings'] for d in f['dispositions']))
        print(f'aggregate projection: {len(projection.stdout)} bytes, 24 sources, 384 exact refs, '
              f'336 outstanding; maximum extraction {max(extraction_sizes)} bytes')
        nonblocking = [ref for i, ref in enumerate(refs) if i % 16 >= 2]

        for case in ['valid', 'missing-live', 'missing-human', 'missing-artifact', 'malformed-json']:
            acceptance = json.loads(json.dumps(self.acceptance))
            case_lines = finding_lines[:]
            if case == 'missing-live':
                # Simulated success must never satisfy a required live measurement.
                acceptance['evidence'][0]['kind'] = 'simulated'
            elif case == 'missing-human':
                acceptance['decisions'] = []
            elif case == 'missing-artifact':
                (self.directory / sources[-1]['artifact']).unlink()
            elif case == 'malformed-json':
                case_lines.append('- finding-disposition · {')
            case_lines.append('- root-acceptance · ' + json.dumps(acceptance))
            self.run.write_text('\n'.join(case_lines) + '\n')
            before = {p.name: p.read_bytes() for p in self.directory.iterdir() if p.is_file()}
            # Ordinary status must retain its computed count even when acceptance is pending.
            with self.subTest(case=case, consumer='ordinary'):
                status = subprocess.run(['bash', str(SCRIPTS / 'report-status'), str(self.run)],
                                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                self.assertEqual(status.returncode, 0, status.stderr)
                self.assertEqual(status.stderr, b'')
                status_text = status.stdout.decode()
                self.assertNotIn('projection unavailable', status_text)
                self.assertIn('qualifier: outstanding findings: 336', status_text)
                if case in ('missing-artifact', 'malformed-json'):
                    self.assertIn('qualifier: finding evidence gaps: 1', status_text)
                if case == 'missing-live':
                    self.assertIn('measurement: unavailable (live required)', status_text)
                if case == 'missing-human':
                    self.assertIn('finish: human decision pending', status_text)
            with self.subTest(case=case, consumer='acceptance'):
                result = subprocess.run(acceptance_command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                self.assertEqual(result.returncode, 0 if case == 'valid' else 3, result.stderr)
                self.assertEqual(result.stderr, b'')
                accepted = json.loads(result.stdout)
                self.assertFalse(any('projection unavailable' in g for g in accepted['gaps']), accepted)
                self.assertEqual(accepted['nonblockingFindings'], nonblocking)
                self.assertEqual(accepted['eligible'], case == 'valid')
                expected_pending = {
                    'missing-live': ['measurement: unavailable (live required); owner: super-auto'],
                    'missing-human': ['finish: human decision pending; owner: human'],
                }.get(case, [])
                self.assertEqual(accepted['pending'], expected_pending)
                if case in ('missing-artifact', 'malformed-json'):
                    self.assertTrue(any(g.startswith('finding evidence:') for g in accepted['gaps']), accepted)
                    reason = 'source artifact unavailable' if case == 'missing-artifact' else 'malformed finding JSON'
                    self.assertTrue(any(reason in g for g in accepted['gaps']), accepted)
                else:
                    self.assertEqual(accepted['gaps'], [])
                print(f'aggregate {case}: acceptance exit {result.returncode}, '
                      f'{len(accepted["nonblockingFindings"])} exact outstanding refs')
            self.assertEqual({p.name: p.read_bytes() for p in self.directory.iterdir() if p.is_file()}, before,
                             'both read-only consumers must preserve all canonical run/artifact bytes')
            if case == 'missing-artifact':
                last = sources[-1]
                (self.directory / last['artifact']).write_text(
                    'super-roast verdict: Should-fix (16 confirmed)\n## Confirmed findings\n' +
                    ''.join('- ' + o['text'] + '\n' for o in last['occurrences']))

    def test_large_acceptance_transport(self):
        self.check_acceptance_transport()

    def test_large_gap_acceptance_transport(self):
        self.check_acceptance_transport(gap=True)

    def test_small_acceptance_transport(self):
        self.check_acceptance_transport(empty=True)

    def test_acceptance_closed_pipe(self):
        self.large_acceptance()
        self.write_run()
        before = self.run.read_bytes()
        command = ['bash', str(SCRIPTS / 'report-status'), '--acceptance', str(self.run)]
        with subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE) as producer:
            producer.stdout.close()
            error = producer.stderr.read()
            code = producer.wait()
        self.assertNotEqual(code, 0, 'acceptance output failure cannot report success')
        self.assertTrue(error, 'acceptance output failure must be observable')
        self.assertEqual(self.run.read_bytes(), before)

    def test_large_projection_pipe(self):
        self.check_projection()

    def test_large_projection_acceptance_consumer(self):
        self.check_acceptance()

    def test_gap_projection_pipe(self):
        self.check_projection(gap=True)

    def test_gap_projection_acceptance_consumer(self):
        self.check_acceptance(gap=True)

    def test_valid_empty_projection_pipe(self):
        self.check_projection(empty=True)

    def test_valid_empty_acceptance_consumer(self):
        self.check_acceptance(empty=True)

    def test_incomplete_pipe_write_is_failure(self):
        self.write_run()
        before = self.run.read_bytes()
        with subprocess.Popen(self.projection_command(), stdout=subprocess.PIPE, stderr=subprocess.PIPE) as producer:
            producer.stdout.close()
            error = producer.stderr.read()
            code = producer.wait()
        self.assertNotEqual(code, 0, 'a closed output pipe must not report success')
        self.assertTrue(error, 'output write failure must remain observable')
        self.assertEqual(self.run.read_bytes(), before, 'output failure must not mutate retained finding records')


unittest.main(verbosity=2)
PY
