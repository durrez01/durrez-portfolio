
    /* A warm pigment wake connects the moving print to the portrait's color.
 * Deterministic scroll paths, projected card geometry, and the gallery clock. */
window.createBiographyAtmosphere=function({host,T,cards,camera,light,score,motion,image}){
  const make=(id,z)=>{const c=document.createElement('canvas');c.id=id;c.setAttribute('aria-hidden','true');Object.assign(c.style,{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:z});host.append(c);return c;};
  const floor=make('biography-floor','0'),dust=make('biography-pigment','2'),fc=floor.getContext('2d'),dc=dust.getContext('2d');
  const rand=(i,k=0)=>{const n=Math.sin(i*127.1+k*311.7)*43758.5453;return n-Math.floor(n);};
  const vector=new T.Vector3(),matrix=new T.Matrix4(),rotation=new T.Quaternion(),scale=new T.Vector3();
  const project=(x,y,z,m)=>{vector.set(x,y,z).applyMatrix4(m).project(camera);return{x:(vector.x*.5+.5)*W,y:(.5-vector.y*.5)*H};};
  let W=0,H=0,dpr=1,grains=[],last=-1;
  // Sample only the actual cutout, so particles finish inside the artist.
  const sample=document.createElement('canvas');sample.width=128;sample.height=192;
  const sc=sample.getContext('2d',{willReadFrequently:true});sc.drawImage(image,0,0,128,192);
  const pixels=sc.getImageData(0,0,128,192).data,targets=[];
  for(let y=10;y<185;y+=3)for(let x=8;x<120;x+=3)if(pixels[(y*128+x)*4+3]>180)targets.push({x:x/128,y:y/192});
  function resize(){
    camera.updateMatrixWorld(true);
    W=host.clientWidth;H=host.clientHeight;dpr=Math.min(devicePixelRatio||1,W<=760?1.25:1.5);
    for(const c of [floor,dust]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}
    grains=Array.from({length:W<=760?150:380},(_,i)=>{
      const target=targets[Math.floor(rand(i,2)*targets.length)]||{x:.5,y:.5};
      const distance=Math.hypot((target.x-.56)*.67,target.y-.43);
      const arrival=4.79+distance*.67+rand(i,8)*.11,birth=arrival-(.48+rand(i,3)*.25);
      const p=score.biographyPose(birth,W,H,0);
      rotation.setFromEuler(new T.Euler(p.rx,p.ry,p.rz));scale.setScalar(p.s);matrix.compose(new T.Vector3(p.x,p.y,p.z),rotation,scale);
      const from=project(-motion.CARD.width*.46,(rand(i,4)-.5)*motion.CARD.height*.38,0,matrix);
      return{from,target,arrival,birth,r:rand(i,5),tone:rand(i,9),strength:rand(i,10),seed:rand(i,6)*Math.PI*2};
    });last=-1;
  }
  function shadow(group,alpha,landing,middle=false){
    group.updateMatrixWorld(true);
    const a=project(-motion.CARD.width/2,-motion.CARD.height/2,0,group.matrixWorld),b=project(motion.CARD.width/2,-motion.CARD.height/2,0,group.matrixWorld);
    const width=Math.max(W*.035,Math.hypot(a.x-b.x,a.y-b.y)),lift=(1-landing)*22;
    // The shared high left key sends the soft footprint down and right.
    const direction=-light.position.x/light.position.y;
    const x=(a.x+b.x)/2+width*direction*.25,y=Math.max(a.y,b.y)+(middle?21:9)+lift;
    fc.save();fc.translate(x,y);fc.rotate(-.065);fc.scale(width*(.65+.18*(1-landing)),(10+width*.035+lift*.4)*(middle?1.12:1));
    const gradient=fc.createRadialGradient(0,0,0,0,0,1);gradient.addColorStop(0,`rgba(56,40,27,${alpha*(.12+.10*landing)})`);gradient.addColorStop(.35,`rgba(56,40,27,${alpha*.08})`);gradient.addColorStop(1,'rgba(56,40,27,0)');fc.fillStyle=gradient;fc.beginPath();fc.arc(0,0,1,0,Math.PI*2);fc.fill();fc.restore();
  }
  function update(s){
    const active=s>4.05&&s<score.INTRO.exitEnd;
    floor.hidden=dust.hidden=!active;
    if(!active){last=-1;return;}
    const q=score.portrait(s,W,H),reveal=q.color;
    // The shared portrait score restores color evenly as pigment arrives.
    // No spatial mask or separate opacity override: the photograph stays whole.
    if(s===last)return;last=s;
    for(const ctx of [fc,dc]){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);}
    const exit=1-score.phase(s,score.INTRO.holdEnd,score.INTRO.exitEnd);
    score.FOCUS.forEach((index,i)=>{const start=[4.05,5.85,7.25][i],end=[5.30,6.65,8.05][i];if(cards[index].group.visible)shadow(cards[index].group,score.phase(s,start,start+.25)*exit*(i===1?.8:1),score.phase(s,end-.5,end),i===1);});
    let count=0;
    for(const g of grains){
      const t=(s-g.birth)/(g.arrival-g.birth);if(t<=0||t>=1.15)continue;
      const u=Math.min(1,t),ease=u*u*(3-2*u),curl=Math.sin(u*Math.PI),portraitW=q.height*2/3;
      const target={x:q.x+(g.target.x-.5)*portraitW,y:q.y+(g.target.y-.5)*q.height};
      const x=score.mix(g.from.x,target.x,ease)+Math.sin(u*7+g.seed)*curl*(W<=760?12:30);
      const y=score.mix(g.from.y,target.y,ease)-curl*(18+g.r*42)+Math.cos(u*8+g.seed)*curl*14;
      const alpha=score.phase(t,0,.13)*(1-score.phase(t,.70,1.15));
      // Independent tone and size keep dark accents scattered among fine grains.
      dc.globalAlpha=alpha*(.32+g.strength*.25+(g.tone>.80?.24:g.tone>.28?.08:0));
      dc.fillStyle=g.tone>.80?'#91432b':g.tone>.58?'#b45b34':g.tone>.28?'#c98048':'#dfa66e';
      const r=(.6+g.r*1.25)*(W<=760?.8:1)*(1-.4*ease);
      dc.beginPath();dc.arc(x,y,r,0,Math.PI*2);dc.fill();count++;
    }
    dc.globalAlpha=1;dust.dataset.particles=String(count);dust.dataset.reveal=reveal.toFixed(3);
  }
  resize();return{resize,update,dispose(){floor.remove();dust.remove();}};
};

  