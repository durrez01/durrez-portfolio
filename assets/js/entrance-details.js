
    /* V11 / warm graphite dust and brief silver traces. Existing type, cards and paths.
 * Both use the existing gallery/scroll clock. No change to the authored score. */
window.createEntranceTrails=function({host,T,cards,camera,score,motion}){
  const canvas=document.createElement('canvas');canvas.id='entrance-trails';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'3'});host.append(canvas);
  const ctx=canvas.getContext('2d'),point=new T.Vector3();
  const SETTINGS={life:.42,opacity:.40,maxLength:220};
  let W=0,H=0,dpr=1,lastScore=null,energy=0,wasVisible=false;
  const history=cards.map(()=>[[],[]]);
  const corners=[[-1.004,.86],[1.004,-.86]];
  function resize(){W=host.clientWidth;H=host.clientHeight;dpr=Math.min(devicePixelRatio||1,W<=760?1.25:1.5);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);clear();}
  function clear(){history.forEach(pair=>pair.forEach(h=>h.length=0));ctx.clearRect(0,0,canvas.width,canvas.height);}
  function update(s,time,dt,enabled){
    const gate=score.phase(s,.10,.24)*(1-score.phase(s,1.17,1.34));
    const velocity=lastScore===null?0:Math.abs(s-lastScore)/Math.max(.001,dt);lastScore=s;
    energy+=(Math.min(1,velocity*2.4)-energy)*(1-Math.exp(-dt*(velocity>.005?14:8)));
    if(!enabled||gate<.001){canvas.hidden=true;if(wasVisible)clear();wasVisible=false;return;}
    canvas.hidden=false;wasVisible=true;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    camera.updateMatrixWorld();
    let segments=0;
    cards.forEach((card,i)=>{
      card.group.updateMatrixWorld(true);
      corners.forEach(([x,y],edge)=>{
        point.set(x*motion.CARD.width/2,y*motion.CARD.height/2,motion.CARD.depth/2);
        card.group.localToWorld(point);point.project(camera);
        const px=(point.x*.5+.5)*W,py=(-point.y*.5+.5)*H,h=history[i][edge];
        if(!Number.isFinite(px+py)||point.z>1){h.length=0;return;}
        // A fixed sampling interval keeps the same tail duration on 60/120Hz displays.
        if(!h.length||time-h[h.length-1].time>=1/90)h.push({x:px,y:py,time});
        while(h.length>1&&(time-h[0].time>SETTINGS.life||h.length>48))h.shift();
        if(energy<.015||h.length<3)return;
        const maxLength=W<=760?SETTINGS.maxLength*.6:SETTINGS.maxLength;
        let distance=0;
        for(let j=h.length-1;j>0;j--){
          const a=h[j],b=h[j-1],length=Math.hypot(a.x-b.x,a.y-b.y);distance+=length;
          if(distance>maxLength||length>maxLength*.65)break;
          const age=(time-b.time)/SETTINGS.life,tail=Math.pow(1-age,1.8),alpha=SETTINGS.opacity*gate*energy*tail*Math.min(1,distance/8);
          segments++;
          // A soft silver thread with a quieter warm edge; no duplicate artwork.
          ctx.lineCap='round';ctx.lineWidth=(W<=760?1.3:2.1)*tail+.25;
          ctx.strokeStyle=`rgba(255,251,237,${alpha*1.8})`;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
          ctx.lineWidth=.65;ctx.strokeStyle=`rgba(130,112,86,${alpha*.75})`;ctx.beginPath();ctx.moveTo(a.x+.8,a.y+.6);ctx.lineTo(b.x+.8,b.y+.6);ctx.stroke();
          if(j%4===i%4){ctx.fillStyle=`rgba(137,117,90,${alpha*.85})`;ctx.beginPath();ctx.arc(b.x+Math.sin(i*3+j)*3,b.y+Math.cos(i+j)*3,.65,0,Math.PI*2);ctx.fill();}
        }
      });
    });
    canvas.dataset.segments=String(segments);canvas.dataset.energy=energy.toFixed(3);
  }
  resize();return{update,resize,dispose(){canvas.remove();clear();}};
};

window.createEntranceDust=function({host,title,score}){
  const canvas=document.createElement('canvas');canvas.id='entrance-dust';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none'});host.append(canvas);
  const ctx=canvas.getContext('2d');
  const SETTINGS={start:.60,settled:1.27,fillStart:1.08,end:1.20,travel:105};
  const random=(x,y,salt=0)=>{const n=Math.sin(x*127.1+y*311.7+salt*73.13)*43758.5453;return n-Math.floor(n);};
  let W=0,H=0,dpr=1,particles=[],last=-1;
  function resize(){
    W=host.clientWidth;H=host.clientHeight;dpr=Math.min(devicePixelRatio||1,W<=760?1.25:1.5);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    // offset geometry is unaffected by the parent's orange-dot zoom. The DOM
    // title remains intact for accessibility and the final sharp letterforms.
    const css=getComputedStyle(title),size=parseFloat(css.fontSize),lineHeight=parseFloat(css.lineHeight);
    const left=title.offsetLeft,top=title.offsetTop,width=title.offsetWidth;
    const source=document.createElement('canvas');source.width=W;source.height=H;
    const ink=source.getContext('2d',{willReadFrequently:true});ink.font=`${css.fontWeight} ${size}px ${css.fontFamily}`;
    ink.letterSpacing=css.letterSpacing;ink.textAlign='center';ink.textBaseline='alphabetic';ink.fillStyle='#22231f';
    // Text nodes separated by the existing <br>, preserving its two-line layout.
    const lines=[];let line='';title.childNodes.forEach(node=>{if(node.nodeName==='BR'){lines.push(line);line='';}else if(node.nodeType===3)line+=node.textContent;});lines.push(line);
    const metrics=ink.measureText('Hg'),ascent=metrics.fontBoundingBoxAscent||size*.8,descent=metrics.fontBoundingBoxDescent||size*.2;
    lines.forEach((text,i)=>{
      const extra=i===lines.length-1?size*.155:0;
      ink.fillText(text,left+width/2-extra/2,top+i*lineHeight+(lineHeight-ascent-descent)/2+ascent);
    });
    const pixels=ink.getImageData(0,0,W,H).data,candidates=[],step=2;
    for(let y=Math.max(0,Math.floor(top));y<Math.min(H,top+title.offsetHeight+size*.2);y+=step){
      for(let x=Math.max(0,Math.floor(left-3));x<Math.min(W,left+width+3);x+=step){
        if(pixels[(y*W+x)*4+3]<80)continue;
        const r=random(x,y),second=y>top+lineHeight;
        candidates.push({x,y,r,birth:random(x,y,4)*.38,onset:(second?.12:0)+.16*x/W+.15*r,dx:(r-.5)*SETTINGS.travel*2,dy:(random(x,y,1)-.72)*SETTINGS.travel,curve:(random(x,y,2)-.5)*50,size:.8+random(x,y,3)*.6});
      }
    }
    const limit=W<=760?2300:7200;
    candidates.sort((a,b)=>a.r-b.r);
    particles=candidates.length<=limit?candidates:Array.from({length:limit},(_,i)=>candidates[Math.floor(i*candidates.length/limit)]);
    last=-1;
  }
  function update(s){
    if(s===last)return;last=s;
    // Fine, faint grains gain weight as they arrive. Assembly overlaps the
    // final ink before the grains visually stop moving; no delayed second beat.
    const p=score.phase(s,SETTINGS.start,SETTINGS.settled),ink=score.phase(s,SETTINGS.fillStart,SETTINGS.end);
    title.style.opacity=String(ink);
    if(p<=0||ink>=1){canvas.hidden=true;canvas.dataset.particles='0';return;}
    canvas.hidden=false;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    const presence=score.phase(s,.60,.90)*(1-ink),travel=W<=760?.65:1;
    let count=0;
    for(const dot of particles){
      const t=score.phase(p,dot.onset,.88+dot.onset*.24),away=1-t;
      const x=dot.x+dot.dx*away*away*travel+Math.sin(t*Math.PI)*dot.curve*travel,y=dot.y+dot.dy*away*away*travel;
      const emergence=.28+.72*score.phase(p,dot.birth,dot.birth+.36);
      ctx.globalAlpha=presence*emergence*(.14+.78*t*t);ctx.fillStyle=dot.r>.97?'#9b694c':'#35352e';
      ctx.beginPath();ctx.arc(x,y,dot.size*(.48+.55*t+.24*ink),0,Math.PI*2);ctx.fill();count++;
    }
    ctx.globalAlpha=1;canvas.dataset.particles=String(count);canvas.dataset.progress=p.toFixed(3);
  }
  resize();return{resize,update,dispose(){title.style.opacity='';canvas.remove();}};
};

// The dot remains the camera's fixed origin. Three faint impressions retain
// the heading's previous scale, like ink briefly holding in the paper.
window.createEntranceEcho=function({host,title,score}){
  const SETTINGS={opacity:[.14,.085,.045],lag:[.055,.10,.16],maxOffset:.013};
  const originalPosition=title.style.position,originalZ=title.style.zIndex;
  title.style.position='relative';title.style.zIndex='1';
  const echoes=SETTINGS.opacity.map((opacity,i)=>{
    const node=title.cloneNode(true);node.removeAttribute('id');node.classList.add('entrance-echo');
    node.setAttribute('aria-hidden','true');node.removeAttribute('aria-labelledby');
    // Keep the dot's layout space while avoiding a second animated orange dot.
    node.querySelectorAll('[id]').forEach(child=>{child.removeAttribute('id');child.style.visibility='hidden';});
    Object.assign(node.style,{position:'absolute',margin:'0',zIndex:'0',pointerEvents:'none',opacity:'0',color:'#6b6256',filter:`blur(${.55+i*.55}px)`,willChange:'transform,opacity'});
    host.append(node);return{node,scale:1,opacity};
  });
  let left=0,top=0,lastTime=null;
  function resize(){
    left=title.offsetLeft;top=title.offsetTop;
    echoes.forEach(({node})=>{node.style.left=left+'px';node.style.top=top+'px';node.style.width=title.offsetWidth+'px';node.style.height=title.offsetHeight+'px';});
    lastTime=null;
  }
  function update(s,origin,time){
    const dt=lastTime===null?1/60:Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
    const dive=score.presentation(s).portalDive,current=1+dive*dive*2;
    const gate=score.phase(s,1.35,1.43)*(1-score.phase(s,1.74,1.87));
    echoes.forEach((echo,i)=>{
      if(gate<.001){echo.scale=current;echo.node.style.opacity='0';return;}
      echo.scale+=(current-echo.scale)*(1-Math.exp(-dt/SETTINGS.lag[i]));
      const lag=echo.scale/current-1,limit=SETTINGS.maxOffset*(i+1);
      const relative=1+Math.max(-limit,Math.min(limit,lag));
      const strength=Math.min(1,Math.abs(lag)/(.010+i*.005));
      echo.node.style.transformOrigin=`${origin.x-left}px ${origin.y-top}px`;
      echo.node.style.transform=`translateZ(0) scale(${relative})`;
      echo.node.style.opacity=(echo.opacity*gate*strength).toFixed(4);
    });
  }
  resize();return{resize,update,dispose(){echoes.forEach(e=>e.node.remove());title.style.position=originalPosition;title.style.zIndex=originalZ;}};
};

  