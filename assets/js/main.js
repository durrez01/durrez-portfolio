
    /* One clock: Lenis → ScrollTrigger → DOM and the existing eight Three.js cards.
 * Scroll durations live in score.js. Edit identity and copy in projects.js. */
(() => {
'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],S=window.StudioScore,projects=window.PORTFOLIO,artist=window.ARTIST;
const num=i=>String(i+1).padStart(2,'0');
let preference;try{preference=localStorage.getItem('studio-v11-motion');}catch{}
const media=matchMedia('(prefers-reduced-motion: reduce)');
let reduced=preference?preference==='reduced':media.matches;
const bootStatic=preference==='full'?false:preference==='reduced'?true:(media.matches||innerWidth<=760);
let entranceDust=null,entranceEcho=null;
let gallery=null,lenis=null,trigger=null,active=0,projectIndex=0,score=0,lastDetail=-1,lastChapter='',ready=false,staticMode=bootStatic,returnFocus=null,savedScroll=0;
const portal=$('#studio-portal');let portalSize={x:0,y:0,r:0,cover:0};
// Measure at font load / resize only. The punctuation is the vanishing point
// for the perspective portal, so the camera push and orange field share an origin.
function measurePortal(){const stage=$('#stage').getBoundingClientRect();stageSize={w:stage.width,h:stage.height};const dot=$('#entrance-dot').getBoundingClientRect();const x=dot.x+dot.width/2-stage.x,y=dot.y+dot.height/2-stage.y;portalSize={x,y,r:dot.width/2,cover:Math.hypot(Math.max(x,stage.width-x),Math.max(y,stage.height-y))+2};}
const paths=projects.map((_,i)=>noaAsset('work/'+num(i)+'.webp'));
const sources=paths;
const practicePaths=Array.from({length:10},(_,i)=>noaAsset('practice/'+num(i)+'.webp'));
const extraStudies=[
 ['The Last Hundred Milliseconds','LOW-LATENCY DELIVERY','WebRTC, where a stream becomes something you can react to.'],
 ['Documents, Kept Honest','DOCUMENT MODELLING','Mongoose schemas, references and indexes on MongoDB Atlas.'],
 ['Memory In Front Of The Database','CACHING AND QUEUES','Redis holds the expensive answers and absorbs the bursts.'],
 ['Shapes For The Data','RELATIONAL MODELLING','PostgreSQL schemas designed rather than accumulated.'],
 ['Same Box Everywhere','CONTAINERS','Docker makes the laptop and the instance agree.'],
 ['Ship Without Stopping','PIPELINE AUTOMATION','GitLab CI builds, tests and promotes on its own.'],
 ['A Contract Anyone Can Read','API DOCUMENTATION','Swagger and OpenAPI, published with the service.'],
 ['Every Tuesday, Forever','SCHEDULING RECURRENCE','Daily, weekly and custom patterns that stay correct.']
].map(([title,category,short],i)=>({id:'tunnel-'+i,title,category,short,alt:short,description:short,detail:'',year:'2026',...window.STUDY_NOTES[i+8]}));
const studyProjects=[...projects,...extraStudies],studyPaths=[...paths,...practicePaths.slice(0,8)];

const biographyActionSource=noaAsset('practice/08.webp');
const motionSources={};// still images only; no motion files ship with this build
$$('[data-artist-name],.artist-name').forEach(e=>e.textContent=artist.name);
$$('.monogram').forEach(el=>el.firstChild.nodeValue=artist.initials);
window.BIOGRAPHY.forEach(note=>{
 const article=document.createElement('article');article.className='bio-note bio-note--'+note.layout;
 const label=document.createElement('p');label.className='micro';label.textContent=note.label;
 const heading=document.createElement('h3');heading.textContent=note.title.join(' ');
 const lead=document.createElement(note.layout==='manifesto'?'blockquote':'p');lead.className='bio-lead';lead.textContent=note.lead;
 const body=document.createElement('p');body.textContent=note.body;
 const detail=document.createElement('div');detail.className='bio-detail';
 if(note.specimen){const from=document.createElement('span'),to=document.createElement('strong');from.textContent=note.specimen.from;to.textContent='↳ '+note.specimen.to;detail.append(from,to);}
 if(note.signature){const signed=document.createElement('cite');signed.textContent=note.signature;detail.append(signed);}
 if(note.mediums){note.mediums.forEach(word=>{const medium=document.createElement('span');medium.textContent=word;detail.append(medium);});}
 const foot=document.createElement('p');foot.className='micro';foot.textContent=note.foot;
 article.append(label,heading,lead,body,detail,foot);$('#artist-reading').append(article);
});
if(!staticMode)$('#top').append($('#artist-reading'));
$('.wordmark').setAttribute('aria-label',artist.name+', home');
document.title=artist.name+' — Software Engineer / Real-time media and backend systems';
$$('[data-image]').forEach(e=>e.src=paths[+e.dataset.image]);
$$('.static-practice img').forEach((e,i)=>{e.src=practicePaths[i*2];e.alt=['Live stream sockets across five lanes','Cached records arranged in rings','Layered service planes in perspective'][i];});
const workButtons=projects.map((p,i)=>{const b=document.createElement('button');b.type='button';b.dataset.project=i;b.dataset.title=p.title;b.setAttribute('aria-label','Open '+p.title+', '+p.category);b.textContent=p.title;$('#work-hitareas').append(b);return b;});
studyProjects.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.dataset.project=i;b.setAttribute('aria-label','Open '+p.title);const img=document.createElement('img');img.src=studyPaths[i];img.alt=p.alt;img.loading='lazy';const label=document.createElement('span');label.textContent=num(i)+' / '+p.title;b.append(img,label);$('#static-works').append(b);});
function updateCurrent(i){active=i;$('#current-number').textContent=num(i);$('#current-category').textContent=projects[i].category;$('#current-title').textContent=projects[i].title;$('#open-current').setAttribute('aria-label','View '+projects[i].title);document.body.dataset.current=num(i);}
updateCurrent(window.StudioArrival.FIRST);
function positionHitAreas(){const W=$('#stage').clientWidth,H=$('#stage').clientHeight;S.workRects(W,H).forEach((r,i)=>Object.assign(workButtons[i].style,{left:r.cx+'px',top:r.cy+'px',width:r.width+'px',height:r.height+'px'}));}
function setDetail(i){if(i===lastDetail)return;lastDetail=i;window.StudioAtelier?.setStep(i);$('#practice').dataset.step=String(i);}
const outlineGroup=$('#portrait-selected-lines'),portraitSoft=$('#portrait-soft'),portraitContrast=$('#portrait-contrast');
const portraitFigure=$('#portrait-figure'),portraitImage=$('#maker-portrait'),portraitDrawing=$('#portrait-drawing'),drawingTip=$('#drawing-tip'),portraitCaption=$('#portrait-caption'),portraitSignature=$('#portrait-signature'),portraitQuote=$('#portrait-quote'),signature=$('#portal-signature');
const artistGuide=$('#artist-guide'),worksGuide=$('#works-guide'),guideImages=$$('.section-guide img');
let drawingPaths=[],pathLengths=[],strokeSpans=[],pathPoints=[],portraitDissolve=null;
function measurePortraitPaths(){
 drawingPaths=[...outlineGroup.querySelectorAll('.portrait-selected')];
 pathLengths=drawingPaths.map(p=>p.getTotalLength());
 pathPoints=drawingPaths.map((p,i)=>Array.from({length:65},(_,k)=>{const pt=p.getPointAtLength(pathLengths[i]*k/64);return[pt.x,pt.y];}));
 const total=pathLengths.reduce((sum,length)=>sum+length,0)||1;let cursor=0;
 strokeSpans=pathLengths.map(length=>{const start=cursor/total;cursor+=length;return[start,cursor/total];});
}
measurePortraitPaths();
async function loadPortraitContour(){
 try{
  const response=await fetch(noaAsset('portrait/contour.svg'));
  if(!response.ok)throw new Error('Contour request failed');
  const source=new DOMParser().parseFromString(await response.text(),'image/svg+xml');
  const paths=[...source.querySelectorAll('path')];if(!paths.length)throw new Error('Contour is empty');
  outlineGroup.replaceChildren(...paths.map(path=>{const node=document.importNode(path,true);node.removeAttribute('id');node.setAttribute('class','portrait-selected');node.setAttribute('pathLength','1');return node;}));
  measurePortraitPaths();
 }catch(error){console.warn('Studio preview: using the embedded portrait contour. '+error.message);}
}
let stageSize={w:innerWidth,h:innerHeight};
const tint=(a,b,t)=>'rgb('+a.map((v,i)=>Math.round(S.mix(v,b[i],t))).join(',')+')';
function syncPortrait(){
 const {w:W,h:H}=stageSize,q=S.portrait(score,W,H);
 portal.style.backgroundColor=tint([200,85,43],[239,235,227],q.paper);
 const ink=tint([239,235,227],[82,76,67],S.phase(score,2.5,3.3));
 signature.style.color=tint([239,235,227],[34,35,31],q.paper);
 signature.style.opacity=q.titleAlpha;signature.style.transform=`translate3d(-50%,${q.titleY}px,0) translateY(-50%)`;
 portraitFigure.style.transform=`translate3d(${q.x}px,${q.y}px,0) translate(-50%,-50%) scale(${q.height/1536})`;portraitFigure.style.opacity=q.alpha;
 artistGuide.style.opacity=q.pointingAlpha;artistGuide.style.transform=`translate3d(-50%,${q.pointingOffset}px,0)`;
 // Shared image geometry keeps the eyes and silhouette perfectly registered.
 // Each incoming card adds a tonal layer; reversing scroll removes it again.
 portraitSoft.style.opacity=q.soft;
 portraitContrast.style.opacity=q.contrast;
 portraitImage.style.opacity=q.color;
 signature.firstElementChild.style.opacity=signature.lastElementChild.style.opacity=1-S.phase(score,2.25,2.65);
 portraitDrawing.style.color=ink;outlineGroup.style.opacity=q.outlineAlpha*.96;
 let activePath=-1,local=0;
 drawingPaths.forEach((path,i)=>{const [a,b]=strokeSpans[i],t=S.clamp((q.draw-a)/(b-a));path.style.strokeDashoffset=1-t;if(q.draw>=a&&q.draw<=b){activePath=i;local=t;}});
 if(activePath>=0&&q.draw>0&&q.draw<1){const pts=pathPoints[activePath],f=local*64,k=Math.min(63,Math.floor(f)),t=f-k,p={x:pts[k][0]+(pts[k+1][0]-pts[k][0])*t,y:pts[k][1]+(pts[k+1][1]-pts[k][1])*t};drawingTip.setAttribute('transform',`translate(${p.x} ${p.y})`);drawingTip.style.opacity=Math.min(.7,local*12,(1-local)*12);}else drawingTip.style.opacity=0;
 portraitCaption.style.opacity=q.captionAlpha;portraitCaption.style.transform=`translate3d(${q.captionX}px,${q.captionY}px,0) translateX(-50%)`;
 portraitSignature.style.opacity=q.signatureWrite;portraitSignature.style.clipPath=`inset(0 ${(1-q.signatureWrite)*100}% 0 0)`;
 portraitQuote.style.opacity=q.quoteAlpha;portraitQuote.style.transform=`translate3d(0,${(1-q.quoteAlpha)*7}px,0)`;
 galleryCanvasEl.style.zIndex=score>=2.2&&score<S.INTRO.exitEnd?'18':'5';
 document.body.dataset.portraitPhase=score<2.25?'name':score<S.INTRO.cardStart?'outline':score<4.92?'soft-monochrome':score<S.INTRO.holdEnd?'color':'complete';
 document.body.dataset.bioCard=score<S.INTRO.secondStart?'1':score<S.INTRO.thirdStart?'2':'3';
 portraitDissolve?.update(score,q);
}
function syncGuides(p){
 window.StudioAtelier?.set(score,p.practice);
 const worksVisible=p.works*S.phase(score,16.05,16.5);
 worksGuide.style.opacity=worksVisible;worksGuide.style.visibility=worksVisible>.002?'visible':'hidden';
 worksGuide.firstElementChild.style.transform=`translate3d(0,${(1-worksVisible)*32}px,0) scale(${.96+.04*worksVisible})`;
}
function sync(){if(staticMode)return;const p=S.presentation(score);gallery?.setScroll(score);
 for(const name of ['hero','entrance','artist','practice','works']){const panel=panelByName[name],alpha=p[name];panel.style.opacity=alpha;panel.style.visibility=alpha>.002?'visible':'hidden';const interactive=p.chapter===name&&alpha>.1;panel.inert=!interactive;panel.setAttribute('aria-hidden',String(!interactive));}
 const entrance=$('#entrance'),canvas=$('#gallery-canvas'),dive=p.portalDive;
 if(entranceDust)entranceDust.update(score);else $('#entrance-title').style.opacity=p.titleFade;
 entrance.style.transformOrigin=`${portalSize.x}px ${portalSize.y}px`;
 entrance.style.transform=`translateZ(0) scale(${1+dive*dive*2})`;
 // Keep the letter edges sharp throughout the orange-dot camera move.
 entrance.style.filter='none';
 canvas.style.transformOrigin=`${portalSize.x}px ${portalSize.y}px`;
 canvas.style.transform=`translateZ(0) scale(${1+dive*dive*1.2})`;
 // Geometric radius growth reads as forward camera travel: the dot holds at
 // first, then accelerates past the viewport as its vanishing point approaches.
 const ratio=Math.max(1,portalSize.cover/Math.max(1,portalSize.r));
 const radius=portalSize.r*Math.pow(ratio,Math.pow(p.portalGrow,1.55));
 portal.style.clipPath=`circle(${radius}px at ${portalSize.x}px ${portalSize.y}px)`;
 portal.style.opacity=p.portalAlpha;portal.style.visibility=p.portalAlpha>0?'visible':'hidden';
 syncPortrait();syncGuides(p);syncStudies();
 // Let the supporting lines emerge gently as the cards part; reverse with scroll.
 const entranceCaptionReveal=S.phase(score,.64,1.04);
 entranceOverline.style.opacity=entranceCaptionReveal;
 entranceFoot.style.opacity=entranceCaptionReveal;
 setDetail(p.detail);
 if(lastChapter!==p.chapter){lastChapter=p.chapter;document.body.dataset.chapter=p.chapter;$('#stage').style.cursor=p.chapter==='hero'?'grab':'default';$$('.site-header nav a').forEach(a=>{if(a.dataset.go===p.chapter)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}
}
// DOM follows the same scroll score as the physical study cards.
const studyRail=$('.study-rail'),studyHeading=$('.works-heading'),studyFinale=$('.study-finale'),siteFooter=$('.site-footer'),worksKicker=$('#works .section-kicker'),worksPanel=$('#works'),revealWords=$$('.reveal-word'),entranceOverline=$('.entrance-overline'),entranceFoot=$('.entrance-foot'),galleryCanvasEl=$('#gallery-canvas'),stageEl=$('#stage'),panelByName=Object.fromEntries(['hero','entrance','artist','practice','works'].map(n=>[n,$('#'+n)]));
let currentStudy=-1;
function syncStudies(){
 const i=S.studyIndex(score),end=S.phase(score,S.STUDIES.contactStart,S.STUDIES.contactEnd),enter=S.phase(score,16.46,16.9),dive=S.phase(score,17.05,19.35),intro=enter*(1-S.phase(score,17.7,19.35));
 // Perspective approach and disappearance belong to the same scroll gesture.
 studyHeading.style.opacity=intro;studyHeading.style.transform=`translateY(${18*(1-enter)-12*dive}px) scale(${1/(1-.43*dive)})`;
 revealWords.forEach((word,j)=>{const t=S.phase(score,16.48+j*.14,17.06+j*.14);word.style.transform=`translateY(${(1-t)*112}%)`;word.style.opacity=t;});
 studyHeading.querySelector('p').style.opacity=S.phase(score,17.0,17.5)*(1-S.phase(score,17.7,18.6));
 const rail=S.studyRailAlpha(score,stageSize.w,stageSize.h);
 studyRail.style.opacity=rail;studyRail.style.visibility=rail>.002?'visible':'hidden';studyRail.inert=rail<.1;studyRail.setAttribute('aria-hidden',String(rail<.1));
 worksPanel.style.setProperty('--finale-progress',end);
 studyFinale.style.opacity=end;studyFinale.style.transform=`translate(${24*(1-end)}px,${10*(1-end)}px)`;studyFinale.inert=end<.8;studyFinale.setAttribute('aria-hidden',String(end<.8));
 if(score>=23)bootContactFrame();
 const footer=S.phase(score,25.6,26.6);
 siteFooter.style.setProperty('--closing-progress',footer);
 for(const node of [siteFooter]){node.inert=footer<.5;node.setAttribute('aria-hidden',String(footer<.5));node.style.visibility=footer>.002?'visible':'hidden';}
 worksKicker.style.opacity=1-end;
 if(i!==currentStudy){currentStudy=i;$('#study-number').textContent=num(S.studyPosition(score));$('#study-title').textContent=studyProjects[i].title;$('#study-category').textContent=studyProjects[i].category;$('#study-open').setAttribute('aria-label','View '+studyProjects[i].title);$$('[data-study]').forEach((b,j)=>{b.setAttribute('aria-current',Number(b.dataset.study)===i?'true':'false');});}
}
$$('[data-study]').forEach(b=>b.addEventListener('click',()=>go('works',S.studyScore(S.TUNNEL_ORDER.indexOf(Number(b.dataset.study)))+.01)));
$('#study-open').addEventListener('click',e=>openProject(Math.max(0,currentStudy),e.currentTarget));
function go(name,value){
 const section=$('#'+(name==='hero'?'top':name));
 if(staticMode){section?.scrollIntoView({behavior:'auto'});return;}
 const y=(value??S.NAV[name]??0)*$('#stage').clientHeight;
 if(lenis)lenis.scrollTo(y,{duration:1.5,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});else scrollTo({top:y,behavior:'auto'});
}
$$('[data-go]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();go(a.dataset.go);try{history.replaceState(null,'',a.getAttribute('href'));}catch{}}));
$$('[data-practice]').forEach(b=>b.addEventListener('click',()=>go('practice',S.PRACTICE.targets[+b.dataset.practice])));
$('#previous').addEventListener('click',()=>gallery?.step(1));$('#next').addEventListener('click',()=>gallery?.step(-1));
function showDialog(dialog,invoker){if($$('dialog[open]').length)return;returnFocus=invoker||document.activeElement;savedScroll=scrollY;lenis?.stop();gallery?.setBlocked(true);document.body.dataset.modal='open';dialog.showModal();dialog.scrollTop=0;dialog.querySelector('.dialog-close').focus({preventScroll:true});}
function closeDialog(dialog){dialog.close();}
$$('dialog').forEach(d=>{d.querySelector('.dialog-close').addEventListener('click',()=>closeDialog(d));d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(d);}});d.addEventListener('close',()=>{window.StudioDetailTransition?.cancel();gallery?.setLiftedStudy(-1);$('#project-video').pause();document.body.dataset.modal='closed';gallery?.setBlocked(false);lenis?.start();if(Math.abs(scrollY-savedScroll)>1)lenis?lenis.scrollTo(savedScroll,{immediate:true}):scrollTo(0,savedScroll);if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});});
function fillProject(i,animateTitle=true){window.StudioDetailTransition?.cancel();projectIndex=(i+studyProjects.length)%studyProjects.length;const p=studyProjects[projectIndex],video=$('#project-video'),isMotion=Boolean(motionSources[p.id]);video.pause();video.hidden=!isMotion;$('#project-image').hidden=isMotion;$('#project-image').src=studyPaths[projectIndex];$('#project-image').alt=p.alt;if(isMotion){video.poster=studyPaths[projectIndex];video.setAttribute('aria-label',p.alt);if(video.getAttribute('src')!==motionSources[p.id])video.src=motionSources[p.id];video.loop=true;video.currentTime=0;if(!reduced)video.play().catch(()=>{});}$('#project-index').textContent=num(projectIndex)+' / 16';$('#project-category').textContent=p.category+' / '+p.year;window.renderStudyTitle($('#project-title'),p.title,reduced||!animateTitle);$('#project-short').textContent=p.short;$('#project-description').textContent=p.description;$('#project-detail').textContent=p.detail;window.renderStudyNotes($('#project-notes'),p);const dialog=$('#project-dialog');dialog.dataset.project=p.id;dialog.dataset.layout=p.layout;dialog.style.setProperty('--study-accent',p.accent);$('.project-copy').scrollTop=0;dialog.scrollTop=0;}
function openProject(i,invoker){
 if($$('dialog[open]').length)return;
 if(i>=8)deferredPrioritize?.('practice-'+(i-8));
 const origin=!reduced?gallery?.studyOrigin(i):null;
 fillProject(i,false);showDialog($('#project-dialog'),invoker);
 if(!reduced){if(origin)gallery?.setLiftedStudy(i);window.StudioDetailTransition.open({dialog:$('#project-dialog'),origin,src:studyPaths[i],title:studyProjects[i].title,onFinish:()=>gallery?.setLiftedStudy(-1)});}
}
$('#open-current').addEventListener('click',e=>openProject(active,e.currentTarget));
$$('[data-project]').forEach(b=>b.addEventListener('click',()=>openProject(+b.dataset.project,b)));
$('#project-prev').addEventListener('click',()=>fillProject(projectIndex-1));$('#project-next').addEventListener('click',()=>fillProject(projectIndex+1));
$$('[data-contact]').forEach(b=>b.addEventListener('click',()=>{if(artist.contactURL){location.href=artist.contactURL;return;}showDialog($('#contact-dialog'),b);}));
const liquidContactFrame=$('#liquid-contact-frame');
let contactFrameBooted=false;
// The finale's WebGL invitation only boots near the end of the story (or when
// it scrolls into view on the static page); before that the iframe is empty.
function bootContactFrame(){if(contactFrameBooted||!liquidContactFrame)return;contactFrameBooted=true;liquidContactFrame.srcdoc=liquidContactFrame.dataset.deferredSrcdoc||'';}
addEventListener('message',event=>{if(event.source!==liquidContactFrame?.contentWindow||event.data?.type!=='studio-contact')return;if(artist.contactURL){location.href=artist.contactURL;return;}showDialog($('#contact-dialog'),liquidContactFrame);});
const CONTACT_ENDPOINT='/api/contact',CONTACT_EMAIL='durrezahmed01@gmail.com';
$('#brief-form').addEventListener('submit',async e=>{e.preventDefault();const form=$('#brief-form'),status=$('#brief-status'),button=form.querySelector('button[type=submit]');const name=$('#brief-name').value.trim(),email=$('#brief-email').value.trim(),message=$('#brief-idea').value.trim(),company=$('#brief-company').value;if(!message||!email)return;button.disabled=true;status.textContent='Sending…';try{const res=await fetch(CONTACT_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,message,company})});if(!res.ok)throw new Error('send failed: '+res.status);form.dataset.saved='true';status.textContent='Sent. I will get back to you soon.';}catch{location.href='mailto:'+CONTACT_EMAIL+'?subject='+encodeURIComponent('Portfolio contact — '+(name||'hello'))+'&body='+encodeURIComponent(message+'\n\n— '+(name||'Anonymous')+(email?' <'+email+'>':''));status.textContent='Could not reach the server — opened your email app instead.';}button.disabled=false;});
function staticLayout(){staticMode=true;
 if(liquidContactFrame&&'IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){bootContactFrame();io.disconnect();}},{rootMargin:'600px'});io.observe(liquidContactFrame);}else bootContactFrame();
 $('#artist').append($('#artist-reading'));$('#practice-title').classList.remove('visually-hidden');document.body.classList.add('static-page');$$('.panel').forEach(p=>{p.inert=false;p.setAttribute('aria-hidden','false');});$('.study-finale').inert=false;$('.study-finale').setAttribute('aria-hidden','false');$('#entrance').inert=true;$('#entrance').setAttribute('aria-hidden','true');$('#loading').hidden=true;}
media.addEventListener('change',()=>{if(!preference)location.reload();});
function setMotionPreference(value){try{localStorage.setItem('studio-v11-motion',value);}catch{}location.reload();}
(function motionToggle(){
 if(bootStatic){
  if(media.matches)return; // honour real reduced-motion silently
  const slot=document.querySelector('.site-footer .footer-socials ul');if(!slot)return;
  const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.className='motion-toggle';b.textContent='View the animated version';b.addEventListener('click',()=>setMotionPreference('full'));li.append(b);slot.append(li);
 }else{
  const nav=document.querySelector('.sable-dock');if(!nav)return;
  const b=document.createElement('button');b.type='button';b.className='sable-dock__item motion-toggle';b.setAttribute('data-dock-item','');b.innerHTML='<span>Static version</span>';b.addEventListener('click',()=>setMotionPreference('reduced'));nav.append(b);
 }
})();
$('#brief-form').addEventListener('input',()=>{delete $('#brief-form').dataset.saved;$('#brief-status').textContent='Goes straight to my inbox.';});
let deferredPrioritize=null;
const loadImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('A portfolio image could not load'));img.src=src;});
async function start(){
 const loader=window.createStudioLoader();
 if(staticMode){loader.finish();staticLayout();scrollTo(0,0);ready=true;document.body.dataset.ready='true';return;}
 try{
 history.scrollRestoration='manual';scrollTo(0,0);
 const fontLoads=['500 40px "Bricolage"','500 36px "Geist"','400 18px "IBM Plex Mono"'].map(font=>document.fonts.load(font).then(()=>loader.credit(6)));
 const [images]=await Promise.all([
   Promise.all(sources.map(src=>loadImage(src).then(img=>{loader.credit(8);return img;}))),
   Promise.all(fontLoads)
 ]);
 entranceDust=window.createEntranceDust?.({host:$('#entrance'),title:$('#entrance-title'),score:S});
 entranceEcho=window.createEntranceEcho?.({host:$('#entrance'),title:$('#entrance-title'),score:S});
 portraitDissolve=window.createPortraitDissolve({host:$('#artist'),title:$('#artist-title'),signature,score:S});
 // A card only gets a video element when a motion file is configured for it.
 const cardVideos=Object.fromEntries(projects.flatMap((p,i)=>{const src=motionSources[p.id];if(!src)return[];const v=document.createElement('video');v.crossOrigin='anonymous';v.id='card-motion-'+num(i);v.muted=true;v.playsInline=true;v.loop=true;v.preload='auto';v.hidden=true;v.src=src;document.body.append(v);v.load();return[[i,v]];}));
 gallery=await window.createStudioGallery({canvas:$('#gallery-canvas'),images,practiceImages:new Array(practicePaths.length).fill(null),biographyAction:null,contactPortrait:null,plates:projects,videos:cardVideos,reduced:false,onSelect:i=>openProject(i,$(score>=S.STUDIES.start?'#study-open':'#open-current')),onFront:updateCurrent,onHover:i=>{const stage=$('#stage');stage.style.cursor=i>=0?'pointer':'grab';stage.dataset.cardHover=String(i>=0);}});
 gallery.setBlocked(true);gallery.render(0);loader.credit(18);
 gallery.setArrival(0);
 gsap.registerPlugin(ScrollTrigger);
 lenis=new Lenis({duration:1.15,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t)),smoothWheel:true,syncTouch:false,virtualScroll:data=>{if(data.event.type==='wheel'&&score>=S.STUDIES.start&&score<S.STUDIES.end){data.deltaY*=1.25+.55*S.phase(score,17.0,22.2);}return true;}});
 lenis.stop();
 lenis.on('scroll',ScrollTrigger.update);
 trigger=ScrollTrigger.create({trigger:$('#scroll-story'),start:'top top',end:'bottom bottom',onUpdate:self=>{score=self.progress*S.MAX;sync();}});
 // No additional requestAnimationFrame: scroll, typography and cards share this tick.
 gsap.ticker.add(time=>{lenis.raf(time*1000);if(!document.hidden){gallery.render(time);entranceEcho?.update(score,portalSize,time);window.StudioAtelier?.tick(time);
   const breathe=S.phase(score,6.1,6.65)*(1-S.phase(score,S.INTRO.holdEnd,S.INTRO.exitEnd));
   artistGuide.firstElementChild.style.transformOrigin='50% 25%';
   artistGuide.firstElementChild.style.transform=`translate3d(0,${Math.sin(time*.88)*2.5*breathe}px,0) rotate(${Math.sin(time*.61)*.12*breathe}deg)`;}});gsap.ticker.lagSmoothing(0);
 positionHitAreas();measurePortal();sync();ScrollTrigger.refresh();
 const initialScore=0;
 // ScrollTrigger refresh can restore a pre-reload scroll position. Set the
 // intended chapter after refresh, and once more when handing over the intro.
 lenis.scrollTo(initialScore*$('#stage').clientHeight,{immediate:true,force:true});score=initialScore;sync();
 let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{gallery.resize();positionHitAreas();measurePortal();portraitDissolve?.resize();entranceDust?.resize();entranceEcho?.resize();lenis.resize();ScrollTrigger.refresh();sync();},120);});
 document.addEventListener('visibilitychange',()=>{gallery.setHidden(document.hidden);if(document.hidden)$('#project-video').pause();});
 document.body.dataset.ready='true';
 const deferredJobs=[
  {key:'portrait',load:()=>Promise.all([portraitImage.decode(),loadPortraitContour(),...[...guideImages,artistGuide.firstElementChild].map(img=>img.decode().catch(()=>{}))])},
  {key:'bio-action',load:()=>loadImage(biographyActionSource).then(img=>gallery.supply({biographyAction:img}))},
  ...practicePaths.map((src,k)=>({key:'practice-'+k,load:()=>loadImage(src).then(img=>gallery.supply({practiceImage:[k,img]}))})),
  {key:'contact',load:()=>loadImage(noaAsset('guide/contact-right.webp')).then(img=>gallery.supply({contactPortrait:img}))}
 ];
 let deferredRunning=0;
 function pumpDeferred(){while(deferredRunning<3&&deferredJobs.length){const job=deferredJobs.shift();deferredRunning++;job.load().catch(()=>{}).finally(()=>{deferredRunning--;pumpDeferred();});}}
 deferredPrioritize=key=>{const i=deferredJobs.findIndex(j=>j.key===key);if(i>0)deferredJobs.unshift(deferredJobs.splice(i,1)[0]);};
 pumpDeferred();
 await loader.reveal({deep:false,drop:t=>gallery.setArrival(t),complete:()=>{lenis.scrollTo(initialScore*$('#stage').clientHeight,{immediate:true,force:true});score=initialScore;gallery.setArrival(null);gallery.setBlocked(false);lenis.start();sync();}});
 }catch(error){console.error('Studio preview: '+error.message);loader.finish();lenis?.destroy();staticLayout();}
 ready=true;$('#loading').hidden=true;document.body.dataset.ready='true';
}
start();
})();

  