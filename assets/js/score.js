
    /* V6: one reversible score for the original eight cards, the photographic portrait,
   and an orange-to-paper introduction. Positions are always derived from scroll. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./card-geometry.js'));else root.StudioScore=factory(root.FieldbookMotion);})(typeof window==='object'?window:globalThis,function(G){
'use strict';
const MAX=27.6,ORDER=[0,1,2,3,4,5,6,7],FOCUS=[0,2,5],LAYERS=[5,2,0,7,6,4,3,1],NAV={hero:0,artist:5.6,practice:10.25,works:17.45};
const PORTAL=Object.freeze({start:1.35,covered:1.85,moveStart:1.9,moveEnd:2.2,reveal:8.95,end:9.45});
const INTRO=Object.freeze({drawStart:2.25,drawEnd:3.32,paperStart:2.30,paperEnd:3.45,cardStart:4.05,cardEnd:5.30,secondStart:5.85,secondEnd:6.65,thirdStart:7.25,thirdEnd:8.05,holdEnd:8.95,exitEnd:10.1});
const PRACTICE=Object.freeze({targets:[10.25,12.25,14.35],motionStart:11.05,motionEnd:11.95,interactionStart:13.1,interactionEnd:14.05,gatherStart:15.25,gatherEnd:16.45});
// Edge anchors frame the title. The portrait and floating house trade sides
// after closing over the heading, so both travel through the composition.
const GATE_LAYOUT=Object.freeze([
 Object.freeze([-.05,.67]),Object.freeze([1.05,.78]),Object.freeze([.02,.06]),Object.freeze([-.20,.20]),
 Object.freeze([1.20,.15]),Object.freeze([.98,.43]),Object.freeze([-.28,.85]),Object.freeze([1.28,.66])
]);
const FEATURED_GATE=Object.freeze([0,1,2,5]);
const clamp=v=>Math.max(0,Math.min(1,v)),mix=(a,b,t)=>a+(b-a)*t,phase=(s,a,b)=>{const t=clamp((s-a)/(b-a));return t*t*(3-2*t);};
function blend(a,b,t){const p={};for(const k of ['x','y','z','rx','ry','rz','s','alpha'])p[k]=mix(a[k]??1,b[k]??1,t);return p;}
function screenPose(W,H,cx,cy,width,z=6,rx=0,ry=0,rz=0,alpha=1){const upp=2*Math.tan(28*Math.PI/360)*20/H,f=(20-z)/20;return{x:(cx-.5)*W*upp*f,y:(.5-cy)*H*upp*f,z,rx,ry,rz,s:width*upp*f/G.CARD.width,alpha};}
function workRects(W,H){const small=W<=760,w=small?Math.min(W*.3,H*.104):Math.min(W*.15,H*.185);return Array.from({length:8},(_,i)=>({cx:W*(small?.30+(i%2)*.4:.20+(i%4)*.20),cy:H*(small?.40+Math.floor(i/2)*.15:.52+Math.floor(i/4)*.28),width:w,height:w*1.25}));}
// V11 / warm editorial WebGL passage. Existing stock, palette and one clock.
// Sixteen unique prints; a slow entrance accelerates into the final reveal.
const TUNNEL_ORDER=Object.freeze([...LAYERS,8,9,10,11,12,13,14,15]);
const STUDIES=Object.freeze({start:16.45,end:27.45,contactStart:26.45,contactEnd:27.35,count:16});
function tunnelTravel(s){const t=clamp((s-STUDIES.start)/(STUDIES.end-STUDIES.start));return 108*(.20*t+.80*Math.pow(t,1.65));}
function studyPosition(s){return Math.min(15,Math.max(0,Math.floor(tunnelTravel(s)/6.35)));}
function studyScore(position){let lo=STUDIES.start,hi=STUDIES.end;for(let n=0;n<40;n++){const mid=(lo+hi)/2;if(tunnelTravel(mid)<position*6.35)lo=mid;else hi=mid;}return(lo+hi)/2;}
function flightPose(s,W,H,id){
 const mobile=W<=760,i=TUNNEL_ORDER.indexOf(id),z=4-i*6.35+tunnelTravel(s),side=i%2?1:-1;
 const scale=mobile?1.45:Math.min(2.1,W/H*1.42),lane=mobile?1.66:Math.min(4.8,W/H*2.15);
 // Each print has a slightly different attitude and a reversible passing breeze.
 const travel=tunnelTravel(s),a=i*2.39996,breeze=phase(s,16.05,17.1),near=phase(z,-35,7);
 return{x:side*(lane+(i%3)*.13)+Math.sin(travel*.085+a)*.045*breeze,
 y:[.08,-.22,.35,-.30][i%4]+Math.sin(travel*.11+a)*.035*breeze+(i>=13?phase(s,STUDIES.end-1.4+(i-13)*.10,STUDIES.end+.1)*9:0),
 z:Math.min(15,z),rx:Math.sin(a)*.022+Math.sin(travel*.13+a)*.016*breeze*near,
 ry:-side*.20+Math.cos(a)*.045+Math.sin(travel*.10+a)*.022*breeze*near,
 rz:side*.012+Math.sin(a+.8)*.018+Math.sin(travel*.12+a)*.012*breeze*near,s:scale,alpha:1-phase(z,12,15)};
}
function contactPose(s,W,H){
 const t=phase(s,25.9,26.85),mobile=W<=760;
 // Already at standing scale behind the fifteenth (left-hand) print.
 // A lateral entrance is uncovered by the rising card, without a distant zoom.
 return screenPose(W,H,mix(-.24,mobile?.26:.31,t),mobile?.49:.51,Math.min(W*(mobile?.62:.43),H*(mobile?.43:.48)),-8,0,0,0,phase(s,25.82,26.05));
}
function studyRailAlpha(s,W,H){
 if(studyPosition(s)<15)return 1;
 const p=flightPose(s,W,H,15),viewHeight=2*Math.tan(28*Math.PI/360)*(20-p.z);
 // Follow the last print's lower edge as it clears the viewport's top edge.
 const bottom=.5-(p.y-G.CARD.height*p.s*.5)/viewHeight;
 return Math.min(p.alpha,phase(bottom,0,.18));
}
function studyIndex(s){return TUNNEL_ORDER[studyPosition(s)];}
function portrait(s,W,H){
 const small=W<=760,move=phase(s,4.58,INTRO.cardEnd),exit=phase(s,INTRO.holdEnd,INTRO.exitEnd-.18);
 // The portrait handoff uses the exact same interval as Card 01's single move.
 const triptych=phase(s,INTRO.secondStart,INTRO.secondEnd);
 const paper=phase(s,INTRO.paperStart,INTRO.paperEnd),draw=phase(s,INTRO.drawStart,INTRO.drawEnd);
 const dissolve=phase(s,INTRO.cardStart,4.95);
 const fullHeight=Math.min(H*.72,W*(small?1.08:.8));
 const settledHeight=small?Math.min(H*(H<=640?.27:.37),W*.64):Math.min(H*1.98,W*1.15);
 const settledY=small?H*.265:settledHeight/2+H*.14;
 const height=mix(fullHeight,settledHeight,move);
 // The first reading card completes the portrait in full color. The earlier
 // drawn and monochrome entrance remains reversible, but the settled artist
 // view now has the contrast and chroma needed to hold its side of the frame.
 return{paper,draw,dissolve,soft:phase(s,INTRO.cardStart,INTRO.cardEnd),contrast:phase(s,INTRO.secondStart,INTRO.secondEnd),color:phase(s,4.68,INTRO.cardEnd),outlineAlpha:1-phase(s,INTRO.cardStart,4.55),
  x:mix(W*.5,W*.27,move)-exit*W*.11,y:mix(H*.55,settledY,move),height,
  pointingAlpha:triptych*(1-exit),pointingOffset:(1-triptych+exit)*H*.30,
  titleY:H*.49,titleAlpha:phase(s,1.88,2.12)*(1-dissolve),
  captionX:small?mix(W*.5,W*.27,move):mix(W*.5,W*.15,move),captionY:small?H*(H<=640?.43:.45):H*.825,
  captionAlpha:phase(s,5.05,5.32)*(1-triptych)*(1-exit),signatureWrite:phase(s,5.10,5.48)*(1-triptych)*(1-exit),quoteAlpha:phase(s,5.34,5.58)*(1-triptych)*(1-exit),alpha:phase(s,2.14,2.25)*(1-triptych)*(1-exit),move,exit};
}
function biographyPose(s,W,H,index=0){
 const small=W<=760,soloW=Math.min(W*(small?.77:.35),H*(small?.45:.57));
 const sideW=Math.min(W*(small?.50:.25),H*(small?.31:.45));
 const centerW=Math.min(W*(small?.62:.285),H*(small?.38:.515));
 const finalW=[sideW,centerW,sideW];
 const finalX=small?[.28,.50,.72]:[.205,.50,.795];
 const finalY=small?[.66,.59,.665]:[.525,.455,.525];
 const finalRx=small?[.045,.018,.05]:[.055,.018,.05];
 // Outer sheets open away from the centre: Card 01 exposes its left stock
 // edge, Card 03 exposes its right edge, and Philosophy faces us directly.
 const finalRy=small?[Math.PI+.32,Math.PI+.01,Math.PI-.32]:[Math.PI+.48,Math.PI+.01,Math.PI-.48];
 const finalRz=small?[-.10,.012,.10]:[-.10,.012,.10];
 const finalZ=[6.6,7.4,8.2];
 const endPose=i=>screenPose(W,H,finalX[i],finalY[i],finalW[i],finalZ[i],finalRx[i],finalRy[i],finalRz[i]);
 const leadX=small?.58:.715,leadY=small?.705:.55;
 if(index===0){
  const enter=phase(s,INTRO.cardStart,INTRO.cardEnd),cross=phase(s,INTRO.cardStart,4.72),settle=phase(s,4.72,INTRO.cardEnd);
  const cx=mix(-.5,.52,cross)+(leadX-.52)*settle;
  // From the solo reading position, one continuous move lands at the final
  // left anchor. The arrival of Card 03 never moves either settled card again.
  const p=screenPose(W,H,cx,mix(.58,leadY,enter),soloW,7,mix(.10,small?.035:.055,enter),mix(.28,Math.PI-(small?.32:.48),enter),mix(-.14,.035,enter),phase(s,INTRO.cardStart,INTRO.cardStart+.17));
  return blend(p,endPose(0),phase(s,INTRO.secondStart,INTRO.secondEnd));
 }
 if(index===1){
  const t=phase(s,INTRO.secondStart,INTRO.secondEnd);
  return blend(screenPose(W,H,1.42,finalY[1]+.035,centerW,finalZ[1],.08,Math.PI-.24,.11,0),endPose(1),t);
 }
 const t=phase(s,INTRO.thirdStart,INTRO.thirdEnd);
 return blend(screenPose(W,H,1.42,finalY[2]+.04,sideW,finalZ[2],.09,Math.PI-.30,.13,0),endPose(2),t);
}
// Three, five, then eleven cards expand around one dominant artwork.
const PRACTICE_SUPPORT=[2,5,1,4,3,6,7];
function practiceSupportPose(s,W,H,k){
 const mobile=W<=760,side=k%2?1:-1;
 const image=mobile?[[.13,.69,.30,-.14,-.20],[.87,.66,.30,.12,.24]]:[[.455,.64,.18,-.12,-.22],[.915,.56,.175,.11,.25]];
 const motion=mobile?[[.12,.66,.25,-.15,-.20],[.88,.66,.25,.12,.20],[.15,.45,.20,.12,-.25],[.85,.45,.20,-.10,.25]]:[[.19,.69,.165,-.13,-.20],[.615,.42,.15,.10,.22],[.07,.39,.115,.13,-.25],[.70,.72,.12,-.12,.25]];
 const invite=mobile?[[.13,.61,.24,-.12,-.20],[.87,.61,.24,.12,.20],[.12,.40,.20,.10,-.22],[.88,.40,.20,-.10,.22],[.12,.82,.22,-.15,-.20],[.88,.82,.22,.15,.20],[.30,.82,.15,.08,-.12],[.70,.82,.15,-.08,.12],[.08,.51,.14,-.06,-.15],[.92,.51,.14,.06,.15]]:[[.245,.53,.16,-.10,-.20],[.755,.53,.16,.10,.20],[.10,.36,.125,.11,-.28],[.90,.36,.125,-.11,.28],[.10,.735,.145,-.12,-.23],[.90,.735,.145,.12,.23],[.27,.78,.095,.08,-.16],[.73,.78,.095,-.08,.16],[.28,.31,.095,-.08,-.12],[.72,.31,.095,.08,.12]];
 const pose=(a,alpha=1)=>screenPose(W,H,a[0],a[1],Math.min(W*a[2],H*(mobile?.20:.26)),5-k*.24,.025,Math.PI*2+a[4],a[3],alpha);
 const off=pose([side<0?-.25:1.25,.55,.15,side*.18,side*.25],0);
 const across=phase(s,PRACTICE.motionStart+k*.025,PRACTICE.motionEnd+k*.025);
 const closer=phase(s,PRACTICE.interactionStart+k*.014,PRACTICE.interactionEnd+k*.014);
 return blend(blend(k<2?pose(image[k]):off,k<4?pose(motion[k]):off,across),pose(invite[k]),closer);
}
function practicePose(s,W,H,j){
 if(j)return practiceSupportPose(s,W,H,j-1);
 const mobile=W<=760;
 const image=mobile?[.50,.65,.57,.01,0]:[.685,.55,.325,.01,0];
 const motion=mobile?[.50,.65,.58,.025,-.07]:[.39,.55,.29,.025,-.07];
 const invite=mobile?[.50,.64,.60,0,0]:[.50,.615,.34,0,0];
 const pose=(a,close=false)=>screenPose(W,H,a[0],a[1],Math.min(W*a[2],H*(mobile?.36:close?.445:.55)),7,close?-.10:.025,Math.PI*2+a[4],a[3]);
 return blend(blend(pose(image),pose(motion),phase(s,PRACTICE.motionStart,PRACTICE.motionEnd)),pose(invite,true),phase(s,PRACTICE.interactionStart,PRACTICE.interactionEnd));
}
function scene(s,W,H,theta=.08){
 s=Math.max(0,Math.min(MAX,s));const small=W<=760,rig=G.heroRig(W,H,H,0);
 const hero=Array.from({length:8},(_,i)=>({...G.orbitPose(ORDER.indexOf(i),theta,rig),alpha:1}));
 const entranceLayers=hero.map((_,i)=>i).sort((a,b)=>hero[b].z-hero[a].z||a-b);
 const gx=GATE_LAYOUT.map(p=>p[0]),gy=GATE_LAYOUT.map(p=>p[1]);
 if(small){gx[0]-=.22;gx[5]+=.22;}
 const gate=hero.map((_,i)=>screenPose(W,H,gx[i],gy[i],Math.min(W*(small?.58:.3),H*.65),7-i*.18,(i%2?-.15:.15),i%2?-.55:.55,(i%3-1)*.18));
 const hidden=hero.map((_,i)=>screenPose(W,H,i%2?1.4:-.4,.5,150,0,0,0,0,0));
 FOCUS.forEach((i,j)=>{hidden[i]=biographyPose(INTRO.cardStart,W,H,j);});
 const about=hidden.map(p=>({...p}));FOCUS.forEach((i,j)=>{about[i]=biographyPose(INTRO.holdEnd,W,H,j);});
 const first=hero.map((_,i)=>screenPose(W,H,i%2?1.2:-.2,1.35,150,0,0,0,0,0));
 FOCUS.forEach((i,j)=>{first[i]=practicePose(s,W,H,j);});
 PRACTICE_SUPPORT.slice(2).forEach((i,k)=>{first[i]=practiceSupportPose(s,W,H,k+2);});
 let poses;
 if(s<1.25){
  poses=hero.map((p,i)=>blend(p,gate[i],phase(s,.10,1.25)));
  // Close like curtains, then cross: portrait left → right, house right → left.
  // Offset starts and opposing arcs keep their silhouettes readable as they
  // pass. The existing depth separation prevents the two sheets intersecting.
  const width=small?W*.55:Math.min(W*.36,560);
  [5,2].forEach((i,j)=>{
   const closed=screenPose(W,H,.5+(j?1:-1)*width*.43/W,.5,width,7-j*.2,0,0,0);
   const t=phase(s,j?.66:.58,1.25),p=blend(closed,gate[i],t);
   const arc=Math.sin(Math.PI*t),upp=2*Math.tan(28*Math.PI/360)*20/H;
   p.y+=arc*H*(small?.065:.12)*(j?-1:1)*upp*(20-p.z)/20;
   p.rx+=arc*(j?.14:-.12);p.rz+=arc*(j?-.16:.14);
   poses[i]=s<.52?blend(hero[i],closed,phase(s,.10,.52)):p;
  });
 }
 else if(s<PORTAL.moveEnd)poses=gate.map((p,i)=>blend(p,hidden[i],phase(s,PORTAL.moveStart,PORTAL.moveEnd)));
 else if(s<INTRO.cardStart)poses=hidden.map(p=>({...p}));
 else if(s<INTRO.holdEnd){poses=hidden.map(p=>({...p}));FOCUS.forEach((i,j)=>{poses[i]=biographyPose(s,W,H,j);});}
 else if(s<INTRO.exitEnd){
  poses=about.map((p,i)=>blend(p,first[i],phase(s,INTRO.holdEnd,INTRO.exitEnd)));
  FOCUS.forEach((i,j)=>{
   // Fall, turn, then catch: the same stock stays inside the viewport throughout.
   const t=phase(s,INTRO.holdEnd+j*.055,INTRO.exitEnd),end=practicePose(INTRO.exitEnd,W,H,j);
   const p=blend(about[i],end,t),depth=(20-p.z)/20;
   p.y-=Math.sin(Math.PI*t)*H*(small?.13:.23)*(2*Math.tan(28*Math.PI/360)*20/H)*depth;
   p.rx-=Math.sin(Math.PI*t)*.32;p.rz+=Math.sin(Math.PI*t)*[.12,-.1,.17][j];
   poses[i]=p;
  });
 }else poses=first;
 const rects=workRects(W,H),gather=phase(s,PRACTICE.gatherStart,PRACTICE.gatherEnd);
 if(gather>0)poses=poses.map((p,i)=>{
  // Uneven but repeatable catch times, all resolved before forward travel begins.
  const rank=[2,6,0,5,3,1,7,4][i],t=phase(s,PRACTICE.gatherStart+rank*.025,PRACTICE.gatherEnd-.24+rank*.034);
  const settled=blend(p,flightPose(s,W,H,i),t),arc=Math.sin(Math.PI*t),side=i%2?1:-1;
  settled.rx+=arc*Math.sin(i*1.73+.4)*.055;
  settled.ry+=arc*side*(.055+(rank%3)*.018);
  settled.rz+=arc*Math.sin(i*2.1)*.028;
  return settled;
 });
 const layers=s<PORTAL.moveStart?entranceLayers:LAYERS;
 // Ground lighting uses authored world poses, before camera-ray depth separation.
 const shadowPoses=poses.map(p=>({...p}));
 const extraPoses=[7,8,9].map(k=>{
  const p=practiceSupportPose(s,W,H,k),exit=phase(s,PRACTICE.gatherStart,16.1);
  const end=screenPose(W,H,k%2?1.18:-.18,.55,100,1,0,Math.PI*2,0,0);
  return blend(p,end,exit);
 });
 const separated=G.separateLayers([...poses,...extraPoses].map(p=>({...p})),[...layers,8,9,10]);
 poses=poses.map((p,i)=>blend(p,separated[i],phase(s,.01,.10)));
 return{poses,extraPoses:separated.slice(8),shadowPoses,rects,rig,layers};
}
function presentation(s){const chapter=s<.45?'hero':s<1.88?'entrance':s<9.45?'artist':s<15.8?'practice':'works';return{chapter,hero:1-phase(s,.05,.55),entrance:s>=.56&&s<1.88?1:0,artist:phase(s,1.88,2.12)*(1-phase(s,INTRO.holdEnd,PORTAL.end)),practice:phase(s,9.55,10.12)*(1-phase(s,15.25,15.9)),works:phase(s,15.95,PRACTICE.gatherEnd),titleFade:1,portalGrow:phase(s,PORTAL.start,PORTAL.covered),portalDive:phase(s,PORTAL.start,PORTAL.covered)*(1-phase(s,PORTAL.covered,PORTAL.moveEnd)),portalAlpha:phase(s,PORTAL.start-.01,PORTAL.start)*(1-phase(s,PORTAL.reveal,PORTAL.end)),detail:s<11.5?0:s<13.55?1:2};}
return Object.freeze({MAX,STUDIES,studyRailAlpha,TUNNEL_ORDER,studyPosition,studyScore,tunnelTravel,flightPose,contactPose,studyIndex,ORDER,FOCUS,LAYERS,NAV,PORTAL,INTRO,PRACTICE,PRACTICE_SUPPORT,GATE_LAYOUT,FEATURED_GATE,clamp,mix,phase,blend,screenPose,workRects,practicePose,scene,presentation,portrait,biographyPose,practiceSupportPose});
});

  