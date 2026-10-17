import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
const run=process.argv[2]
if(!run)throw Error('pass the parent run artifact directory')
const sha=b=>crypto.createHash('sha256').update(b).digest('hex')
const excerpt=(data,start,end)=>data.toString('utf8').split(/(?<=\n)/).slice(start-1,end).join('')
const checks=[]
for(const row of JSON.parse(fs.readFileSync(path.join(run,'behavior-after/source-manifest.json')))){
 const data=fs.readFileSync(row.repository_relative_path)
 checks.push({evidence:'behavior-after',file:row.repository_relative_path,range:[row.start,row.end],full:sha(data)===row.sha256_full,excerpt:sha(excerpt(data,row.start,row.end))===row.sha256_excerpt})
}
const live=JSON.parse(fs.readFileSync(path.join(run,'live-review-isolation/source-manifest.json')))
for(const [file,row] of Object.entries(live.files)){
 const data=file.startsWith('skills/')?fs.readFileSync(file):excerpt(fs.readFileSync('skills/super-code/coordinator.js'),2852,2880)
 checks.push({evidence:'live-review-isolation',file,full:sha(data)===row.sha256})
}
fs.writeFileSync(new URL('eval-source-recheck.json',import.meta.url),JSON.stringify({checks,passed:checks.every(c=>c.full&&c.excerpt!==false)},null,2)+'\n')
console.log(`${checks.filter(c=>c.full&&c.excerpt!==false).length}/${checks.length} frozen source/excerpt entries match`)
process.exitCode=checks.some(c=>!c.full||c.excerpt===false)?1:0
