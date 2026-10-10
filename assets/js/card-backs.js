
    /* One warm mineral-fiber stock for every text face. Cached once; reveals only
 * composite it, so the grain stays still as the text is written. */
window.StudioCardFinish=(()=>{
  let surface;
  function paper(){
    if(surface)return surface;
    surface=document.createElement('canvas');surface.width=1024;surface.height=1280;
    const c=surface.getContext('2d'),pixels=c.createImageData(1024,1280);let seed=193;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let y=0;y<1280;y++)for(let x=0;x<1024;x++){
      const i=(y*1024+x)*4;
      const formation=Math.sin(x*.017+Math.sin(y*.011))*Math.sin(y*.023)*1.2;
      const tooth=(random()-.5)*9+formation;
      [224,217,204].forEach((tone,k)=>pixels.data[i+k]=tone+tooth);
      pixels.data[i+3]=255;
    }
    c.putImageData(pixels,0,0);
    // Short irregular fibers, without a directional weave or visible tiling.
    c.lineWidth=.65;c.lineCap='round';
    for(let i=0;i<9500;i++){
      const x=random()*1024,y=random()*1280,a=random()*Math.PI*2,len=1+random()*5;
      c.strokeStyle=i%3?'rgba(83,70,52,.065)':'rgba(255,251,235,.20)';
      c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(a)*len,y+Math.sin(a)*len);c.stroke();
    }
    return surface;
  }
  function paint(ctx,w,h){ctx.drawImage(paper(),0,0,w,h);}
  function raisedText(ctx,text,x,y,color){
    ctx.save();
    // A shallow solid edge, a warm cast shadow, then a crisp lit face.
    ctx.fillStyle='rgba(50,40,29,.52)';ctx.shadowColor='rgba(44,34,22,.34)';
    ctx.shadowBlur=9;ctx.shadowOffsetX=5;ctx.shadowOffsetY=7;
    ctx.fillText(text,x+2,y+3);
    ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;
    for(let depth=2.4;depth>0;depth-=.6)ctx.fillText(text,x+depth*.6,y+depth);
    ctx.lineWidth=1.25;ctx.strokeStyle='rgba(255,250,234,.72)';ctx.strokeText(text,x-.7,y-.8);
    ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();
  }
  return{paint,raisedText};
})();

/* Shared print painter: fixed edition marks, individually composed study notes.
 * The production textures and QA contact sheet use the same canvas artwork. */
window.paintStudyBack=function(canvas,p,index){
 const W=1024,H=1280;canvas.width=W;canvas.height=H;const c=canvas.getContext('2d');
 const ink='#242520',muted='#595449',accent=p.accent||'#ae4323';let bottom=0;
 window.StudioCardFinish.paint(c,W,H);
 const text=(value,x,y,size=30,color=ink,font='Geist',align='left')=>{c.font=`400 ${size}px "${font}"`;c.fillStyle=color;c.textAlign=align;c.textBaseline='top';c.fillText(value,x,y);bottom=Math.max(bottom,y+size);};
 const para=(value,x,y,width=850,size=30,leading=43,color=muted)=>{c.font=`400 ${size}px "Geist"`;let line='';for(const word of value.split(' ')){const next=line?line+' '+word:word;if(line&&c.measureText(next).width>width){text(line,x,y,size,color);y+=leading;line=word;}else line=next;}text(line,x,y,size,color);return y+leading;};
 const rule=(x,y,w=864)=>{c.strokeStyle=accent;c.globalAlpha=.3;c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.stroke();c.globalAlpha=1;};
 const title=(x,y,size=100,align='left',step=size*1.05)=>{(p.titleLines||[p.title]).forEach((line,i)=>text(line,x,y+i*step,size,ink,'Bricolage',align));};
 const label=(value,x,y)=>text(value.toUpperCase(),x,y,19,accent,'IBM Plex Mono');
 const fragment=(i,x,y,width=850)=>{const parts=p.fragments[i].split(' / ');if(parts.length>1){label(parts[0],x,y);return para(parts[1],x,y+36,width,33,43,ink);}return para(parts[0],x,y,width,34,46,ink);};
 label((window.ARTIST?.name||'')+' / Selected systems',70,60);text(String(index+1).padStart(2,'0'),954,54,32,accent,'IBM Plex Mono','right');rule(70,112,884);
 switch(index){
 case 0:
  title(70,176,112);label(p.label,72,440);para(p.short,72,490,810,38,48,accent);
  p.fragments.forEach((_,i)=>{const y=665+i*130;text('0'+(i+1),72,y,23,accent,'IBM Plex Mono');fragment(i,155,y,750);});
  break;
 case 1:{
  title(70,180,158);rule(70,555);const dEnd=para(p.description,70,605,850,33,46);
  const fy=Math.max(910,dEnd+34);fragment(0,70,fy,370);fragment(1,545,fy,370);}
  for(let j=0;j<11;j++){c.globalAlpha=.1+j*.02;c.fillStyle=accent;c.fillRect(810+j*9,190,2,300);}c.globalAlpha=1;break;
 case 2:
  title(70,174,92);para(p.short,70,420,780,38,50,accent);
  p.fragments.forEach((_,i)=>{const x=80+i*105,y=600+i*155;rule(x,y-22,750-i*105);fragment(i,x,y,720-i*100);});
  para(p.detail,70,1090,850,27,37);break;
 case 3:
  c.strokeStyle=accent;c.globalAlpha=.3;c.strokeRect(90,170,844,950);c.globalAlpha=1;
  title(512,224,114,'center');text(p.label.toUpperCase(),512,505,21,accent,'IBM Plex Mono','center');
  para(p.description,155,590,714,31,44);
  p.fragments.forEach((_,i)=>{const x=150+i*248;fragment(i,x,930,215);});break;
 case 4:
  title(70,182,108);text('a',900,375,440,accent,'Bricolage','right');
  label(p.label,70,555);para(p.short,70,610,410,36,48);
  rule(70,900);para(p.description,70,950,850,31,43);break;
 case 5:
  text((p.titleLines||[p.title])[0],70,190,108,ink,'Bricolage');text((p.titleLines||[p.title])[1]||'',195,315,140,accent,'Bricolage');
  p.fragments.forEach((line,i)=>{text(line,70+i*90,580+i*98,37,i===1?accent:ink);});
  para(p.description,70,950,850,30,43);break;
 case 6:{
  title(70,184,112);label(p.label,70,465);
  ['#ac6950','#b49a50','#6f947c','#63769d','#8d7894'].forEach((color,i)=>{c.fillStyle=color;c.globalAlpha=.65;c.fillRect(70+i*177,535,168,10);});c.globalAlpha=1;
  const dEnd=para(p.description,70,610,850,35,48);
  const fy=Math.max(990,dEnd+36);
  p.fragments.forEach((line,i)=>{text('0'+(i+1),70+i*296,fy,22,accent,'IBM Plex Mono');para(line,70+i*296,fy+45,250,32,41,ink);});}break;
 case 7:
  title(512,184,118,'center');text(p.short,512,470,36,accent,'Geist','center');
  c.fillStyle=accent;c.globalAlpha=.055;c.fillRect(512,565,440,330);c.globalAlpha=1;
  fragment(0,70,635,360);fragment(1,562,635,355);rule(70,890);
  para(p.description,70,950,850,30,42);break;
 }
 const contentBottom=bottom;
 c.fillStyle=accent;c.beginPath();c.arc(74,1200,4,0,Math.PI*2);c.fill();
 text(p.category.toUpperCase(),96,1191,17,muted,'IBM Plex Mono');text('STUDY / 2026',954,1191,17,muted,'IBM Plex Mono','right');
 return{contentBottom,footerTop:1191};
};

  