
    /* Warm editorial reveal: the name blows away into fine graphite dust.
 * Deterministic, scroll-scored, and rendered only on scroll/resize; no second clock.
 * Tune travel/lifetime below. Smaller screens use fewer emitted particles. */
window.createPortraitDissolve=function({host,title,signature,score}){
  const canvas=document.createElement('canvas');canvas.id='portrait-dust';canvas.setAttribute('aria-hidden','true');host.append(canvas);
  const ctx=canvas.getContext('2d');
  let W=0,H=0,dpr=1,nameLayer,nameBox,last=-1;
  const random=(x,y,salt=0)=>{const n=Math.sin(x*127.1+y*311.7+salt*73.13)*43758.5453;return n-Math.floor(n);};
  function layer(source,step,limit){
    const {width:w,height:h}=source,data=source.getContext('2d').getImageData(0,0,w,h).data,cells=[];
    for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){
      let alpha=0,sx=0,sy=0;
      for(let yy=y;yy<Math.min(y+step,h);yy++)for(let xx=x;xx<Math.min(x+step,w);xx++){
        const a=data[(yy*w+xx)*4+3];if(a>8){alpha+=a;sx+=xx*a;sy+=yy*a;}
      }
      if(!alpha)continue;
      const r=random(x,y),onset=.025+.40*x/w+.12*(1-y/h)+.20*r;
      cells.push({x,y,cx:sx/alpha,cy:sy/alpha,onset,r,life:Math.min(.34+.20*random(x,y,1),.98-onset),emit:false});
    }
    const count=Math.min(limit,cells.length),ranked=[...cells].sort((a,b)=>random(a.x,a.y,5)-random(b.x,b.y,5));
    ranked.slice(0,count).forEach(c=>c.emit=true);
    const work=document.createElement('canvas');work.width=w;work.height=h;
    return{source,work,paint:work.getContext('2d'),cells,step};
  }
  function resize(){
    W=host.clientWidth;H=host.clientHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
    const css=getComputedStyle(title),size=parseFloat(css.fontSize),height=title.offsetHeight,width=title.offsetWidth,pad=4;
    nameBox={width,height,top:title.offsetTop,groupHeight:signature.offsetHeight,pad};
    const source=document.createElement('canvas');source.width=Math.ceil((width+pad*2)*2);source.height=Math.ceil((height+pad*2)*2);
    const ink=source.getContext('2d');ink.font=`${css.fontWeight} ${size*2}px ${css.fontFamily}`;ink.fillStyle='#22231f';ink.textBaseline='alphabetic';
    ink.letterSpacing=(parseFloat(css.letterSpacing)||0)*2+'px';
    const metrics=ink.measureText(title.textContent),ascent=metrics.fontBoundingBoxAscent||size*1.6,descent=metrics.fontBoundingBoxDescent||size*.4;
    const baseline=(height*2-ascent-descent)/2+ascent;
    ink.fillText(title.textContent,pad*2,baseline+pad*2);
    nameLayer=layer(source,W<=760?4:3,W<=760?350:1100);last=-1;
  }
  function paintLayer(l,progress,x,y,scale,opacity){
    const paint=l.paint;paint.clearRect(0,0,l.work.width,l.work.height);paint.globalCompositeOperation='source-over';paint.drawImage(l.source,0,0);
    paint.globalCompositeOperation='destination-out';paint.beginPath();
    for(const c of l.cells)if(progress>c.onset)paint.rect(c.x,c.y,l.step,l.step);
    paint.fill();paint.globalCompositeOperation='source-over';
    ctx.globalAlpha=opacity;ctx.drawImage(l.work,x,y,l.work.width*scale,l.work.height*scale);
    let alive=0;
    for(const c of l.cells){
      if(!c.emit)continue;const t=(progress-c.onset)/c.life;if(t<=0||t>=1)continue;
      // A shared breeze with individual eddies: every path starts at its ink
      // cell and remains deterministic when the visitor reverses the scroll.
      const travel=W<=760?.58:1,drift=t*(.65+.35*t),seed=random(c.x,c.y,2);
      const curl=Math.sin(t*Math.PI)*(.35+.65*t),angle=c.r*Math.PI*2;
      const dx=((65+120*c.r)*drift+Math.sin(t*8+angle)*curl*(10+18*seed))*travel;
      const dy=((-68+100*seed)*drift-28*t*t+Math.cos(t*7+angle)*curl*(15+20*c.r))*travel;
      ctx.globalAlpha=opacity*.82*Math.min(1,t*16)*(1-score.phase(t,.22,1));
      ctx.fillStyle='#35342e';
      const radius=(.55+random(c.x,c.y,3)*.8)*(1-t*.48);
      ctx.beginPath();ctx.arc(x+c.cx*scale+dx,y+c.cy*scale+dy,radius,0,Math.PI*2);ctx.fill();alive++;
    }
    return alive;
  }
  function update(s,q){
    const progress=q.dissolve;
    title.style.opacity=progress>0?'0':'';
    if(progress<=0||progress>=1){canvas.hidden=true;canvas.dataset.progress=progress.toFixed(4);last=-1;return;}
    canvas.hidden=false;if(s===last)return;last=s;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    const alive=paintLayer(nameLayer,progress,(W-nameBox.width)/2-nameBox.pad,q.titleY-nameBox.groupHeight/2+nameBox.top-nameBox.pad,.5,1);
    ctx.globalAlpha=1;canvas.dataset.progress=progress.toFixed(4);canvas.dataset.particles=String(alive);
  }
  resize();return{resize,update};
};

  