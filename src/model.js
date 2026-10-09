/** Pure validation and device-local persistence. No network calls. */
export const DATABASE='space-link-map-local-v1:'+new URL('../',import.meta.url).pathname;
export const LIMITS={pdfBytes:30*1024*1024,pages:30,items:50,backupBytes:45*1024*1024};
export function normalizeId(s){return String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ').toUpperCase()}
export function validURL(s){if(!s)return '';try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password&&s.length<=2048?u.href:null}catch{return null}}
export function validateLink(r,pageCount){
 if(!r||typeof r.booth!=='string'||!r.booth.trim()||r.booth.length>48)throw Error('スペース番号は1〜48文字で入力してください');
 if(typeof r.circle!=='string'||r.circle.length>100)throw Error('サークル名は100文字以内で入力してください');
 if(typeof r.url!=='string'||validURL(r.url)===null)throw Error('URLは http:// または https:// から始めてください');
 if(!/^#[a-f\d]{6}$/i.test(r.color))throw Error('色が正しくありません');
 if(!Array.isArray(r.items)||r.items.length>LIMITS.items||r.items.some(i=>!i||typeof i.name!=='string'||!i.name.trim()||i.name.length>120||(i.price!==null&&(!Number.isSafeInteger(i.price)||i.price<0||i.price>100000000))))throw Error('販売物の名前と価格を確認してください');
 if(!Number.isInteger(r.page)||r.page<0||r.page>=pageCount)throw Error('ページが正しくありません');
 if(['x','y','w','h'].some(k=>!Number.isFinite(r[k]))||r.x<0||r.y<0||r.w<=0||r.h<=0||r.x+r.w>100.001||r.y+r.h>100.001)throw Error('地図上の範囲を指定してください');
 if(r.id!==undefined&&(typeof r.id!=='string'||r.id.length>100))throw Error('登録IDが正しくありません');
 return {id:typeof r.id==='string'?r.id:crypto.randomUUID(),booth:r.booth.trim(),circle:r.circle.trim(),url:validURL(r.url),color:r.color,items:r.items.map(i=>({name:i.name.trim(),price:i.price})),page:r.page,x:r.x,y:r.y,w:r.w,h:r.h,updatedAt:r.updatedAt||new Date().toISOString()};
}
export function boundsFromCorners(a,b){return {x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)}}
export function findTextCandidates(pages,value){const needle=normalizeId(value);const hits=[];pages.forEach((p,page)=>{for(const t of p.texts||[])if(normalizeId(t.text)===needle)hits.push({...t,page})});return hits;}
export function parseBackup(value){if(!value||value.format!=='space-link-map-backup'||value.version!==1||!value.document||typeof value.document.sha256!=='string'||!/^[a-f\d]{64}$/.test(value.document.sha256)||!Array.isArray(value.links)||value.links.length>10000)throw Error('このアプリのバックアップを選んでください');return value;}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DATABASE,1);req.onupgradeneeded=()=>req.result.createObjectStore('data');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);req.onblocked=()=>reject(Error('他のタブを閉じてから再試行してください'))})}
export async function loadProject(){const db=await openDB();try{return await new Promise((resolve,reject)=>{const req=db.transaction('data').objectStore('data').get('project');req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error)})}finally{db.close()}}
export async function saveProject(project){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').put(project,'project');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('保存を中断しました'))})}finally{db.close()}}
export async function deleteProject(){const db=await openDB();try{await new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');tx.objectStore('data').delete('project');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}finally{db.close()}}
export async function sha256(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')}
export function bytesToBase64(bytes){let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(s)}
export function base64ToBytes(s){if(typeof s!=='string'||s.length>LIMITS.backupBytes)throw Error('PDFデータが大きすぎます');try{return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}catch{throw Error('PDFデータを読み込めません')}}
