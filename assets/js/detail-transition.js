
    /* A print travels from its real WebGL corners to the reading panel.
 * GSAP's existing ticker owns the flight. The manual popover only supplies
 * a transparent top-layer surface above the native modal and its backdrop. */
window.StudioDetailTransition=(()=>{
 let timeline=null,layer=null,current=null,finishCallback=null;
 function cleanup(){
  timeline?.kill();timeline=null;
  if(layer){if(layer.matches(':popover-open'))layer.hidePopover();layer.remove();layer=null;}
  if(current){current.classList.remove('detail-opening');gsap.set(current,{clearProps:'opacity,transform,transformOrigin,clipPath,position,inset,margin,width,height'});gsap.set([...current.querySelectorAll('.project-copy,.project-visual,.dialog-close,.project-title-mask>span')],{clearProps:'opacity,transform'});current.style.removeProperty('--backdrop-progress');current=null;}
  const done=finishCallback;finishCallback=null;done?.();
 }
 function matrix(points,w,h){
  const [p0,p1,p2,p3]=points,dx1=p1.x-p2.x,dx2=p3.x-p2.x,dx3=p0.x-p1.x+p2.x-p3.x,dy1=p1.y-p2.y,dy2=p3.y-p2.y,dy3=p0.y-p1.y+p2.y-p3.y;
  const den=dx1*dy2-dx2*dy1;
  const g=Math.abs(den)>1e-7?(dx3*dy2-dx2*dy3)/den:0,hp=Math.abs(den)>1e-7?(dx1*dy3-dx3*dy1)/den:0;
  return `matrix3d(${(p1.x-p0.x+g*p1.x)/w},${(p1.y-p0.y+g*p1.y)/w},0,${g/w},${(p3.x-p0.x+hp*p3.x)/h},${(p3.y-p0.y+hp*p3.y)/h},0,${hp/h},0,0,1,0,${p0.x},${p0.y},0,1)`;
 }
 function open({dialog,origin,src,title,onFinish}){
  cleanup();
  if(typeof HTMLElement.prototype.showPopover!=='function'){window.renderStudyTitle(dialog.querySelector('#project-title'),title,false);onFinish?.();return;}
  current=dialog;finishCallback=onFinish;
  const visual=dialog.querySelector('.project-visual'),copy=dialog.querySelector('.project-copy'),close=dialog.querySelector('.dialog-close');
  const r=visual.getBoundingClientRect(),sheet=dialog.getBoundingClientRect();
  const sheetTarget=[{x:sheet.left,y:sheet.top},{x:sheet.right,y:sheet.top},{x:sheet.right,y:sheet.bottom},{x:sheet.left,y:sheet.bottom}];
  const target=[{x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom}];
  const from=origin?.quad||target.map(p=>({x:r.left+r.width/2+(p.x-r.left-r.width/2)*.92,y:p.y+22}));
  dialog.classList.add('detail-opening');
  // The print and its growing paper share one geometric progress value.
  // No stationary half-panel or delayed wipe competes with the moving artwork.
  layer=document.createElement('div');layer.className='detail-flight-layer';layer.setAttribute('popover','manual');layer.setAttribute('aria-hidden','true');
  const print=document.createElement('div');print.className='detail-flight-print';print.style.width=r.width+'px';print.style.height=r.height+'px';
  const image=document.createElement('img');image.src=src;image.alt='';image.className='detail-flight-art';print.append(image);
  if(origin?.snapshot){origin.snapshot.className='detail-flight-snapshot';print.append(origin.snapshot);}
  layer.append(print);document.body.append(layer);layer.showPopover();
  print.style.transform=matrix(from,r.width,r.height);
  gsap.set(dialog,{position:'fixed',inset:'0 auto auto 0',margin:0,width:sheet.width,height:sheet.height,transformOrigin:'0 0',opacity:0,'--backdrop-progress':0});
  gsap.set(visual,{opacity:0});gsap.set(copy,{opacity:0});gsap.set(close,{opacity:0});
  const words=[...dialog.querySelectorAll('.project-title-mask>span')];
  const smooth=(a,b,value)=>{const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t);};
  const travel={t:0};
  function paint(){
   const t=travel.t,lift=Math.sin(Math.PI*t)*Math.min(24,r.height*.035);
   const corners=destination=>from.map((p,i)=>({x:p.x+(destination[i].x-p.x)*t,y:p.y+(destination[i].y-p.y)*t-lift}));
   print.style.transform=matrix(corners(target),r.width,r.height);
   dialog.style.transform=matrix(corners(sheetTarget),sheet.width,sheet.height);
   dialog.style.opacity=String(smooth(0,.2,t));
   dialog.style.setProperty('--backdrop-progress',String(smooth(0,.45,t)));
   copy.style.opacity=String(smooth(.24,.68,t));
   close.style.opacity=String(smooth(.5,.85,t));
   words.forEach((word,i)=>{const p=smooth(.24+i*.025,.62+i*.025,t);word.style.transform=`translateY(${(1-p)*65}%)`;word.style.opacity=String(p);});
   if(origin?.snapshot)origin.snapshot.style.opacity=String(1-smooth(.22,.62,t));
   visual.style.opacity=String(smooth(.84,.98,t));
   print.style.opacity=String(1-smooth(.87,1,t));
  }
  paint();
  timeline=gsap.timeline({onComplete:cleanup});
  timeline.to(travel,{t:1,duration:1.02,ease:'power3.inOut',onUpdate:paint},0);
 }
 addEventListener('resize',()=>{if(current)cleanup();});
 return{open,cancel:cleanup};
})();

  