
    /* Soft ground impressions and brief edge smears, projected from the actual
 * moving prints. The existing GSAP render owns this canvas; no extra clock. */
window.createStudyAtmosphere=function({host,T,cards,camera,score,motion}){
 const canvas=document.createElement('canvas');canvas.id='study-atmosphere';canvas.setAttribute('aria-hidden','true');
 Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3'});
 host.insertBefore(canvas,host.querySelector('#gallery-canvas'));
 const ctx=canvas.getContext('2d'),point=new T.Vector3(),history=cards.map(()=>[]);
 let W=0,H=0,dpr=1,lastScore=null,energy=0,visible=false;
 function clear(){ctx.clearRect(0,0,canvas.width,canvas.height);history.forEach(h=>h.length=0);}
 function resize(){W=host.clientWidth;H=host.clientHeight;dpr=Math.min(devicePixelRatio||1,W<=760?1:1.4);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);clear();}
 function project(group,x,y,z){point.set(x,y,z);group.localToWorld(point);point.project(camera);return{x:(point.x*.5+.5)*W,y:(.5-point.y*.5)*H};}
 function update(s,time,dt,enabled){
  const delta=lastScore===null?0:s-lastScore;lastScore=s;
  const gate=score.phase(s,16.05,16.8)*(1-score.phase(s,26.1,27));
  const speed=Math.abs(delta)>.35?0:Math.min(1,Math.abs(delta)/Math.max(dt,.001)*.65);
  energy+=(speed-energy)*(1-Math.exp(-dt*9));
  if(!enabled||gate<.001){canvas.hidden=true;if(visible)clear();visible=false;return;}
  canvas.hidden=false;visible=true;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);camera.updateMatrixWorld();
  if(Math.abs(delta)>.35)history.forEach(h=>h.length=0);
  let traces=0;
  cards.forEach((card,i)=>{
   const group=card.group,h=history[i];if(!group.visible){h.length=0;return;}group.updateMatrixWorld(true);
   const halfW=motion.CARD.width/2,halfH=motion.CARD.height/2;
   const quad=[[-halfW,halfH],[halfW,halfH],[halfW,-halfH],[-halfW,-halfH]].map(([x,y])=>project(group,x,y,0));
   const width=Math.hypot(quad[1].x-quad[0].x,quad[1].y-quad[0].y),bottom=project(group,0,-halfH-.09,0);
   if(!Number.isFinite(width+bottom.y)||width<14||width>W*1.5){h.length=0;return;}
   const opacity=card.materials[0].opacity*gate;
   // Broad key from upper left: a small rightward offset, feathered underneath.
   if(bottom.y>-40&&bottom.y<H+50){
    ctx.save();ctx.translate(bottom.x+width*.045,bottom.y+width*.025);ctx.scale(width*.60,Math.max(3,width*.045));
    const shade=ctx.createRadialGradient(0,0,0,0,0,1);shade.addColorStop(0,`rgba(67,55,39,${.105*opacity})`);shade.addColorStop(.38,`rgba(67,55,39,${.045*opacity})`);shade.addColorStop(1,'rgba(67,55,39,0)');
    ctx.fillStyle=shade;ctx.fillRect(-1,-1,2,2);ctx.restore();
   }
   while(h.length&&time-h[0].time>.13)h.shift();
   const previous=h[0];
   if(previous&&energy>.06){
    // Only the receding edge carries a trace. The artwork itself stays sharp.
    for(const [a,b] of [[0,3],[1,2]]){
     const p=quad[a],q=quad[b],oldP=previous.quad[a],oldQ=previous.quad[b],distance=Math.hypot(p.x-oldP.x,p.y-oldP.y);
     if(distance<1||distance>W*.22)continue;
     const stretch=Math.min(1,(W<=760?24:48)/distance),tailP={x:p.x+(oldP.x-p.x)*stretch,y:p.y+(oldP.y-p.y)*stretch},tailQ={x:q.x+(oldQ.x-q.x)*stretch,y:q.y+(oldQ.y-q.y)*stretch};
     const smear=ctx.createLinearGradient(p.x,p.y,tailP.x,tailP.y);smear.addColorStop(0,`rgba(147,130,102,${.085*energy*opacity})`);smear.addColorStop(1,'rgba(147,130,102,0)');
     ctx.fillStyle=smear;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.lineTo(tailQ.x,tailQ.y);ctx.lineTo(tailP.x,tailP.y);ctx.closePath();ctx.fill();traces++;
    }
   }
   if(!h.length||time-h[h.length-1].time>=1/60)h.push({time,quad});
  });
  canvas.dataset.energy=energy.toFixed(3);canvas.dataset.traces=String(traces);
 }
 resize();return{update,resize,dispose(){canvas.remove();history.forEach(h=>h.length=0);}};
};

  