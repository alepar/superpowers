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
