import fs from 'node:fs';
import path from 'node:path';
import { formatAmount } from './lib/format.mjs';
fs.writeFileSync('lib/generated.mjs', 'export const generated = true;\n');
const out = path.resolve(process.env.OUT_DIR || 'build'); fs.mkdirSync(out,{recursive:true});
const values = [-150,-50,0,50,150].map(cents => ({cents,actual:formatAmount(cents)}));
fs.writeFileSync(path.join(out,'amounts.json'), JSON.stringify(values,null,2)+'\n');
fs.writeFileSync(path.join(process.env.TMPDIR || out,'repro-temp.txt'),'owned reproduction temp\n');
console.log(JSON.stringify({cwd:process.cwd(),out,values}));
