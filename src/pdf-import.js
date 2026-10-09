import * as pdfjs from '../vendor/pdfjs/pdf.mjs';
import {LIMITS,sha256} from './model.js';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('../vendor/pdfjs/pdf.worker.mjs',import.meta.url).href;
function documentTask(bytes,password){
 const task=pdfjs.getDocument({data:new Uint8Array(bytes),cMapUrl:new URL('../vendor/pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('../vendor/pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('../vendor/pdfjs/wasm/',import.meta.url).href,isEvalSupported:false,enableXfa:false});
 task.onPassword=(update,reason)=>{const p=password(reason===pdfjs.PasswordResponses.INCORRECT_PASSWORD);if(p===null)task.destroy();else update(p)};
 return task;
}

/** Render only the visible area from the retained PDF, within a mobile canvas budget. */
export function createDetailRenderer(blob,{password=()=>null,canvasFactory=()=>document.createElement('canvas')}={}){
 let task,documentPromise,renderTask,destroyed=false,revision=0;
 const cancel=()=>{revision++;renderTask?.cancel();};
 return {
  cancel,
  async render(index,size,region,density){
   cancel();const current=revision;
   if(!documentPromise)documentPromise=blob.arrayBuffer().then(bytes=>{if(destroyed)throw Error('Rendering cancelled');task=documentTask(bytes,password);return task.promise});
   const pdf=await documentPromise;
   if(destroyed||current!==revision)return null;
   const page=await pdf.getPage(index+1),base=page.getViewport({scale:1});
   const ratio=Math.min(density,4096/region.w,4096/region.h,Math.sqrt(4000000/(region.w*region.h)));
   const canvas=canvasFactory();canvas.width=Math.ceil(region.w*ratio);canvas.height=Math.ceil(region.h*ratio);
   if(destroyed||current!==revision)return null;
   const viewport=page.getViewport({scale:size.width/base.width*ratio});
   renderTask=page.render({canvasContext:canvas.getContext('2d',{alpha:false}),canvas,viewport,transform:[1,0,0,1,-region.x*ratio,-region.y*ratio],background:'rgb(255,255,255)'});
   try{await renderTask.promise;return !destroyed&&current===revision?canvas:null}catch(e){if(e.name==='RenderingCancelledException')return null;throw e}
  },
  destroy(){destroyed=true;cancel();task?.destroy().catch(()=>{});}
 };
}
export function textBoxes(content,viewport){const results=[];for(const item of content.items){if(!item.str?.trim()||!item.transform)continue;const t=pdfjs.Util.transform(viewport.transform,item.transform);const height=Math.hypot(t[2],t[3]);const width=Math.abs(item.width*viewport.scale);if(Math.abs(t[1])>0.1||Math.abs(t[2])>0.1||!width||!height)continue;const x=Math.max(0,t[4]-2),y=Math.max(0,t[5]-height-2),w=Math.min(viewport.width-x,width+4),h=Math.min(viewport.height-y,height+4);if(w>0&&h>0)results.push({text:item.str.trim(),x:x/viewport.width*100,y:y/viewport.height*100,w:w/viewport.width*100,h:h/viewport.height*100})}return results;}
export async function importPDF(file,{progress=()=>{},password=()=>null,canvasFactory=()=>document.createElement('canvas')}={}){
 if(!file||file.size>LIMITS.pdfBytes)throw Error('PDFは30 MB以下で選んでください');
 const buffer=await file.arrayBuffer(),header=new TextDecoder('ascii').decode(buffer.slice(0,1024));if(!header.includes('%PDF-'))throw Error('PDFファイルを選んでください');
 const digest=await sha256(buffer),original=new Blob([buffer],{type:'application/pdf'});
 const task=documentTask(buffer,password);
 let pdf;try{pdf=await task.promise;if(pdf.numPages>LIMITS.pages)throw Error('PDFは30ページ以下で選んでください');const pages=[];
 for(let n=1;n<=pdf.numPages;n++){progress(n,pdf.numPages);const page=await pdf.getPage(n),base=page.getViewport({scale:1});const ratio=Math.min(2.2,2200/Math.max(base.width,base.height),Math.sqrt(4000000/(base.width*base.height)));const viewport=page.getViewport({scale:ratio}),canvas=canvasFactory();canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const context=canvas.getContext('2d',{alpha:false});if(!context)throw Error('このブラウザでPDFの表示を準備できません');await page.render({canvasContext:context,canvas,viewport,background:'rgb(255,255,255)'}).promise;const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PDF画像の作成に失敗しました')),'image/png'));const texts=textBoxes(await page.getTextContent(),viewport);pages.push({name:`${n} / ${pdf.numPages}`,width:canvas.width,height:canvas.height,blob,texts});canvas.width=canvas.height=1;page.cleanup();}
 return {version:1,id:crypto.randomUUID(),fileName:String(file.name||'map.pdf').slice(0,200),sha256:digest,pdf:original,pages,links:[],importedAt:new Date().toISOString()};
 }catch(e){if(e?.name==='PasswordException')throw Error('PDFのパスワードを確認してください');if(e?.name==='InvalidPDFException')throw Error('PDFが壊れているか、対応していない形式です');throw e}finally{await task.destroy().catch(()=>{})}
}
