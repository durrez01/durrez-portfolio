
    /* A measured asset counter and a shared-element monogram flight. Animation stays
   on the existing GSAP ticker; reduced motion skips both flight and card drops. */
window.createStudioLoader=function({inspectLoading}={}){
  const body=document.body,root=document.querySelector('#studio-loader');
  const mark=root.querySelector('.loader-mark'),count=root.querySelector('[data-count]');
  const meter=root.querySelector('[role=progressbar]');
  const copy=root.querySelector('.loader-progress'),veil=root.querySelector('.loader-veil');
  const target=document.querySelector('.wordmark .monogram');
  // The headline overlaps the flight; the identity types name first, then role.
  const BEATS={flight:.04,dock:1.02,headline:.12,headlineEnd:1.40,name:1.02,role:1.40};
  // The count climbs at a fixed pace per unit so every number from 0 to 100 is
  // painted; a floor keeps tiny credits from snapping.
  const COUNTER={perStep:.03,minDuration:.35};
  const MONOGRAM={lettersEnd:1.18,dotStart:1.24,dotDuration:.34,settleHold:.18};
  // Two quiet crosses turn one at a time into n and v. The orange dot is held
  // back as a distinct final beat so every part of the identity is readable.
  const initials=document.createElement('span');initials.className='loader-initials';
  const finalGlyphs=[...mark.firstChild.textContent];
  const glyphs=finalGlyphs.map(letter=>{
    const glyph=document.createElement('span'),cross=document.createElement('span'),final=document.createElement('span');
    glyph.className='loader-glyph';cross.className='loader-cross';final.className='loader-letter';cross.textContent='×';final.textContent=letter;
    glyph.append(cross,final);initials.append(glyph);return{cross,final};
  });
  mark.firstChild.replaceWith(initials);
  const dot=mark.lastElementChild;dot.classList.add('loader-dot');
  const monogram=gsap.timeline({paused:true});
  glyphs.forEach(({cross,final})=>{gsap.set(cross,{opacity:.28,y:2,rotationY:0,rotationZ:0});gsap.set(final,{opacity:0,y:2,rotationY:0,rotationZ:0});});
  gsap.set(dot,{opacity:0,scale:.25,y:3});
  glyphs.forEach(({cross,final},i)=>{const start=.04+i*.58,direction=i%2?1:-1;
    monogram.to(cross,{opacity:1,rotationY:direction*88,scaleX:.18,duration:.22,ease:'power2.in'},start)
      .set(cross,{opacity:0},start+.22)
      .set(final,{opacity:1,rotationY:-direction*88,scaleX:.18},start+.22)
      .to(final,{rotationY:0,rotationZ:0,scaleX:1,y:0,duration:.34,ease:'power3.out'},start+.22);
  });
  monogram.to(dot,{opacity:1,scale:1,y:0,duration:MONOGRAM.dotDuration,ease:'power3.out'},MONOGRAM.dotStart);
  monogram.pause(0);gsap.set(mark,{opacity:1});
  function typeLine(el){
    const text=el.textContent;el.setAttribute('aria-label',text);
    const letters=[...text].map(char=>{const span=document.createElement('span');span.textContent=char;span.setAttribute('aria-hidden','true');span.style.opacity=0;return span;});
    el.replaceChildren(...letters);return{letters,n:0};
  }
  const name=typeLine(document.querySelector('.brand-lockup .artist-name'));
  const role=typeLine(document.querySelector('.brand-lockup .artist-role'));
  function type(line){const visible=Math.floor(line.n);line.letters.forEach((span,i)=>span.style.opacity=i<visible?1:0);}
  const sections=[document.querySelector('.site-header'),document.querySelector('main'),document.querySelector('.site-footer')].filter(Boolean);
  const progress={n:0},flight={t:0};let total=0,closed=false,stamped=false,timeline,done,rect,from,endScale=40/84;
  sections.forEach(el=>el.inert=true);body.classList.add('booting');
  function paint(){
    const complete=progress.n>=100,n=complete?100:Math.floor(progress.n);
    count.textContent=String(n);meter.setAttribute('aria-valuenow',n);
    if(!complete){stamped=false;monogram.pause(MONOGRAM.lettersEnd*progress.n/100);}
    else if(!stamped){stamped=true;monogram.play(MONOGRAM.lettersEnd);}
  }
  function credit(amount){if(closed)return 0;total=Math.min(100,total+amount);const duration=Math.max(COUNTER.minDuration,(total-progress.n)*COUNTER.perStep);gsap.to(progress,{n:total,duration,ease:'none',overwrite:true,onUpdate:paint,onComplete:paint});return duration;}
  function measure(){rect=target.getBoundingClientRect();from={x:innerWidth/2,y:innerHeight/2-18};endScale=rect.width/mark.offsetWidth;}
  function place(){const t=flight.t,scale=1+(endScale-1)*t;mark.style.transform=`translate3d(${from.x+(rect.x+rect.width/2-from.x)*t}px,${from.y+(rect.y+rect.height/2-from.y)*t}px,0) translate(-50%,-50%) scale(${scale})`;}
  function finish(){if(closed)return;closed=true;timeline?.kill();monogram.kill();gsap.killTweensOf(progress);for(const line of [name,role]){line.n=line.letters.length;type(line);}root.hidden=true;body.classList.remove('booting');body.dataset.boot='done';sections.forEach(el=>el.inert=false);removeEventListener('resize',onResize);done?.();}
  function onResize(){if(body.dataset.boot==='arriving'){measure();place();}}
  addEventListener('resize',onResize);
  async function reveal({drop,complete,deep=false,inspectTimeline}){
    // The renderer's first uploaded frame is the final readiness milestone.
    const countTail=credit(100-total);
    // Crosses and counter stay centred until N, V and the orange dot have all
    // resolved. A short still hold makes the completed identity unmistakable;
    // only that final mark is allowed to begin the shared-element flight.
    const resolveDuration=monogram.duration()-MONOGRAM.lettersEnd;
    await new Promise(resolve=>gsap.delayedCall(countTail+resolveDuration,resolve));
    if(closed)return;
    monogram.pause(monogram.duration());
    root.dataset.phase='resolved';
    await new Promise(resolve=>gsap.delayedCall(MONOGRAM.settleHold,resolve));
    if(closed)return;
    body.dataset.loaderReady='true';
    body.dataset.boot='arriving';
    const clock={time:0};measure();place();
    return new Promise(resolve=>{
      done=()=>{complete();resolve();};
      timeline=gsap.timeline({onComplete:finish});
      timeline.to(copy,{opacity:0,y:-5,duration:.24,ease:'power2.out'},0);
      timeline.to(veil,{opacity:0,duration:.36,ease:'power2.inOut'},.02);
      timeline.to(flight,{t:1,duration:BEATS.dock-BEATS.flight,ease:'expo.inOut',onUpdate:place},BEATS.flight);
      timeline.to(body,{'--headline-wipe':'108%',duration:BEATS.headlineEnd-BEATS.headline,ease:'power2.inOut'},BEATS.headline);
      timeline.to(body,{'--headline-alpha':1,duration:1.20,ease:'power2.out'},BEATS.headline);
      timeline.to(body,{'--boot-ui':1,duration:.55,ease:'power2.out'},.92);
      timeline.to(body,{'--boot-meta':1,duration:.65,ease:'power2.out'},1.56);
      timeline.call(()=>body.dataset.logoDocked='true',null,BEATS.dock);
      timeline.set(mark,{opacity:0},BEATS.dock);
      timeline.to(name,{n:name.letters.length,duration:.54,ease:'none',onUpdate:()=>type(name)},BEATS.name);
      timeline.to(role,{n:role.letters.length,duration:.64,ease:'none',onUpdate:()=>type(role)},BEATS.role);
      timeline.addLabel('mark-docked',BEATS.dock).addLabel('headline-complete',BEATS.headlineEnd);
      if(!deep)timeline.to(clock,{time:StudioArrival.DURATION,duration:StudioArrival.DURATION,ease:'none',onUpdate:()=>drop(clock.time)},BEATS.headlineEnd);
      // Optional manual timeline inspection, used only by qa/opening-preview.html.
      inspectTimeline?.(timeline);
    });
  }
  // Visible QA controls can scrub the actual loading score, without another animation.
  inspectLoading?.({timeline:monogram,timing:{...COUNTER,...MONOGRAM},setProgress(value){gsap.killTweensOf(progress);progress.n=Math.max(0,Math.min(100,value));paint();if(progress.n<100)monogram.pause(MONOGRAM.lettersEnd*progress.n/100);}});
  return{credit,reveal,finish};
};

  