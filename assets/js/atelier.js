
    /* Three distinct compositions, choreographed from the same reversible score. */
(()=>{
 'use strict';
 const root=document.querySelector('#practice.atelier');if(!root)return;
 const S=window.StudioScore,copies=[...root.querySelectorAll('[data-atelier-copy]')],buttons=[...root.querySelectorAll('[data-practice]')];
 const notes=['Load reveals design','Ingest. Buffer. Serve.','From backend to operator'];
 const gestures=['Scroll to find the load','Scroll to raise the throughput','Move to explore'];
 let step=-1,currentScore=0,currentAlpha=[0,0,0];
 const titles=copies.map(article=>{
  const heading=article.querySelector('h3'),label=heading.textContent,word=label.replace(/\.$/,'');
  heading.setAttribute('aria-label',label);
  const visual=document.createElement('span');visual.className='atelier-type';visual.setAttribute('aria-hidden','true');
  const letters=[...word].map(letter=>{const node=document.createElement('span');node.className='atelier-letter';node.textContent=letter;node.style.visibility='hidden';visual.append(node);return node;});
  const dot=document.createElement('span');dot.className='atelier-dot';dot.textContent='.';dot.style.opacity='0';visual.append(dot);heading.replaceChildren(visual);
  return{letters,dot,start:null,count:0};
 });
 function tick(time){
  const present=S.presentation(currentScore).practice;
  titles.forEach((title,i)=>{
   if(present<.01||currentAlpha[i]<.05){
    if(title.start!==null){title.letters.forEach(letter=>letter.style.visibility='hidden');title.dot.style.opacity='0';title.start=null;title.count=0;}
    return;
   }
   if(title.start===null){if(present<.6||currentAlpha[i]<.35)return;title.start=time;}
   const elapsed=time-title.start,count=Math.min(title.letters.length,Math.max(0,Math.floor((elapsed-.08)/.072)+1));
   if(count!==title.count){title.letters.forEach((letter,k)=>letter.style.visibility=k<count?'visible':'hidden');title.count=count;}
   const finish=.08+title.letters.length*.072+.10;
   title.dot.style.opacity=String(S.phase(elapsed,finish,finish+.14));
  });
 }
 function setStep(next){
  if(next===step)return;step=next;root.dataset.atelierStep=String(next);
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===next)));
  root.querySelector('.atelier-note').textContent=notes[next];root.querySelector('.atelier-gesture').textContent=gestures[next];
 }
 function set(s){
  currentScore=s;const {phase}=S;
  // Clear the departing text before cards cross its space. Reveal after settling.
  const alpha=[1-phase(s,11.05,11.32),phase(s,11.96,12.20)*(1-phase(s,13.1,13.35)),phase(s,13.96,14.24)];
  currentAlpha=alpha;
  copies.forEach((article,i)=>{
   article.style.opacity=alpha[i];article.style.transform=i===2?`translate3d(-50%,${(1-alpha[i])*14}px,0)`:`translate3d(${i===0?-(1-alpha[i])*65:(1-alpha[i])*50}px,0,0)`;
   article.setAttribute('aria-hidden',String(alpha[i]<.1));
  });
  const play=root.querySelector('.atelier-play');play.style.opacity=alpha[2];play.style.visibility=alpha[2]>.1?'visible':'hidden';
  setStep(S.presentation(s).detail);
 }
 root.querySelector('.atelier-play').addEventListener('click',()=>window.dispatchEvent(new Event('atelier-turn')));
 set(0);window.StudioAtelier=Object.freeze({set,setStep,tick});
})();

  