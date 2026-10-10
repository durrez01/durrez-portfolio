
    /* Physical prints share the original carousel's stock, camera and studio light. */
window.createStudioGallery = async function(options) {
  'use strict';
  const {canvas,images,practiceImages=[],biographyAction,contactPortrait,plates,videos={},reduced,onSelect,onFront,onHover}=options;
  const score=window.StudioScore;
  const T=window.THREE,motion=window.FieldbookMotion;
  if(!T||!motion)throw new Error('The gallery renderer is unavailable');
  const SETTINGS={stockRelief:.0038,backRelief:.0032,photoRelief:.00055,shadowOpacity:.14};
  const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
    renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.NoToneMapping;
    renderer.setClearColor(0,0); renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFShadowMap;
    const scene = new T.Scene();
    const camera = new T.PerspectiveCamera(28,innerWidth/innerHeight,.1,2000); camera.position.set(0,0,20);
    const {width:CW,height:CH,depth:CT,radius:CR,bevel:BEV}=motion.CARD, PRINT=motion.PRINT, STEP=Math.PI*2/8;
    // A high, broad key aligned with the left softbox reflection. The higher
    // angle keeps the cast shadow near the foot of each suspended card.
    const light = new T.DirectionalLight(0xfff7ef,.74); light.position.set(-5,24,12); light.castShadow=true;
    light.shadow.mapSize.set(2048,2048); Object.assign(light.shadow.camera,{left:-14,right:14,top:12,bottom:-12,near:1,far:65}); light.shadow.bias=-.00006; light.shadow.normalBias=.004; light.shadow.radius=3.5;
    scene.add(light); scene.add(new T.HemisphereLight(0xfffcf5,0xe1dbd1,.34));
    const env = new T.Scene();
    env.add(new T.Mesh(new T.SphereGeometry(30,16,12), new T.MeshBasicMaterial({side:T.BackSide,color:new T.Color(.30,.29,.275)})));
    [[-5,8,5,9,7,2.3],[6,1.5,-3,3,8,1.2],[0,.5,9,10,6,.7]].forEach(([x,y,z,w,h,b]) => {const p=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(b,b*.98,b*.95),side:T.DoubleSide}));p.position.set(x,y,z);p.lookAt(0,0,0);env.add(p);});
    const pmrem=new T.PMREMGenerator(renderer); const environment=pmrem.fromScene(env,.035); scene.environment=environment.texture; pmrem.dispose();
    env.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    function rounded(w,h,r) { const s=new T.Shape(),x=-w/2,y=-h/2; s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s; }
    const shape=rounded(CW,CH,CR);
    const geometry=new T.ExtrudeGeometry(shape,{depth:CT,bevelEnabled:true,bevelSize:BEV,bevelThickness:BEV,bevelSegments:3,curveSegments:16}); geometry.translate(0,0,-CT/2);geometry.computeVertexNormals();
    // One sheet of grain across the stock, rather than tiny repeating UV tiles.
    const stockPos=geometry.attributes.position,stockUV=geometry.attributes.uv;
    for(let i=0;i<stockUV.count;i++)stockUV.setXY(i,(stockPos.getX(i)+CW/2)/CW,(stockPos.getY(i)+CH/2)/CH);
    stockUV.needsUpdate=true;
    function faceGeometry(inset) {
      const w=CW-inset*2,h=CH-inset*2,g=new T.ShapeGeometry(rounded(w,h,CR-inset),24);
      const pos=g.attributes.position,uv=g.attributes.uv;
      for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+w/2)/w,(pos.getY(i)+h/2)/h);
      uv.needsUpdate=true;return g;
    }
    const frontGeo=faceGeometry(PRINT.inset),backGeo=faceGeometry(.0275);
    const mountGeo=new T.ExtrudeGeometry(rounded(CW-PRINT.inset*2,CH-PRINT.inset*2,CR-PRINT.inset),{
      depth:PRINT.depth,bevelEnabled:true,bevelSize:PRINT.bevel,bevelThickness:PRINT.bevel,bevelSegments:4,curveSegments:24
    });
    mountGeo.computeVertexNormals();
    function texture(c,srgb=true) { const tex=new T.CanvasTexture(c); if(srgb)tex.encoding=T.sRGBEncoding; tex.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);return tex; }
    // Cotton-stock microstructure: broad formation, fine tooth and sparse fibers.
    // Separate maps preserve a matte surface; the image coating stays much smoother.
    function paperCanvas(){const c=document.createElement('canvas');c.width=c.height=512;return c;}
    const paper=paperCanvas(),paperColor=paperCanvas(),paperRoughness=paperCanvas();
    const pc=paper.getContext('2d'),cc=paperColor.getContext('2d'),rc=paperRoughness.getContext('2d');
    const relief=pc.createImageData(512,512),albedo=cc.createImageData(512,512),rough=rc.createImageData(512,512);let seed=47;
    function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
    const cells=32,formation=Array.from({length:cells*cells},()=>random()-.5);
    function broad(x,y){const gx=x/16,gy=y/16,ix=Math.floor(gx),iy=Math.floor(gy),fx=gx-ix,fy=gy-iy;
      const at=(a,b)=>formation[(b%cells)*cells+a%cells],tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy);
      return (at(ix,iy)*(1-tx)+at(ix+1,iy)*tx)*(1-ty)+(at(ix,iy+1)*(1-tx)+at(ix+1,iy+1)*tx)*ty;
    }
    for(let y=0;y<512;y++)for(let x=0;x<512;x++){
      const i=(y*512+x)*4,grain=random()-.5,body=broad(x,y);
      for(let k=0;k<3;k++){relief.data[i+k]=128+body*26+grain*34;albedo.data[i+k]=249+body*4+grain*7;rough.data[i+k]=233+body*10+grain*16;}
      relief.data[i+3]=albedo.data[i+3]=rough.data[i+3]=255;
    }
    pc.putImageData(relief,0,0);cc.putImageData(albedo,0,0);rc.putImageData(rough,0,0);
    pc.strokeStyle='rgba(255,255,255,.18)';cc.strokeStyle='rgba(105,94,77,.045)';rc.strokeStyle='rgba(255,255,255,.25)';
    for(let i=0;i<1600;i++){const x=random()*512,y=random()*512,angle=random()*Math.PI*2,len=2+random()*7;
      for(const ctx of [pc,cc,rc]){ctx.lineWidth=.65;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+Math.cos(angle+.18)*len*.5,y+Math.sin(angle+.18)*len*.5,x+Math.cos(angle)*len,y+Math.sin(angle)*len);ctx.stroke();}
    }
    const paperTex=texture(paper,false),stockColor=texture(paperColor),stockRoughness=texture(paperRoughness,false);
    const stock=new T.MeshStandardMaterial({color:0xf3eee4,map:stockColor,roughness:.94,roughnessMap:stockRoughness,bumpMap:paperTex,bumpScale:SETTINGS.stockRelief,envMapIntensity:.28});
    const edge=new T.MeshStandardMaterial({color:0xe8e1d4,map:stockColor,roughness:.97,roughnessMap:stockRoughness,bumpMap:paperTex,bumpScale:.0025,envMapIntensity:.22});
    // Crop the source itself so every aspect ratio occupies exactly the same
    // full-height rounded surface. Video frames and stills use the same painter.
    function cover(ctx,img,w,h,zoom=1){
      const iw=img.videoWidth||img.naturalWidth,ih=img.videoHeight||img.naturalHeight;
      const base=Math.max(w/iw,h/ih),scale=base*zoom,sw=w/scale,sh=h/scale;
      const sy=(ih-h/base)/2+(h/base-sh)*(zoom>1?.43:.5);
      ctx.drawImage(img,(iw-sw)/2,sy,sw,sh,0,0,w,h);
    }
    const TW=1024,TH=1280;
    function frontTexture(img,zoom=1) {
      const c=document.createElement('canvas');c.width=TW;c.height=Math.round(TW*(CH-PRINT.inset*2)/(CW-PRINT.inset*2));
      const ctx=c.getContext('2d');
      function paint(media){
        ctx.clearRect(0,0,c.width,c.height);cover(ctx,media,c.width,c.height,zoom);
        const vignette=ctx.createRadialGradient(c.width/2,c.height/2,c.width*.42,c.width/2,c.height/2,c.width*.97);
        vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(0,0,0,.07)');
        ctx.fillStyle=vignette;ctx.fillRect(0,0,c.width,c.height);
        // Fail before WebGL upload if a future source taints this canvas.
        ctx.getImageData(0,0,1,1);
      }
      paint(img);const tex=texture(c);tex.userData.paint=media=>{paint(media);tex.needsUpdate=true;};return tex;
    }
    function wrap(ctx,text,x,y,maxWidth,lineHeight){let line='';for(const word of text.split(' ')){const next=line+word+' ';if(ctx.measureText(next).width>maxWidth&&line){ctx.fillText(line,x,y);line=word+' ';y+=lineHeight;}else line=next;}ctx.fillText(line,x,y);return y;}
    function backTexture(p,i) {
      const c=document.createElement('canvas');
      window.paintStudyBack(c,p,i,paperColor);
      return texture(c);
    }
    function biographyTexture(note,index){
      const c=document.createElement('canvas');c.width=1536;c.height=1920;
      const ctx=c.getContext('2d');ctx.scale(1.5,1.5);let lastStep=-1,lastHeadline=-1,tex;
      const reveal=(amount,a,b,x,y,w,h,draw)=>{const t=score.phase(amount,a,b);if(t<=0)return;ctx.save();ctx.beginPath();ctx.rect(x,y,w*t,h);ctx.clip();draw(t);ctx.restore();};
      const rule=y=>{ctx.beginPath();ctx.moveTo(78,y);ctx.lineTo(TW-78,y);ctx.stroke();};
      const ink='#242520',muted='#595449',accent='#ae4323';
      function cardLabel(){
        const [name,...context]=note.label.toUpperCase().split(' / ');
        ctx.font='400 20px "IBM Plex Mono"';ctx.textAlign='left';ctx.fillStyle=accent;ctx.fillText(name,80,91);
        if(context.length){const offset=ctx.measureText(name).width;ctx.fillStyle=muted;ctx.fillText(` / ${context.join(' / ')}`,80+offset,91);}
      }
      function stepArrow(x1,y1,drop,x2){
        const y2=y1+drop;
        ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x1,y2);ctx.lineTo(x2,y2);ctx.stroke();
        ctx.beginPath();ctx.moveTo(x2-13,y2-9);ctx.lineTo(x2,y2);ctx.lineTo(x2-13,y2+9);ctx.stroke();
      }
      function animatedTitle(amount,headline){
        const fontSize=index===1?120:104,x=index===1?TW/2:78;
        const ys=index===1?[305,427]:[268,374];
        ctx.font=`500 ${fontSize}px "Bricolage"`;ctx.textAlign='left';
        note.title.forEach((line,i)=>{
          const visible=score.phase(amount,i===0?.04:.12,i===0?.20:.34);
          if(!visible)return;
          ctx.save();ctx.globalAlpha=visible;
          const width=ctx.measureText(line).width,left=index===1?x-width/2:x;
          let color=ink;
          if(index===0&&i===1){
            // A small expansion resolves the second thought into crisp ink.
            ctx.letterSpacing=`${-1.8*(1-headline)}px`;
            ctx.filter=`blur(${2.6*(1-headline)}px)`;
            ctx.translate(0,4*(1-headline));
          }else if(index===1&&i===1){
            // A broad, soft pigment front settles into the final terracotta.
            const edge=left+width*(headline*1.4-.2);
            const wash=ctx.createLinearGradient(edge-90,0,edge+90,0);
            wash.addColorStop(0,accent);wash.addColorStop(1,ink);color=wash;
          }else if(index===2&&i===1){
            // Three ink impressions register together, then stop completely.
            const separation=Math.sin(Math.PI*headline)*(1-headline);
            ctx.fillStyle=accent;ctx.globalAlpha=visible*.19*separation;
            ctx.fillText(line,left-12*separation,ys[i]+5*separation);
            ctx.fillStyle='#797365';ctx.fillText(line,left+12*separation,ys[i]-5*separation);
            ctx.globalAlpha=visible;
          }
          window.StudioCardFinish.raisedText(ctx,line,left,ys[i],color);
          ctx.restore();
        });
      }
      function paint(amount,headline=0){
        ctx.clearRect(0,0,TW,TH);window.StudioCardFinish.paint(ctx,TW,TH);
        if(index===1){ctx.fillStyle="rgba(255,244,232,.32)";ctx.fillRect(0,0,TW,TH);}
        ctx.strokeStyle='#bcb3a2';ctx.lineWidth=1;
        reveal(amount,0,.15,0,48,TW,90,()=>{
          cardLabel();rule(127);
        });
        animatedTitle(amount,headline);
        if(note.layout==='material'){
          reveal(amount,.30,.60,58,445,908,356,()=>{
            ctx.fillStyle=ink;ctx.font='400 43px "Geist"';wrap(ctx,note.lead,78,490,850,57);
            ctx.fillStyle=muted;ctx.font='400 31px "Geist"';wrap(ctx,note.body,78,655,850,44);
          });
          // A single material-to-world observation, set like a specimen caption.
          reveal(amount,.54,.92,58,770,908,354,()=>{
            ctx.strokeStyle='#bcb3a2';rule(820);
            ctx.fillStyle=muted;ctx.font='400 19px "IBM Plex Mono"';ctx.fillText('THE INPUT',78,871);
            ctx.fillStyle=ink;ctx.font='400 51px "Bricolage"';ctx.fillText(note.specimen.from,78,940);
            ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(91,970);ctx.lineTo(91,1043);ctx.lineTo(122,1043);ctx.moveTo(111,1034);ctx.lineTo(122,1043);ctx.lineTo(111,1052);ctx.stroke();
            ctx.fillStyle=accent;ctx.font='400 42px "Bricolage"';ctx.fillText(note.specimen.to,150,1054);
            ctx.fillStyle=muted;ctx.font='400 19px "IBM Plex Mono"';ctx.fillText('THE OUTPUT',150,1100);
          });
        }else if(note.layout==='manifesto'){
          // A centered, signed statement with room to breathe, rather than a list.
          reveal(amount,.29,.64,58,465,908,360,()=>{
            ctx.textAlign='center';ctx.fillStyle=accent;ctx.font='400 132px Georgia';ctx.fillText('“',TW/2,587);
            ctx.fillStyle=ink;ctx.font='400 48px "Geist"';wrap(ctx,note.lead,TW/2,645,730,64);
          });
          reveal(amount,.54,.90,58,820,908,290,()=>{
            ctx.textAlign='center';ctx.fillStyle=muted;ctx.font='400 31px "Geist"';wrap(ctx,note.body,TW/2,881,744,45);
            ctx.fillStyle=ink;ctx.font='italic 40px Georgia';ctx.fillText(note.signature,TW/2,1090);
          });
        }else{
          // The stepped route uses the card's full width and makes the move from
          // image to motion to interaction read as one continuous practice.
          reveal(amount,.28,.62,58,427,908,384,()=>{
            ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';
            stepArrow(225,503,69,330);stepArrow(535,628,72,600);
            note.mediums.forEach((word,i)=>{
              const x=[78,350,615][i],y=[493,618,743][i];
              ctx.fillStyle=i===1?accent:ink;ctx.font='400 68px "Bricolage"';ctx.textAlign='left';ctx.fillText(word,x,y);
            });
            ctx.fillStyle=muted;ctx.font='400 18px "IBM Plex Mono"';ctx.fillText('ONE SYSTEM / THREE LAYERS',78,803);
          });
          reveal(amount,.53,.91,58,835,908,295,()=>{
            ctx.strokeStyle='#bcb3a2';rule(844);
            ctx.fillStyle=ink;ctx.font='400 35px "Geist"';wrap(ctx,note.lead,78,906,865,48);
            ctx.fillStyle=muted;ctx.font='400 29px "Geist"';wrap(ctx,note.body,78,1068,865,41);
          });
        }
        reveal(amount,.84,1,58,1152,TW-116,90,()=>{
          ctx.strokeStyle='#bcb3a2';ctx.lineWidth=1;rule(1164);
          ctx.fillStyle=accent;ctx.beginPath();ctx.arc(83,1211,5,0,Math.PI*2);ctx.fill();
          ctx.fillStyle=muted;ctx.font='400 17px "IBM Plex Mono"';ctx.textAlign='right';ctx.fillText(note.foot.toUpperCase(),TW-78,1217);
        });
      }
      paint(0);tex=texture(c);tex.userData.reveal=(amount,headline)=>{const step=Math.round(score.clamp(amount)*52),h=Math.round(headline*42);if(step===lastStep&&h===lastHeadline)return;lastStep=step;lastHeadline=h;paint(step/52,h/42);tex.needsUpdate=true;};return tex;
    }
    const bioTextures=window.BIOGRAPHY.map(biographyTexture);
    const headlineStarts=[null,null,null];
    const biographyActionTexture=biographyAction?frontTexture(biographyAction):null;
    function biographyShadowTexture(){
      const c=document.createElement('canvas');c.width=512;c.height=640;const ctx=c.getContext('2d');
      const path=(x,y,w,h,r)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();};
      ctx.filter='blur(28px)';ctx.fillStyle='rgba(37,28,21,.34)';path(62,58,388,510,30);ctx.fill();
      ctx.filter='blur(11px)';ctx.fillStyle='rgba(48,37,28,.12)';path(58,54,388,510,28);ctx.fill();ctx.filter='none';
      return texture(c);
    }
    const bioShadowTex=biographyShadowTexture(),bioShadowGeo=new T.PlaneGeometry(CW+.72,CH+.72);
  const cards=plates.map((p,i)=>{
    const group=new T.Group();
    const cap=stock.clone(),side=edge.clone();
    const body=new T.Mesh(geometry,[cap,side]);body.castShadow=true;body.receiveShadow=true;
    const mountMat=new T.MeshStandardMaterial({color:0xeee8dc,roughness:.78,roughnessMap:stockRoughness,bumpMap:paperTex,bumpScale:.0014,envMapIntensity:.32});
    const frontMat=new T.MeshPhysicalMaterial({color:0xfaf7f0,roughness:.43,roughnessMap:stockRoughness,clearcoat:.24,clearcoatRoughness:.3,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2,envMapIntensity:.48,bumpMap:paperTex,bumpScale:SETTINGS.photoRelief,map:frontTexture(images[i])});
    const backMat=new T.MeshStandardMaterial({color:0xffffff,roughness:.94,roughnessMap:stockRoughness,envMapIntensity:.28,bumpMap:paperTex,bumpScale:SETTINGS.backRelief,map:backTexture(p,i)});
    const mount=new T.Mesh(mountGeo,mountMat);mount.position.z=PRINT.baseZ;mount.castShadow=true;mount.receiveShadow=true;
    const front=new T.Mesh(frontGeo,frontMat);front.position.z=PRINT.faceZ;front.receiveShadow=true;
    const back=new T.Mesh(backGeo,backMat);back.position.z=-CT/2-BEV-.0012;back.rotation.y=Math.PI;back.receiveShadow=true;
    const bioShadowMat=new T.MeshBasicMaterial({map:bioShadowTex,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide,toneMapped:false});
    const bioShadow=new T.Mesh(bioShadowGeo,bioShadowMat);bioShadow.position.set(-.12,-.16,CT/2+BEV+.045);bioShadow.visible=false;bioShadow.renderOrder=-1;
    group.add(bioShadow,body,mount,front,back);group.traverse(o=>{o.userData.index=i;});scene.add(group);
    return{group,frontMat,studyFront:frontMat.map,backMat,studyBack:backMat.map,bioShadow,bioShadowMat,materials:[cap,side,mountMat,frontMat,backMat],hover:0,frontTexture:frontMat.map,video:videos[i],playing:false,videoTime:-1,videoFailed:false};
  });
  // Three additional prints complete Interaction's ten-card surround. They
  // share artwork/geometry, own their materials, and retire before the gallery.
  const practiceTextures=practiceImages.map(img=>frontTexture(img));
  const extraCards=[1,4,7].map((index,extraIndex)=>{
    const group=cards[index].group.clone(true),materials=new Map();
    group.traverse(o=>{if(o.isMesh){const copy=m=>{if(!materials.has(m))materials.set(m,m.clone());if(m===cards[index].frontMat&&practiceTextures.length)materials.get(m).map=practiceTextures[7+extraIndex];return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);}});
    group.visible=false;scene.add(group);return{group,materials:[...materials.values()]};
  });
  // Additional tunnel cards own their materials and use eight distinct practice prints.
  const tunnelCards=practiceTextures.slice(0,8).map((texture,k)=>{
    const group=cards[1].group.clone(true),materials=new Map();
    group.traverse(o=>{if(o.isMesh){o.userData.index=8+k;const copy=m=>{if(!materials.has(m)){const c=m.clone();if(m===cards[1].frontMat)c.map=texture;materials.set(m,c);}return materials.get(m);};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);}});
    group.visible=false;scene.add(group);return{group,materials:[...materials.values()]};
  });
  // Transparent artist sits behind the final tunnel cards, then emerges beside the invitation.
  const invitationTexture=new T.Texture(contactPortrait);invitationTexture.needsUpdate=true;invitationTexture.encoding=T.sRGBEncoding;
  const invitationMaterial=new T.MeshBasicMaterial({map:invitationTexture,transparent:true,depthWrite:false,alphaTest:.015});
  const invitation=new T.Mesh(new T.PlaneGeometry(2,2*contactPortrait.height/contactPortrait.width),invitationMaterial),invitationMaterials=new Map([['artist',invitationMaterial]]);
  invitation.visible=false;scene.add(invitation);
  // A blurred silhouette receives the same upper-left light as the prints.
  // Its alpha follows the artist, so no shadow appears before the cutout does.
  const shadowSource=document.createElement('canvas');shadowSource.width=512;shadowSource.height=768;
  const shadowInk=shadowSource.getContext('2d');shadowInk.drawImage(contactPortrait,0,0,512,768);
  shadowInk.globalCompositeOperation='source-in';shadowInk.fillStyle='#655747';shadowInk.fillRect(0,0,512,768);
  const shadowBlur=document.createElement('canvas');shadowBlur.width=512;shadowBlur.height=768;
  const blurInk=shadowBlur.getContext('2d');blurInk.filter='blur(12px)';blurInk.drawImage(shadowSource,0,0);
  const invitationShadowTexture=texture(shadowBlur),invitationShadowMaterial=new T.MeshBasicMaterial({map:invitationShadowTexture,transparent:true,depthWrite:false,opacity:0,toneMapped:false});
  const invitationShadow=new T.Mesh(invitation.geometry,invitationShadowMaterial);invitationShadow.visible=false;scene.add(invitationShadow);
  const footCanvas=document.createElement('canvas');footCanvas.width=256;footCanvas.height=64;
  const footInk=footCanvas.getContext('2d');footInk.scale(128,32);const footGradient=footInk.createRadialGradient(1,1,0,1,1,1);footGradient.addColorStop(0,'rgba(72,59,44,.20)');footGradient.addColorStop(.35,'rgba(72,59,44,.11)');footGradient.addColorStop(1,'rgba(72,59,44,0)');footInk.fillStyle=footGradient;footInk.fillRect(0,0,2,2);
  const invitationFootTexture=texture(footCanvas),invitationFootMaterial=new T.MeshBasicMaterial({map:invitationFootTexture,transparent:true,depthWrite:false,opacity:0,toneMapped:false});
  const invitationFoot=new T.Mesh(new T.PlaneGeometry(1,.15),invitationFootMaterial);invitationFoot.visible=false;scene.add(invitationFoot);
  const atelier=window.createAtelierArtwork?.({T,renderer,environment,cards,practiceTextures,score,PRINT,shadowLight:light});
  // The physical floor has its own shadow pass. Render-depth separation keeps
  // cards from intersecting, but must never move their contact with the floor.
  const groundScene=new T.Scene(),groundLight=light.clone();
  groundLight.shadow=light.shadow.clone();groundScene.add(groundLight);
  const groundPlane=new T.Plane(),groundNormal=new T.Vector3();
  renderer.localClippingEnabled=true;
  const casterMaterial=new T.MeshBasicMaterial({colorWrite:false,depthWrite:false,
    clippingPlanes:[groundPlane],clipShadows:true,shadowSide:T.DoubleSide});
  const groundCasters=cards.map(()=>{const caster=new T.Mesh(geometry,casterMaterial);caster.castShadow=true;groundScene.add(caster);return caster;});
  const floorMaterial=new T.ShadowMaterial({color:0x151412,opacity:SETTINGS.shadowOpacity,depthWrite:false});
  // A broad source produces a tight contact edge and progressively softer
  // penumbra with distance. A disk kernel avoids the stock filter's repeated edges.
  floorMaterial.onBeforeCompile=shader=>{
    const chunk=T.ShaderChunk.shadowmap_pars_fragment;
    const begin=chunk.indexOf('#if defined( SHADOWMAP_TYPE_PCF )',chunk.indexOf('float getShadow('));
    const end=chunk.indexOf('#elif defined( SHADOWMAP_TYPE_PCF_SOFT )',begin);
    const filter=`#if defined( SHADOWMAP_TYPE_PCF )
      float blockerSum = 0.0, blockers = 0.0;
      for (int i = 0; i < 16; i++) {
        float a = float(i) * 2.39996323;
        vec2 disk = vec2(cos(a),sin(a)) * sqrt((float(i)+0.5)/16.0);
        float depth = unpackRGBAToDepth(texture2D(shadowMap, shadowCoord.xy + disk * 12.0 / shadowMapSize));
        if (depth < shadowCoord.z) { blockerSum += depth; blockers += 1.0; }
      }
      if (blockers > 0.0) {
        float gap = max(0.0, shadowCoord.z - blockerSum / blockers) * 64.0;
        float radius = clamp(1.0 + gap * 0.055 * shadowMapSize.x / 28.0, 1.0, 18.0);
        float shade = 0.0;
        for (int i = 0; i < 32; i++) {
          float a = float(i) * 2.39996323;
          vec2 disk = vec2(cos(a),sin(a)) * sqrt((float(i)+0.5)/32.0);
          shade += texture2DCompare(shadowMap, shadowCoord.xy + disk * radius / shadowMapSize, shadowCoord.z);
        }
        shadow = 1.0 - (1.0 - shade / 32.0) / (1.0 + gap * 0.10);
      }
    `;
    shader.fragmentShader=shader.fragmentShader.replace('#include <shadowmap_pars_fragment>',chunk.slice(0,begin)+filter+chunk.slice(end));
  };
  floorMaterial.customProgramCacheKey=()=> 'physical-ground-shadow-1';
  const floor=new T.Mesh(new T.PlaneGeometry(80,60),floorMaterial);floor.receiveShadow=true;groundScene.add(floor);
  const surfaceDetails=window.createSurfaceDetails?.({T,cards,groundScene,motion,arrival:window.StudioArrival,images,reduced});
  const state={theta:window.StudioArrival.INITIAL_THETA,arrival:null,paused:false,front:window.StudioArrival.FIRST,velocity:0,held:false,hover:-1,scroll:0,blocked:false,hidden:false};
  function stopVideos(){cards.forEach(c=>{if(c.video){c.video.pause();c.playing=false;}});}
  // Repaint only the moving print, on decoded frame changes, in the existing GSAP clock.
  // The same canvas fills the raised print while its relief, bevels and lighting stay intact.
  function animatePrint(c,i,active){
    const video=c.video;if(!video||c.videoFailed)return;
    const wanted=active&&!reduced&&!state.paused&&!state.held&&!state.hidden&&(state.hover===i||state.front===i);
    if(wanted&&!c.playing){c.playing=true;video.play().catch(()=>{c.videoFailed=true;});}
    else if(!wanted&&c.playing){video.pause();video.currentTime=0;c.playing=false;c.videoTime=-1;c.frontTexture.userData.paint(images[i]);}
    if(wanted&&video.readyState>=2&&video.currentTime!==c.videoTime){try{c.frontTexture.userData.paint(video);c.videoTime=video.currentTime;}catch{video.pause();c.videoFailed=true;c.frontTexture.userData.paint(images[i]);}}
  }
  const interaction=canvas.parentElement;
  const isControl=e=>!!e.target.closest('a,button,input,textarea');
  const pointer={x:0,y:0},pointerSmooth={x:0,y:0};
  const entranceTrails=window.createEntranceTrails?.({host:interaction,T,cards,camera,score,motion});
  const biographyAtmosphere=window.createBiographyAtmosphere?.({host:document.querySelector('#artist'),T,cards,camera,light,score,motion,image:document.querySelector('#maker-portrait')});
  const studyAtmosphere=window.createStudyAtmosphere?.({host:interaction,T,cards:[...cards,...tunnelCards],camera,score,motion});
  const wind=Array.from({length:16},()=>({value:0,speed:0}));let windScroll=null;
  const raycaster=new T.Raycaster(),ndc=new T.Vector2();
  let W=innerWidth,H=innerHeight,upp,lastTime=0,dragX=0,dragY=0,lastX=0,dragDistance=0,turnTween;
  const {phase,mix}=score;
  // The four title-frame cards float around fixed art-directed anchors. Each
  // path is a deterministic sine wave; nothing is randomized between visits.
  const gateFloat={
    0:{phase:.20,x:4,y:7,roll:.005},
    1:{phase:2.25,x:5,y:6,roll:-.004},
    2:{phase:3.75,x:4,y:8,roll:.004},
    5:{phase:5.10,x:5,y:6,roll:-.005}
  };
  function resize(){W=interaction.clientWidth;H=interaction.clientHeight;upp=2*Math.tan(28*Math.PI/360)*20/H;renderer.setPixelRatio(Math.min(devicePixelRatio||1,W<760?1.4:1.7));renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix();entranceTrails?.resize();biographyAtmosphere?.resize();studyAtmosphere?.resize();}
  resize();
  function pick(x,y){ndc.set(x/W*2-1,1-y/H*2);raycaster.setFromCamera(ndc,camera);scene.updateMatrixWorld(true);return raycaster.intersectObjects([...cards,...tunnelCards].filter(c=>c.group.visible).map(c=>c.group),true)[0]?.object.userData.index??-1;}
  // Capture the actual projected print face, including its current perspective
  // and video frame, before the dialog pauses the gallery.
  let liftedStudy=-1;
  function studyOrigin(index){
    const card=index<8?cards[index]:tunnelCards[index-8];
    if(!card?.group.visible)return null;
    scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    const group=card.group,center=new T.Vector3().setFromMatrixPosition(group.matrixWorld);
    const normal=new T.Vector3(0,0,1).transformDirection(group.matrixWorld);
    const front=normal.dot(camera.position.clone().sub(center))>=0;
    const z=front?PRINT.faceZ:-CT/2-BEV-.0012;
    const points=[[-CW/2,CH/2],[CW/2,CH/2],[CW/2,-CH/2],[-CW/2,-CH/2]];
    const rect=canvas.getBoundingClientRect();
    const quad=points.map(([x,y])=>{const v=new T.Vector3(front?x:-x,y,z).applyMatrix4(group.matrixWorld).project(camera);return{x:rect.left+(v.x+1)*W/2,y:rect.top+(1-v.y)*H/2};});
    const xs=quad.map(p=>p.x),ys=quad.map(p=>p.y);
    const width=Math.max(...xs)-Math.min(...xs),height=Math.max(...ys)-Math.min(...ys);
    if(width<12||height<20||Math.max(...xs)<0||Math.min(...xs)>W||Math.max(...ys)<0||Math.min(...ys)>H||width>W*3||height>H*3)return null;
    const face=group.children.find(o=>o.isMesh&&Math.abs(o.position.z-z)<.00001);
    const source=face?.material?.map?.image;
    if(!source)return null;
    const snapshot=document.createElement('canvas');snapshot.width=640;snapshot.height=800;
    const ctx=snapshot.getContext('2d');ctx.fillStyle='#eee8dc';ctx.fillRect(0,0,640,800);
    ctx.drawImage(source,7,7,626,786);
    return{quad,snapshot,index};
  }
  function hoverAt(x,y){const index=pick(x,y);state.hover=index;onHover?.(index,x,y);}
  interaction.addEventListener('pointerdown',e=>{if(isControl(e)||(state.blocked||state.scroll>.01))return;turnTween?.kill();state.held=true;state.velocity=0;dragX=lastX=e.clientX;dragY=e.clientY;dragDistance=0;interaction.setPointerCapture(e.pointerId);canvas.classList.add('dragging');});
  interaction.addEventListener('pointermove',e=>{
    if(state.blocked)return;pointer.x=e.clientX/W*2-1;pointer.y=e.clientY/H*2-1;
    if(state.held){const d=(e.clientX-lastX)*.004;state.theta+=d;state.velocity=d;lastX=e.clientX;dragDistance=Math.max(dragDistance,Math.hypot(e.clientX-dragX,e.clientY-dragY));state.hover=-1;onHover?.(-1,e.clientX,e.clientY);}
    else if(state.scroll<.01||(state.scroll>=score.STUDIES.start&&state.scroll<score.STUDIES.end))hoverAt(e.clientX,e.clientY);
  });
  interaction.addEventListener('pointerup',e=>{if(!state.held)return;state.held=false;canvas.classList.remove('dragging');if(interaction.hasPointerCapture(e.pointerId))interaction.releasePointerCapture(e.pointerId);});
  interaction.addEventListener('click',e=>{const flight=state.scroll>=score.STUDIES.start&&state.scroll<score.STUDIES.end;if(isControl(e)||state.blocked||(!flight&&state.scroll>.01)||(!flight&&dragDistance>=7))return;state.velocity=0;const i=pick(e.clientX,e.clientY);if(i>=0)onSelect(i);});
  interaction.addEventListener('pointercancel',()=>{state.held=false;state.velocity=0;canvas.classList.remove('dragging');});
  interaction.addEventListener('lostpointercapture',()=>{state.held=false;canvas.classList.remove('dragging');});
  interaction.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;state.hover=-1;onHover?.(-1);});
  function step(direction){if((state.blocked||state.scroll>.01))return;turnTween?.kill();state.velocity=0;const target=Math.round(state.theta/STEP)*STEP-direction*STEP;if(window.gsap&&!reduced)turnTween=gsap.to(state,{theta:target,duration:.9,ease:'expo.inOut'});else state.theta=target;}
  function render(time){
    const dt=Math.min(.05,lastTime?time-lastTime:.016);lastTime=time;
    const active=state.scroll<.01&&!state.blocked&&state.arrival===null;
    const revealBeats=[[score.INTRO.cardStart+.08,score.INTRO.cardEnd+.16],[score.INTRO.secondStart+.05,score.INTRO.secondEnd+.24],[score.INTRO.thirdStart+.05,score.INTRO.thirdEnd+.24]];
    bioTextures.forEach((tex,j)=>{
      const start=[4.68,6.20,7.60][j];
      if(state.scroll<revealBeats[j][0]-.1)headlineStarts[j]=null;
      if(state.scroll>=start&&headlineStarts[j]===null)headlineStarts[j]=time;
      const progress=headlineStarts[j]===null?0:phase(time,headlineStarts[j],headlineStarts[j]+[1.25,1.55,1.35][j]);
      tex.userData.reveal(phase(state.scroll,...revealBeats[j]),progress);
    });
    // Change the reverse only while the card is fully covered or out of view.
    const biographyActive=state.scroll>1.88&&state.scroll<score.INTRO.exitEnd;
    score.FOCUS.forEach((index,j)=>{
      const c=cards[index],back=biographyActive?bioTextures[j]:c.studyBack;
      if(c.backMat.map!==back){
        c.backMat.map=back;
        // Modulate the paper's fill light by its printed texture: a uniform
        // emissive wash lifted the first card's black ink into grey.
        c.backMat.emissiveMap=biographyActive?back:null;
        c.backMat.needsUpdate=true;
      }
      // Balance the differently angled stocks without washing out their ink.
      // All three headings keep the same rich face and raised-text finish.
      c.backMat.emissive.setHex(biographyActive?0xf4eee5:0x000000);
      c.backMat.emissiveIntensity=biographyActive?[.085,.035,.018][j]:0;
      const shadowBeat=phase(state.scroll,revealBeats[j][0]-.08,revealBeats[j][1]-.02)*(1-phase(state.scroll,score.INTRO.holdEnd-.08,score.INTRO.exitEnd));
      c.bioShadow.visible=biographyActive&&shadowBeat>.002;
      c.bioShadowMat.opacity=[.24,.16,.22][j]*shadowBeat;
    });
    // Action C belongs only to the artist introduction. Card 01's original
    // study texture remains intact and is restored before the practice stack.
    const actionCard=cards[score.FOCUS[0]],actionActive=state.scroll>1.88&&state.scroll<=score.INTRO.holdEnd;
    const actionFace=actionActive&&biographyActionTexture?biographyActionTexture:actionCard.studyFront;
    if((state.scroll<=score.INTRO.holdEnd||state.scroll>=score.PRACTICE.gatherEnd)&&actionCard.frontMat.map!==actionFace){actionCard.frontMat.map=actionFace;actionCard.frontMat.needsUpdate=true;}
    if(state.scroll<=score.INTRO.holdEnd||state.scroll>=score.PRACTICE.gatherEnd){
      score.FOCUS.slice(1).forEach(i=>{const c=cards[i];if(c.frontMat.map!==c.studyFront){c.frontMat.map=c.studyFront;c.frontMat.needsUpdate=true;}});
    }
    if(active&&!reduced&&!state.paused&&!state.held){state.theta+=window.StudioArrival.driftSpeed(W)*dt+state.velocity;state.velocity*=Math.pow(.9,dt*60);}
    const front=score.ORDER[(Math.round(state.theta/STEP)%8+8)%8];if(front!==state.front){state.front=front;onFront(front);}
    const {poses,extraPoses=[],shadowPoses,rig}=state.arrival===null?score.scene(state.scroll,W,H,state.theta):window.StudioArrival.scene(state.arrival,W,H);
    pointerSmooth.x=mix(pointerSmooth.x,pointer.x,1-Math.exp(-dt*4));pointerSmooth.y=mix(pointerSmooth.y,pointer.y,1-Math.exp(-dt*4));
    const invite=phase(state.scroll,score.PRACTICE.interactionStart,score.PRACTICE.interactionEnd)*(1-phase(state.scroll,score.PRACTICE.gatherStart,score.PRACTICE.gatherEnd));
    if(invite&&!state.blocked){score.FOCUS.forEach((i,j)=>{const p=poses[i];p.ry+=pointerSmooth.x*.12*invite;p.rx-=pointerSmooth.y*.09*invite;p.x+=pointerSmooth.x*.045*invite*(j===0?1:-1);});}
    atelier?.update(state.scroll,time,pointerSmooth,dt);
    // Light spring response to scroll speed; individual damping prevents a chorus.
    const breezeGate=phase(state.scroll,15.75,16.6)*(1-phase(state.scroll,26.3,27.1));
    const delta=windScroll===null?0:state.scroll-windScroll;windScroll=state.scroll;
    const gust=reduced||state.blocked||state.hidden||Math.abs(delta)>.35?0:Math.max(-1,Math.min(1,delta/Math.max(dt,.001)*.7));
    wind.forEach((w,i)=>{
      const stiffness=34+(i%5)*5,damping=9+(i%4)*1.3,target=gust*(.65+(i%3)*.13);
      const step=Math.min(dt,1/30);w.speed+=((target-w.value)*stiffness-w.speed*damping)*step;w.value+=w.speed*step;
      if(!breezeGate||state.blocked||reduced){w.value=0;w.speed=0;}
    });
    const windCard=(group,i)=>{const w=wind[i].value*breezeGate*(W<=760?.65:1),a=i*2.39996;
      group.rotation.y+=w*(.024+Math.sin(a)*.012);group.rotation.x+=w*Math.cos(a)*.015;group.rotation.z+=w*Math.sin(a+.7)*.012;
    };
    const lean=reduced||state.blocked||state.arrival!==null?0:1;camera.setViewOffset(W,H,pointerSmooth.x*4*lean,-pointerSmooth.y*3*lean,W,H);
    const floatWeight=reduced||state.arrival!==null?0:phase(state.scroll,.72,.98)*(1-phase(state.scroll,1.34,1.68));
    cards.forEach((c,i)=>{const p=poses[i],f=gateFloat[i];let fx=0,fy=0,fr=0;
      if(f&&floatWeight){const depth=(20-p.z)/20,t=time*.72+f.phase;fx=Math.sin(t)*f.x*upp*depth*floatWeight;fy=Math.cos(t*.83)*f.y*upp*depth*floatWeight;fr=Math.sin(t*.67)*f.roll*floatWeight;}
      c.hover=mix(c.hover,state.hover===i&&active&&!reduced?.04:0,1-Math.exp(-dt*8));c.group.position.set(p.x+fx,p.y+c.hover+fy,p.z);c.group.rotation.set(p.rx,p.ry,p.rz+fr);c.group.scale.setScalar(p.s);c.materials.forEach(m=>{m.transparent=p.alpha<1;m.opacity=p.alpha;m.depthWrite=p.alpha>.5;});c.group.visible=p.alpha>.005;});
    // Print skins use a small depth offset above their bevels. At the new small
    // scales this prevents depth-buffer quantization from exposing the mount.
    const studioFloat=reduced||state.blocked?0:phase(state.scroll,10.10,10.40)*(1-phase(state.scroll,15.25,16.35));
    const floatCard=(group,p,i)=>{
      if(!studioFloat)return;
      const depth=(20-p.z)/20,t=time*.52+i*1.71,amplitude=i===0?1.8:6.5;
      group.position.x+=Math.sin(t*.71)*amplitude*.5*upp*depth*studioFloat;
      group.position.y+=Math.cos(t)*amplitude*upp*depth*studioFloat;
      // Camera-parallel drift keeps the collision-separated depth slabs intact.
    };
    cards.forEach((c,i)=>{if(c.group.visible)floatCard(c.group,poses[i],i);});
    extraCards.forEach((c,i)=>{
      const p=extraPoses[i];c.group.visible=!!p&&p.alpha>.005&&state.scroll>12;
      if(!c.group.visible)return;
      c.group.position.set(p.x,p.y,p.z);c.group.rotation.set(p.rx,p.ry,p.rz);c.group.scale.setScalar(p.s);
      c.materials.forEach(m=>{m.transparent=p.alpha<1;m.opacity=p.alpha;m.depthWrite=p.alpha>.5;});floatCard(c.group,p,i+8);
    });
    tunnelCards.forEach((c,k)=>{
      const p=score.flightPose(state.scroll,W,H,8+k);p.alpha*=phase(state.scroll,16.48+k*.055,17.08+k*.055);
      c.group.visible=p.alpha>.005;if(!c.group.visible)return;
      c.group.position.set(p.x,p.y,p.z);c.group.rotation.set(p.rx,p.ry,p.rz);c.group.scale.setScalar(p.s);
      c.materials.forEach(m=>{m.transparent=p.alpha<1;m.opacity=p.alpha;m.depthWrite=p.alpha>.5;});
    });
    cards.forEach((c,i)=>{if(c.group.visible)windCard(c.group,i);});
    tunnelCards.forEach((c,i)=>{if(c.group.visible)windCard(c.group,i+8);});
    if(breezeGate){
      // Keep the tilt inside disjoint depth slabs, preserving each camera ray.
      const prints=[...cards,...tunnelCards,...extraCards],posed=prints.map(({group:g})=>({x:g.position.x,y:g.position.y,z:g.position.z,rx:g.rotation.x,ry:g.rotation.y,rz:g.rotation.z,s:g.scale.x}));
      const separated=motion.separateLayers(posed,[...score.TUNNEL_ORDER,16,17,18].filter(i=>prints[i].group.visible));
      prints.forEach(({group:g},i)=>{const p=separated[i];g.position.set(p.x,p.y,p.z);g.scale.setScalar(p.s);});
    }
    const ip=score.contactPose(state.scroll,W,H);
    invitation.visible=state.scroll>15.95&&ip.alpha>.005;
    if(invitation.visible){invitation.position.set(ip.x,ip.y,ip.z);invitation.rotation.set(ip.rx,ip.ry,ip.rz);invitation.scale.setScalar(ip.s);invitationMaterials.forEach(m=>{m.transparent=true;m.opacity=ip.alpha;m.depthWrite=false;});}
    invitationShadow.visible=invitationFoot.visible=invitation.visible;
    if(invitation.visible){
      invitationShadow.position.set(ip.x+.12*ip.s,ip.y-.10*ip.s,ip.z-.08);invitationShadow.scale.setScalar(ip.s);invitationShadowMaterial.opacity=ip.alpha*.15;
      invitationFoot.position.set(ip.x-.06*ip.s,ip.y-1.43*ip.s,ip.z-.06);invitationFoot.scale.setScalar(ip.s);invitationFootMaterial.opacity=ip.alpha*.65;
    }
    entranceTrails?.update(state.scroll,time,dt,!reduced&&!state.hidden&&state.arrival===null&&!state.blocked);
    biographyAtmosphere?.update(state.scroll);
    cards.forEach((c,i)=>animatePrint(c,i,active));
    // The floor stays fixed. Shadows only react once the authored cards move
    // (score .10), then dissolve as the carousel gives way to the title frame.
    const ground=.1-(CH/2+BEV)*.8-.018;
    floor.rotation.x=-Math.PI/2+rig.pitch;
    floor.position.set(0,ground*Math.cos(rig.pitch)*rig.scale+rig.centerY,ground*Math.sin(rig.pitch)*rig.scale);
    floor.material.opacity=SETTINGS.shadowOpacity*(1-phase(state.scroll,.10,.55));
    surfaceDetails?.update({state,rig,floor,dt,width:W});
    if(liftedStudy>=0){const lifted=liftedStudy<8?cards[liftedStudy]:tunnelCards[liftedStudy-8];if(lifted)lifted.group.visible=false;}
    studyAtmosphere?.update(state.scroll,time,dt,!reduced&&!state.hidden&&!state.blocked);
    if(floor.material.opacity>.0001){
      groundNormal.set(0,Math.cos(rig.pitch),Math.sin(rig.pitch));
      groundPlane.setFromNormalAndCoplanarPoint(groundNormal,floor.position);
      groundCasters.forEach((caster,i)=>{const p=shadowPoses[i];
        caster.position.set(p.x,p.y+cards[i].hover,p.z);caster.rotation.set(p.rx,p.ry,p.rz);caster.scale.setScalar(p.s);caster.visible=p.alpha>.005;
      });
      renderer.render(groundScene,camera);
      renderer.clearDepth();renderer.autoClear=false;
      renderer.render(scene,camera);renderer.autoClear=true;
    }else renderer.render(scene,camera);
  }
  return {render,resize,step,studyOrigin,setLiftedStudy(index){liftedStudy=index;},setArrival(t){if(t===null&&state.arrival!==null)state.theta=window.StudioArrival.finalTheta(W);else if(t!==null)state.theta=window.StudioArrival.theta(t,W);state.arrival=t;state.hover=-1;canvas.dataset.arrival=t===null?'done':t.toFixed(3);},setScroll(s){state.scroll=s;if(s>.01){turnTween?.kill();state.held=false;state.velocity=0;state.hover=-1;canvas.classList.remove('dragging');}},setBlocked(v){state.blocked=v;state.held=false;state.velocity=0;state.hover=-1;if(v)stopVideos();},setHidden(v){state.hidden=v;if(v)stopVideos();},togglePause(){state.paused=!state.paused;return state.paused;},get state(){return{theta:state.theta,paused:state.paused,front:state.front};},dispose(){studyAtmosphere?.dispose();biographyAtmosphere?.dispose();entranceTrails?.dispose();surfaceDetails?.dispose();tunnelCards.forEach(c=>c.materials.forEach(m=>m.dispose()));practiceTextures.forEach(t=>t.dispose());invitation.geometry.dispose();invitationTexture.dispose();invitationShadowTexture.dispose();invitationShadowMaterial.dispose();invitationFoot.geometry.dispose();invitationFootTexture.dispose();invitationFootMaterial.dispose();invitationMaterials.forEach(m=>m.dispose());extraCards.forEach(c=>c.materials.forEach(m=>m.dispose()));atelier?.dispose();floor.geometry.dispose();floorMaterial.dispose();casterMaterial.dispose();groundLight.shadow.map?.dispose();stopVideos();cards.forEach(c=>{c.materials.forEach(m=>{m.map?.dispose();m.dispose();});c.bioShadowMat.dispose();});bioShadowGeo.dispose();bioShadowTex.dispose();biographyActionTexture?.dispose();environment.dispose();renderer.dispose();}};
};

  