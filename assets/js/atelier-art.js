
    /* One sculpture, one material, one draw path from print to presence.
 * The approved ribbon is compressed into the print plane, then gains depth.
 * Its uncompressed normals preserve studio shading in the image. There is no
 * second render target, opacity handoff, or overlapping copy during emergence.
 * All resources are created once and updated by the gallery's existing clock. */
window.createAtelierArtwork=function(options){
 'use strict';
 const {T,renderer,cards,practiceTextures=[],score,PRINT,shadowLight}=options,lead=cards[score.FOCUS[0]];
 const geometry=new T.BufferGeometry(),positions=[],normals=[],uv=[],indices=[],segments=384,strips=40;
 function point(u,v){const r=.65+.085*Math.cos(3*u),twist=u/2+.28;return new T.Vector3((r+v*Math.cos(twist))*Math.cos(u),(r+v*Math.cos(twist))*Math.sin(u)*1.12,v*Math.sin(twist)+.15*Math.sin(2*u));}
 // Analytic surface directions meet across the reversed Möbius seam. Averaging
 // disconnected end triangles left a visible change of normal at the join.
 function surfaceNormal(u,v){const du=point(u+.0001,v).sub(point(u-.0001,v)),dv=point(u,v+.0001).sub(point(u,v-.0001));return du.cross(dv).normalize();}
 for(let i=0;i<=segments;i++)for(let j=0;j<=strips;j++){
  const u=i/segments*Math.PI*2,v=(j/strips-.5)*.56,p=point(u,v),n=surfaceNormal(u,v);positions.push(p.x,p.y,p.z);normals.push(n.x,n.y,n.z);uv.push(i/segments,j/strips);
  if(i<segments&&j<strips){const a=i*(strips+1)+j,b=a+strips+1;indices.push(a,b,a+1,b,b+1,a+1);}
 }
 geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
 geometry.setAttribute('sculpturePosition',geometry.attributes.position.clone().setUsage(T.DynamicDrawUsage));
 // A fine rolled edge catches light and gives the sheet a visible thickness.
 class RibbonEdge extends T.Curve{getPoint(t){return point(t*Math.PI*4,.28);}}
 const edgeGeometry=new T.TubeGeometry(new RibbonEdge(),768,.0035,12,true);
 // Brushing follows the ribbon's own UVs rather than screen-space stripes.
 const grain=document.createElement('canvas');grain.width=1024;grain.height=256;
 const ctx=grain.getContext('2d'),pixels=ctx.createImageData(1024,256);let seed=83;
 const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const fibres=Array.from({length:128},()=>random()-.5);fibres.push(...fibres.slice().reverse());
 for(let y=0;y<256;y++)for(let x=0;x<1024;x++){const i=(y*1024+x)*4,value=202+fibres[y]*9+(random()-.5)*4+Math.sin(x*.027+y*.61)*2;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;}
 ctx.putImageData(pixels,0,0);
 const brushing=new T.CanvasTexture(grain);brushing.wrapS=brushing.wrapT=T.RepeatWrapping;brushing.repeat.set(2,2);brushing.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 // Broad graduated softboxes, a dark flag, and a narrow rim reflection.
 const studio=new T.Scene();
 // A studio has a ceiling, dark flags and a warm floor—not a single flat
 // ambient colour. Their broad gradients describe curvature even away from
 // the key reflection and reveal the fine brushing as the object turns.
 const roomGeo=new T.SphereGeometry(20,48,32),roomPos=roomGeo.attributes.position,roomColours=[];
 const horizon=new T.Color(.075,.082,.08),ceiling=new T.Color(.36,.38,.39),floorTone=new T.Color(.25,.23,.20),roomTone=new T.Color();
 for(let i=0;i<roomPos.count;i++){const y=roomPos.getY(i)/20,t=Math.pow(Math.abs(y),.75);roomTone.copy(horizon).lerp(y>0?ceiling:floorTone,t);roomColours.push(roomTone.r,roomTone.g,roomTone.b);}
 roomGeo.setAttribute('color',new T.Float32BufferAttribute(roomColours,3));studio.add(new T.Mesh(roomGeo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));

 const softbox=document.createElement('canvas');softbox.width=128;softbox.height=256;const sc=softbox.getContext('2d'),softPixels=sc.createImageData(128,256);
 for(let y=0;y<256;y++)for(let x=0;x<128;x++){const k=(y*128+x)*4,value=255*Math.pow(Math.sin(Math.PI*x/127)*Math.sin(Math.PI*y/255),.48);softPixels.data[k]=softPixels.data[k+1]=softPixels.data[k+2]=value;softPixels.data[k+3]=255;}sc.putImageData(softPixels,0,0);
 const boxTexture=new T.CanvasTexture(softbox);boxTexture.encoding=T.sRGBEncoding;
 [[-4,3,4,4,9,2.8],[4,1,2,2.5,8,1.25],[0,5,-2,7,4,1.05],[0,0,7,2.4,9,.70],[2,1,-6,3,9,2.1],[-4,-2,-4,3,7,.65],[-6,0,0,6,10,1.35],[6,0,0,4,9,.85]].forEach(([x,y,z,w,h,power])=>{
  const box=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:boxTexture,color:new T.Color(power,power*.98,power*.94),side:T.DoubleSide}));box.position.set(x,y,z);box.lookAt(0,0,0);studio.add(box);
 });
 const pmrem=new T.PMREMGenerator(renderer),reflections=pmrem.fromScene(studio,.035);pmrem.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});boxTexture.dispose();
 const metal=new T.MeshPhysicalMaterial({color:0xc8c1b5,metalness:.92,roughness:.31,roughnessMap:brushing,bumpMap:brushing,bumpScale:.00055,side:T.DoubleSide,envMap:reflections.texture,envMapIntensity:1.15,clearcoat:0});
 // A Möbius strip has one continuous face: a front/back tint creates a false
 // seam. Use the same satin alloy throughout, with a film-like highlight
 // shoulder applied only to the sculpture's physical lighting response.
 const finish=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <output_fragment>',`
  outgoingLight = outgoingLight / (vec3(1.0) + outgoingLight * 0.28);
  #include <output_fragment>`);};
 // Bump derivatives need the real surface, even when its visible geometry is
 // compressed into a print. Using the flat plane here erased curved shading.
 metal.onBeforeCompile=shader=>{
  finish(shader);
  shader.vertexShader='attribute vec3 sculpturePosition;\nvarying vec3 vSculptureViewPosition;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvSculptureViewPosition=(modelViewMatrix*vec4(sculpturePosition,1.0)).xyz;');
  shader.fragmentShader='varying vec3 vSculptureViewPosition;\n'+shader.fragmentShader.replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replaceAll('- vViewPosition','vSculptureViewPosition'));
 };metal.customProgramCacheKey=()=> 'atelier-continuous-satin-4';
 const edgeMetal=new T.MeshStandardMaterial({color:0xe0d6c5,metalness:.92,roughness:.26,envMap:reflections.texture,envMapIntensity:1.05});edgeMetal.onBeforeCompile=finish;edgeMetal.customProgramCacheKey=()=> 'atelier-satin-edge-3';
 const sculpture=new T.Group();sculpture.name='Atelier / continuous ribbon';
 const ribbon=new T.Mesh(geometry,metal),edge=new T.Mesh(edgeGeometry,edgeMetal);ribbon.castShadow=true;edge.castShadow=true;sculpture.add(ribbon,edge);lead.group.add(sculpture);
 // Local illumination moves with the artwork, so the material never changes
 // lighting rigs when the card moves left or the sculpture comes forward.
 const key=new T.DirectionalLight(0xfff9ef,.28);key.position.set(-3,4,7);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-3,right:3,top:3,bottom:-3,near:.1,far:35});key.shadow.bias=-.00015;key.shadow.normalBias=.008;key.shadow.radius=8;
 lead.group.add(key,key.target);
 // The stock 17-tap PCF grid produces repeated outlines at studio-light
 // softness. A disk filter on this print alone removes those grid bands. The
 // uniform restores its original shadow treatment outside the methodology.
 const softShadow={value:0};
 lead.frontMat.onBeforeCompile=shader=>{
  shader.uniforms.atelierShadowSoftness=softShadow;
  const source=T.ShaderChunk.shadowmap_pars_fragment;
  const filtered=source.replace('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )',`
   if (atelierShadowSoftness > 0.001) {
    float angle = fract(sin(dot(floor(shadowCoord.xy * shadowMapSize), vec2(12.9898,78.233))) * 43758.5453) * 6.283185;
    float softSum = 0.0;
    float weightSum = 0.0;
    for (int sampleIndex = 0; sampleIndex < 32; sampleIndex++) {
     float radius = sqrt((float(sampleIndex) + 0.5) / 32.0);
     float theta = angle + float(sampleIndex) * 2.399963;
     float weight = 1.0 - 0.65 * radius;
     vec2 offset = vec2(cos(theta), sin(theta)) * radius * shadowRadius / shadowMapSize;
     softSum += texture2DCompare(shadowMap, shadowCoord.xy + offset, shadowCoord.z) * weight;
     weightSum += weight;
    }
    shadow = mix(shadow, softSum / weightSum, atelierShadowSoftness);
   }
   #elif defined( SHADOWMAP_TYPE_PCF_SOFT )`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>','uniform float atelierShadowSoftness;\n'+filtered);
 };
 lead.frontMat.customProgramCacheKey=()=> 'atelier-soft-print-shadow-1';lead.frontMat.needsUpdate=true;
 const backdrop=document.createElement('canvas');backdrop.width=768;backdrop.height=960;const bc=backdrop.getContext('2d');
 // Pale limestone gives the satin sculpture a warm, luminous setting. A soft
 // diagonal wash reads as a studio window rather than a yellow flat print.
 const wash=bc.createRadialGradient(165,170,10,450,490,820);wash.addColorStop(0,'#f5f0e5');wash.addColorStop(.48,'#e4daca');wash.addColorStop(1,'#c9bca6');bc.fillStyle=wash;bc.fillRect(0,0,768,960);
 const floorWash=bc.createLinearGradient(0,590,0,960);floorWash.addColorStop(0,'rgba(221,217,204,0)');floorWash.addColorStop(.55,'rgba(221,217,204,.18)');floorWash.addColorStop(1,'rgba(221,217,204,.48)');bc.fillStyle=floorWash;bc.fillRect(0,0,768,960);
 // Fine mineral ground under the metal; texture stays secondary to the form.
 const stock=bc.getImageData(0,0,768,960);for(let i=0;i<stock.data.length;i+=4){const n=(random()-.5)*3;stock.data[i]+=n;stock.data[i+1]+=n;stock.data[i+2]+=n;}bc.putImageData(stock,0,0);
 const paper=new T.CanvasTexture(backdrop);paper.encoding=T.sRGBEncoding;
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=256;shadowCanvas.height=64;const sh=shadowCanvas.getContext('2d');sh.scale(1,.25);const sg=sh.createRadialGradient(128,128,2,128,128,120);sg.addColorStop(0,'rgba(37,28,19,.3)');sg.addColorStop(.5,'rgba(37,28,19,.12)');sg.addColorStop(1,'rgba(37,28,19,0)');sh.fillStyle=sg;sh.fillRect(0,0,256,256);
 const shadowTex=new T.CanvasTexture(shadowCanvas),shadowMat=new T.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false,opacity:.6});const shadow=new T.Mesh(new T.PlaneGeometry(1.4,.22),shadowMat);shadow.position.set(.06,-.96,PRINT.faceZ+.003);lead.group.add(shadow);
 // Keep source positions/normals immutable. Baking a pose before compression
 // makes every scroll position deterministic in both directions.
 const surfaces=[geometry,edgeGeometry].map(g=>{g.attributes.position.setUsage(T.DynamicDrawUsage);g.attributes.normal.setUsage(T.DynamicDrawUsage);return {g,p:g.attributes.position.array.slice(),n:g.attributes.normal.array.slice()};});
 const rotation=new T.Matrix4(),euler=new T.Euler(),v=new T.Vector3(),normal=new T.Vector3();let last='',turn=0,turnTarget=0;
 const onTurn=()=>{turnTarget+=Math.PI*.65;};window.addEventListener('atelier-turn',onTurn);
 function update(s,time,pointer,dt){
  const active=s>score.INTRO.holdEnd&&s<score.PRACTICE.gatherEnd;
  sculpture.visible=shadow.visible=active;key.visible=active;
  // The existing gallery light also illuminates the emerging object. Its wide
  // shadow footprint needs the same soft-source treatment during this chapter.
  softShadow.value=score.phase(s,9.45,10.85)*(1-score.phase(s,15.25,16.4));
  if(shadowLight)shadowLight.shadow.radius=3.5+4.5*softShadow.value;
  if(!active){cards.forEach(c=>{if(c!==lead&&c.frontMat.map!==c.studyFront){c.frontMat.map=c.studyFront;c.frontMat.needsUpdate=true;}});return;}
  const {phase,mix}=score,invite=phase(s,score.PRACTICE.interactionStart,score.PRACTICE.interactionEnd),pop=phase(s,13.18,14.1)*(1-phase(s,15.25,15.65)),restore=phase(s,15.65,16.38),reveal=phase(s,9.45,10.85);
  turn=mix(turn,turnTarget,1-Math.exp(-dt*5));
  const rhythm=phase(s,11.3,11.65)*-.23+phase(s,11.7,12.55)*1.55-phase(s,12.6,13.04)*.13;
  const baseY=-.62+rhythm+invite*(pointer.x*.55+turn),baseX=.38+invite*pointer.y*.3;
  // Gathering hides the artwork by shrinking it back into its own card, not by
  // crossfading two differently projected sculptures.
  const size=(1+pop*.13)*(1-phase(s,15.65,16.0));sculpture.visible=size>.001;
  if(lead.frontMat.map!==paper&&s<16.0){lead.frontMat.map=paper;lead.frontMat.needsUpdate=true;}
  if(s>=16.0&&lead.frontMat.map!==lead.studyFront){lead.frontMat.map=lead.studyFront;lead.frontMat.needsUpdate=true;}
  // Supporting artworks remain distinct, quieter studies from the collection.
  // Each supporting card keeps its artwork throughout all three practice phases.
  cards.forEach((c,i)=>{if(c===lead)return;const supportIndex=score.PRACTICE_SUPPORT.indexOf(i);const tex=practiceTextures[supportIndex];const target=s>=16?c.studyFront:(tex||c.studyFront);if(c.frontMat.map!==target){c.frontMat.map=target;c.frontMat.needsUpdate=true;}});
  key.intensity=mix(.14,.28,reveal)*phase(s,score.INTRO.holdEnd,9.45)*(1-phase(s,15.65,16.4));key.position.x=mix(-4,-3,reveal);shadowMat.opacity=.6*(1-pop*.7)*(1-restore);
  const stamp=[s.toFixed(5),(pointer.x*invite).toFixed(4),(pointer.y*invite).toFixed(4),turn.toFixed(4)].join(':');if(stamp===last)return;last=stamp;
  rotation.makeRotationFromEuler(euler.set(baseX,baseY,-.25));
  const depth=mix(.006,1,pop);let minZ=Infinity;
  const p=surfaces[0].p;for(let i=0;i<p.length;i+=3){v.fromArray(p,i).applyMatrix4(rotation);minZ=Math.min(minZ,v.z);}
  surfaces.forEach(({g,p,n})=>{
   const pa=g.attributes.position,na=g.attributes.normal,full=g.attributes.sculpturePosition;
   for(let i=0;i<p.length;i+=3){v.fromArray(p,i).applyMatrix4(rotation);normal.fromArray(n,i).transformDirection(rotation);pa.setXYZ(i/3,v.x*size,(v.y+.07+pop*.05)*size,PRINT.faceZ+.012+(v.z-minZ)*depth*size+pop*.24);na.setXYZ(i/3,normal.x,normal.y,normal.z);if(full)full.setXYZ(i/3,v.x*size,(v.y+.07+pop*.05)*size,PRINT.faceZ+.012+(v.z-minZ)*size+pop*.24);}
   pa.needsUpdate=na.needsUpdate=true;if(full)full.needsUpdate=true;g.computeBoundingSphere();
  });
  // The rolled rim gains thickness with the object. Keeping the tube out of
  // the compressed print prevents its triangles fighting the flat surface.
  edge.visible=pop>.015;
  ribbon.castShadow=edge.castShadow=pop>.015;
 }
 return{update,dispose(){window.removeEventListener('atelier-turn',onTurn);geometry.dispose();edgeGeometry.dispose();metal.dispose();edgeMetal.dispose();brushing.dispose();reflections.dispose();paper.dispose();shadow.geometry.dispose();shadowMat.dispose();shadowTex.dispose();key.shadow.map?.dispose();}};
};

  