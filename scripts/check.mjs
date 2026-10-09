import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])}
for(const file of ['src/app.js','src/model.js','src/pdf-import.js','sw.js'])assert.equal(spawnSync(process.execPath,['--check',file],{cwd:root}).status,0,file);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');for(const m of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g))assert(fs.existsSync(path.join(root,m[1])),m[1]);
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest')));assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,'./');for(const size of ['192x192','512x512'])assert(manifest.icons.some(i=>i.sizes===size));
const prohibited=[/appgprj_[a-z0-9]+/i,/appgdep_[a-z0-9]+/i,/appgver_[a-z0-9]+/i,/libfile_[a-z0-9]+/i];
for(const f of walk(root)){const rel=path.relative(root,f);assert(!rel.startsWith('.git'+path.sep),'Git history');assert(!rel.startsWith('.openai'),'Private deployment metadata');assert(!/\.pdf$/i.test(f),'No event PDF may be bundled');if(rel==='scripts/check.mjs')continue;if(/\.(js|mjs|html|md|json|ya?ml|css|txt|webmanifest)$/.test(f)){const text=fs.readFileSync(f,'utf8');for(const pattern of prohibited)assert(!pattern.test(text),'Private/event material: '+rel)}}
const app=fs.readFileSync(path.join(root,'src/app.js'),'utf8');assert(!/https?:\/\/[^'"\s]+/.test(app.replace(/https?:\/\//g,'')),'No external API endpoint');console.log('PASS: syntax, relative entry assets, PWA paths/icons, no event/private identifiers or PDFs');
