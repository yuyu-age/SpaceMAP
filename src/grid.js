/** Conservative detection of a closed, axis-aligned grid cell around a label. */
export function gridBounds(image, text) {
  const {width, height, data} = image;
  const dark = (x,y) => {
    const i=(y*width+x)*4;
    return data[i+3]>128 && (data[i]+data[i+1]+data[i+2])/3<150;
  };
  const x0=Math.max(0,Math.floor(text.x/100*width)), y0=Math.max(0,Math.floor(text.y/100*height));
  const x1=Math.min(width-1,Math.ceil((text.x+text.w)/100*width)), y1=Math.min(height-1,Math.ceil((text.y+text.h)/100*height));
  if(x1<=x0||y1<=y0)return null;
  const coverage=(axis,pos,start,end)=>{
    let n=0;for(let i=start;i<=end;i++)if(axis==='x'?dark(pos,i):dark(i,pos))n++;
    return n/(end-start+1);
  };
  const edge=(axis,start,step,limit,a,b)=>{
    for(let p=start;p>=0&&p<limit&&Math.abs(p-start)<limit*.15;p+=step)
      if(coverage(axis,p,a,b)>.85)return p;
    return null;
  };
  const left=edge('x',x0,-1,width,y0,y1),right=edge('x',x1,1,width,y0,y1);
  const top=edge('y',y0,-1,height,x0,x1),bottom=edge('y',y1,1,height,x0,x1);
  if([left,right,top,bottom].some(n=>n===null))return null;
  if(right-left<text.w/100*width||bottom-top<text.h/100*height)return null;
  if(coverage('x',left,top,bottom)<.85||coverage('x',right,top,bottom)<.85||coverage('y',top,left,right)<.85||coverage('y',bottom,left,right)<.85)return null;
  return {x:left/width*100,y:top/height*100,w:(right-left)/width*100,h:(bottom-top)/height*100};
}

export async function findCellBounds(page, text) {
  const image=await createImageBitmap(page.blob);
  try {
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const context=canvas.getContext('2d');context.drawImage(image,0,0);
    return gridBounds(context.getImageData(0,0,canvas.width,canvas.height),text);
  } finally { image.close(); }
}
