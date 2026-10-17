import fs from 'node:fs'
import crypto from 'node:crypto'
import { execFileSync } from 'node:child_process'
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim()
const sources=git('ls-files','skills','tests').split('\n')
const hashes=Object.fromEntries(sources.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]))
const manifest={head:git('rev-parse','HEAD'),repositoryTree:git('rev-parse','HEAD^{tree}'),skillsTree:git('rev-parse','HEAD:skills'),modifiedSources:git('diff','--name-only','HEAD','--','skills','tests').split('\n').filter(Boolean),sha256:hashes}
fs.writeFileSync(new URL(process.argv[2]||'source-manifest-initial.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n')
console.log(`${sources.length} source hashes captured at ${manifest.head}`)
