#!/usr/bin/env node
// The cleanup test observer must not turn denied inspection into observed process death.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {fileURLToPath} from 'node:url'
const here=path.dirname(fileURLToPath(import.meta.url))
const source=fs.readFileSync(path.join(here,'replay-harness.mjs'),'utf8')
const driver=source.slice(0,source.indexOf('// ---------- template-literal span scan'))
 .replace('const here = path.dirname(fileURLToPath(import.meta.url))','const here = '+JSON.stringify(here))
const {fixtureProcessAlive}=await import('data:text/javascript;base64,'+Buffer.from(driver+'\nexport {fixtureProcessAlive}').toString('base64'))
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'fixture-liveness-')),originalPath=process.env.PATH
try {
 fs.writeFileSync(path.join(tmp,'ps'),'#!/bin/sh\ncase "$FIXTURE_PS_CASE" in\nalive) echo S; exit 0;;\nzombie) echo Z; exit 0;;\nabsent) exit 1;;\ndenied) echo "ps: inspection denied" >&2; exit 1;;\nfailed) exit 2;;\nempty-success) exit 0;;\nesac\n',{mode:0o755})
 process.env.PATH=tmp+':'+originalPath
 for(const [mode,want] of [['alive',true],['zombie',false],['absent',false],['denied',null],['failed',null],['empty-success',null]]){
  process.env.FIXTURE_PS_CASE=mode
  if(want===null)assert.throws(()=>fixtureProcessAlive(123),/inspection unavailable/,mode+' cannot prove death')
  else assert.equal(fixtureProcessAlive(123),want,mode+' explicit observation')
  console.log('PASS fixture liveness '+mode)
 }
} finally {process.env.PATH=originalPath;delete process.env.FIXTURE_PS_CASE;fs.rmSync(tmp,{recursive:true,force:true})}
