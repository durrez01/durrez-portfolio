
    /* ThreeUI Animated Top Dock — Sable proximity controller, adapted for the
   portfolio's three-link navigation and fixed centre track. */
(()=>{
  const root=document.querySelector('.sable-dock');
  if(!root)return;

  const options={proximity:112,spring:.19,damping:.7,widthGrowth:12,heightGrowth:9,drop:2.4};
  const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
  const precisionQuery=matchMedia('(hover:hover) and (pointer:fine)');
  const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
  const items=[...root.querySelectorAll('[data-dock-item]')].map(element=>({
    element,baseWidth:0,baseHeight:0,value:0,velocity:0,target:0
  }));

  let enabled=false,pointerActive=false,dirty=false,frame=0,released=false;
  const canAnimate=()=>!reducedQuery.matches&&root.clientWidth>0&&innerWidth>760&&precisionQuery.matches;

  function applyLayout(){
    for(const state of items){
      const value=clamp(state.value,0,1.08);
      const extraWidth=Math.min(options.widthGrowth,state.baseWidth*.24);
      state.element.style.width=`${(state.baseWidth+extraWidth*value).toFixed(2)}px`;
      state.element.style.height=`${(state.baseHeight+options.heightGrowth*value).toFixed(2)}px`;
      state.element.style.transform=`translateY(${(value*options.drop).toFixed(2)}px)`;
    }
  }

  function measure(){
    root.style.width='';
    for(const state of items){
      state.element.style.width='';
      state.element.style.height='';
      state.element.style.transform='';
      state.element.dataset.dockNear='false';
    }
    enabled=canAnimate();
    for(const state of items){
      const rect=state.element.getBoundingClientRect();
      state.baseWidth=rect.width;
      state.baseHeight=rect.height;
      state.value=0;
      state.velocity=0;
      state.target=0;
    }
    pointerActive=false;
    dirty=false;
    root.style.width=`${root.getBoundingClientRect().width.toFixed(2)}px`;
    root.dataset.dockState=enabled?'idle':'static';
    root.dataset.dockMax='0.00';
  }

  let lastRects=null;
  function setTargets(clientX){
    if(!enabled)return;
    const rects=items.map(state=>state.element.getBoundingClientRect());
    lastRects=rects;
    items.forEach((state,index)=>{
      const rect=rects[index];
      const proximity=clamp(1-Math.abs(clientX-(rect.left+rect.width*.5))/options.proximity,0,1);
      const influence=proximity*proximity*(3-2*proximity);
      state.target=influence;
      state.element.dataset.dockNear=influence>.08?'true':'false';
    });
    pointerActive=true;
    dirty=true;wake();
    root.dataset.dockState='active';
  }

  function focusItem(item){
    if(!enabled)return;
    const index=items.findIndex(state=>state.element===item);
    if(index<0)return;
    items.forEach((state,itemIndex)=>{
      state.target=itemIndex===index?1:(Math.abs(itemIndex-index)===1 ? .24 : 0);
      state.element.dataset.dockNear=state.target>.08?'true':'false';
    });
    pointerActive=false;
    dirty=true;wake();
    root.dataset.dockState='focus';
  }

  function reset(){
    pointerActive=false;
    dirty=true;wake();
    items.forEach(state=>{state.target=0;state.element.dataset.dockNear='false';});
  }

  let running=false;
  function draw(){
    if(enabled&&dirty){
      let moving=false,maxValue=0;
      for(const state of items){
        state.velocity+=(state.target-state.value)*options.spring;
        state.velocity*=options.damping;
        state.value+=state.velocity;
        if(Math.abs(state.target-state.value)<.001&&Math.abs(state.velocity)<.001){state.value=state.target;state.velocity=0;}else moving=true;
        maxValue=Math.max(maxValue,clamp(state.value,0,1.08));
      }
      applyLayout();
      root.dataset.dockMax=maxValue.toFixed(2);
      if(!moving){dirty=false;if(items.every(state=>state.target===0))root.dataset.dockState='idle';}
    }
    // The loop sleeps once settled and wakes on the next interaction.
    if(enabled&&dirty)frame=requestAnimationFrame(draw);else running=false;
  }
  function wake(){if(!running){running=true;frame=requestAnimationFrame(draw);}}

  const onPointerMove=event=>setTargets(event.clientX);
  const onWindowPointerMove=event=>{
    if(!pointerActive)return;
    const rootRect=root.getBoundingClientRect();
    const itemRects=lastRects||[];
    const bottom=Math.max(rootRect.bottom,...itemRects.map(rect=>rect.bottom));
    if(event.clientX<rootRect.left||event.clientX>rootRect.right||event.clientY<rootRect.top||event.clientY>bottom)reset();
  };
  const onFocusIn=event=>{const item=event.target.closest?.('[data-dock-item]');if(item)focusItem(item);};
  const onFocusOut=()=>requestAnimationFrame(()=>{if(!root.contains(document.activeElement))reset();});

  const observer=new ResizeObserver(measure);
  observer.observe(root.parentElement||root);
  root.addEventListener('pointermove',onPointerMove,{passive:true});
  root.addEventListener('pointerleave',reset);
  root.addEventListener('focusin',onFocusIn);
  root.addEventListener('focusout',onFocusOut);
  root.addEventListener('click',reset);
  addEventListener('pointermove',onWindowPointerMove,{passive:true});
  reducedQuery.addEventListener('change',measure);
  precisionQuery.addEventListener('change',measure);
  document.fonts?.ready.then(()=>{if(!released)measure();});
  measure();

  addEventListener('pagehide',()=>{
    released=true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    removeEventListener('pointermove',onWindowPointerMove);
    reducedQuery.removeEventListener('change',measure);
    precisionQuery.removeEventListener('change',measure);
  },{once:true});
})();

  