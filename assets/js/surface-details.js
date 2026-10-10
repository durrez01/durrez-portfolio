
    /* V11 / warm, crafted, quiet. Existing palette, materials and choreography.
 * Three small physical responses; driven only by the gallery's shared clock.
 * No postprocessing, new artwork, extra lights or independent animation loop. */
window.createSurfaceDetails = function(options) {
  'use strict';
  const {T,cards,groundScene,motion,arrival,images,reduced}=options;
  // The impact remains in the floor throughout the hero; only scroll retires it.
  const SETTINGS={spillOpacity:.16,glintOpacity:.82,crackOpacity:.68};
  const {width:W,height:H,radius:R,depth:D,bevel:B}=motion.CARD;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const phase=(x,a,b)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const vertexShader='varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
  const floorGroup=new T.Group();groundScene.add(floorGroup);
  const plane=new T.PlaneGeometry(1,1);

  // A small image sample supplies the actual artwork's reflected color. Only
  // the playing video is resampled, at four Hz, never a GPU readback or full image.
  const sample=document.createElement('canvas');sample.width=sample.height=8;
  const ctx=sample.getContext('2d',{willReadFrequently:true});
  function artworkColor(source,fallback){
    try{
      ctx.clearRect(0,0,8,8);ctx.drawImage(source,0,0,8,8);
      const data=ctx.getImageData(0,0,8,8).data;let r=0,g=0,b=0,weight=0;
      for(let i=0;i<data.length;i+=4){
        const hi=Math.max(data[i],data[i+1],data[i+2]),lo=Math.min(data[i],data[i+1],data[i+2]);
        const w=.2+(hi-lo)/255;r+=data[i]*w;g+=data[i+1]*w;b+=data[i+2]*w;weight+=w;
      }
      const color=new T.Color(r/weight/255,g/weight/255,b/weight/255);
      color.convertSRGBToLinear();return color.lerp(new T.Color(0xefe6d8),.18);
    }catch{return fallback.clone();}
  }
  const spills=cards.map((card,i)=>{
    const color=artworkColor(images[i],new T.Color(0xc9b49b));
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,
      uniforms:{uColor:{value:color.clone()},uAlpha:{value:0}},vertexShader,
      fragmentShader:`varying vec2 vUv;uniform vec3 uColor;uniform float uAlpha;
        void main(){vec2 p=(vUv-.5)*2.;float r=dot(p,p);
          float a=exp(-r*3.8)*(1.-smoothstep(.55,1.,r));
          gl_FragColor=vec4(uColor,a*uAlpha);
          #include <encodings_fragment>
        }`});
    const mesh=new T.Mesh(plane,material);mesh.renderOrder=-3;floorGroup.add(mesh);
    return{mesh,material,target:color};
  });

  // Fractured plaster: fine irregular fissures, lit broken edges and granular
  // chips. Draw once at 2x resolution; the mark stays fixed at first contact.
  const crackCanvas=document.createElement('canvas');crackCanvas.width=crackCanvas.height=1024;
  const cc=crackCanvas.getContext('2d');
  cc.scale(2,2);
  let crackSeed=417;
  const crackRandom=()=>{crackSeed=(1664525*crackSeed+1013904223)>>>0;return crackSeed/4294967296;};
  const paths=[
    [[256,256],[227,247],[201,262],[176,253],[142,271],[104,264],[60,279]],
    [[256,256],[285,269],[310,258],[341,277],[373,270],[411,289],[449,283]],
    [[256,256],[247,291],[267,319],[257,352],[278,382],[270,422]],
    [[256,256],[274,230],[263,203],[283,180],[279,152]],
    [[176,253],[162,230],[142,220]],[[341,277],[353,305],[374,317]],
    [[257,352],[234,366],[222,392]]
  ];
  function stroke(points,color,width,dx,dy){
    cc.strokeStyle=color;cc.lineWidth=width;cc.lineJoin='round';cc.lineCap='round';cc.beginPath();
    points.forEach(([x,y],i)=>i?cc.lineTo(x+dx,y+dy):cc.moveTo(x+dx,y+dy));cc.stroke();
  }
  function fracturePath(path){
    const points=[path[0]];
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),steps=Math.ceil(length/4.5);
      for(let j=1;j<=steps;j++){
        const t=j/steps,jitter=j===steps?0:(crackRandom()-.5)*3;
        points.push([a[0]+dx*t-dy/length*jitter,a[1]+dy*t+dx/length*jitter]);
      }
    }
    return points;
  }
  const fissures=paths.map(fracturePath);
  // Short secondary splits stop irregularly; they never make a uniform starburst.
  fissures.slice(0,4).forEach((path,k)=>{
    for(let j=7;j<path.length-5;j+=11){
      const [x,y]=path[j],side=(j+k)%2?1:-1,reach=12+crackRandom()*15;
      fissures.push(fracturePath([[x,y],[x+side*reach*.4,y+reach*.45],[x+side*reach*.7,y+reach]]));
    }
  });
  fissures.forEach((path,i)=>{
    stroke(path,'rgba(97,80,58,.12)',i<4?5:2.2,.5,1);
    for(let j=1;j<path.length;j++){
      const taper=1-j/path.length,width=(i<4?1.65:.8)*(.25+.75*taper),segment=[path[j-1],path[j]];
      stroke(segment,'rgba(255,252,241,.92)',width+1.0,-.7,1.2);
      stroke(segment,'rgba(102,83,60,.84)',width,0,0);
      if(i<4)stroke(segment,'rgba(57,48,37,.46)',width*.35,.2,0);
      const [x,y]=path[j];
      for(let n=0;n<2;n++){
        const offset=(crackRandom()-.5)*8,r=.2+crackRandom()*.7;
        cc.fillStyle=crackRandom()>.5?'rgba(107,91,67,.30)':'rgba(255,253,243,.76)';
        cc.beginPath();cc.arc(x+offset,y+(crackRandom()-.5)*6,r,0,Math.PI*2);cc.fill();
      }
      if(j%5===0&&i<4){
        const chip=.7+crackRandom()*1.5;
        cc.fillStyle='rgba(127,108,82,.25)';cc.beginPath();cc.moveTo(x-1,y);cc.lineTo(x+chip,y-1);cc.lineTo(x+chip*.4,y+chip*1.6);cc.closePath();cc.fill();
      }
    }
  });
  const crackTexture=new T.CanvasTexture(crackCanvas);crackTexture.encoding=T.sRGBEncoding;
  crackTexture.anisotropy=4;
  const crackMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,depthTest:false,
    uniforms:{uMap:{value:crackTexture},uRadius:{value:0},uAlpha:{value:0}},vertexShader,
    fragmentShader:`varying vec2 vUv;uniform sampler2D uMap;uniform float uRadius;uniform float uAlpha;
      void main(){vec4 c=texture2D(uMap,vUv);float r=length((vUv-.5)*2.);
        c.a*=uAlpha*(1.-smoothstep(uRadius-.09,uRadius,r));gl_FragColor=c;}`});
  const crack=new T.Mesh(plane,crackMaterial);crack.scale.set(2.15,2.6,1);crack.renderOrder=-1;floorGroup.add(crack);

  // A narrow ribbon follows the real rounded bevel. Its UV follows perimeter
  // distance so the catch slides around corners without a flashing join.
  function outline(inset){
    const x=W/2-inset,y=H/2-inset,r=R-inset,points=[];
    const corners=[[x-r,y-r,0],[-x+r,y-r,Math.PI/2],[-x+r,-y+r,Math.PI],[x-r,-y+r,Math.PI*1.5]];
    corners.forEach(([cx,cy,a])=>{for(let j=0;j<=12;j++){const t=a+j/12*Math.PI/2;points.push([cx+Math.cos(t)*r,cy+Math.sin(t)*r]);}});
    points.push(points[0]);return points;
  }
  const outer=outline(-.0015),inner=outline(.011),positions=[],uvs=[],indices=[];
  let length=0;const distances=[0];for(let i=1;i<outer.length;i++){length+=Math.hypot(outer[i][0]-outer[i-1][0],outer[i][1]-outer[i-1][1]);distances.push(length);}
  outer.forEach((p,i)=>{positions.push(...p,0,...inner[i],0);uvs.push(distances[i]/length,0,distances[i]/length,1);if(i<outer.length-1){const j=i*2;indices.push(j,j+1,j+2,j+1,j+3,j+2);}});
  const rim=new T.BufferGeometry();rim.setAttribute('position',new T.Float32BufferAttribute(positions,3));rim.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));rim.setIndex(indices);
  const glints=cards.map(card=>{
    const material=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,
      uniforms:{uHead:{value:0},uWidth:{value:.075},uAlpha:{value:0}},vertexShader,
      fragmentShader:`varying vec2 vUv;uniform float uHead,uWidth,uAlpha;
        void main(){float d=abs(fract(vUv.x-uHead+.5)-.5);
          float catchLight=exp(-pow(d/uWidth,2.));
          float edge=pow(max(0.,sin(vUv.y*3.14159265)),.65);
          gl_FragColor=vec4(1.,.98,.92,catchLight*edge*uAlpha);}`});
    const front=new T.Mesh(rim,material),back=new T.Mesh(rim,material);
    front.position.z=D/2+B+.001;back.position.z=-D/2-B-.001;
    // Added after practice/tunnel cloning; they cannot inherit these accents.
    front.raycast=back.raycast=()=>{};
    card.group.add(front,back);return{material,front,back};
  });
  let impactAge=-1,previousTheta=null,speed=0,sampleAge=0;
  function update({state,rig,floor,dt,width}){
    const weight=reduced?0:1-phase(state.scroll,.08,.5);
    floorGroup.visible=weight>.001;
    floorGroup.position.copy(floor.position);floorGroup.quaternion.copy(floor.quaternion);floorGroup.scale.setScalar(rig.scale);
    const theta=state.arrival===null?state.theta:arrival.theta(state.arrival,width);
    const delta=previousTheta===null?0:Math.atan2(Math.sin(theta-previousTheta),Math.cos(theta-previousTheta));previousTheta=theta;
    speed+=(Math.min(4,Math.abs(delta)/Math.max(dt,.001))-speed)*(1-Math.exp(-dt*9));
    if(state.arrival!==null)impactAge=state.arrival-arrival.start(arrival.FIRST)-arrival.FALL;
    const opening=phase(impactAge,0,.23);
    crack.visible=weight>0&&impactAge>=0;
    const hitAngle=arrival.INITIAL_THETA-arrival.FIRST*Math.PI/4;
    crack.position.set(Math.sin(hitAngle)*2.92,-Math.cos(hitAngle)*2.92,.006);
    crackMaterial.uniforms.uRadius.value=opening*.98;
    crackMaterial.uniforms.uAlpha.value=SETTINGS.crackOpacity*weight*opening;
    sampleAge+=dt;const sampleNow=sampleAge>.25;if(sampleNow)sampleAge=0;
    cards.forEach((card,i)=>{
      const angle=theta-i*Math.PI/4,front=Math.max(0,Math.cos(angle));
      const arrived=state.arrival===null?1:phase(state.arrival-arrival.start(i),arrival.FALL-.12,arrival.FALL+.15);
      const spill=spills[i];spill.mesh.visible=weight>.001&&front>.01&&arrived>.001;
      spill.mesh.position.set(Math.sin(angle)*2.92,-Math.cos(angle)*2.92-.2,.002);
      spill.mesh.rotation.z=-angle;spill.mesh.scale.set(2.2,2.05,1);
      if(sampleNow&&weight>0&&card.playing&&card.video?.readyState>=2)spill.target.copy(artworkColor(card.video,spill.target));
      spill.material.uniforms.uColor.value.lerp(spill.target,1-Math.exp(-dt*2.5));
      spill.material.uniforms.uAlpha.value=SETTINGS.spillOpacity*weight*arrived*Math.pow(front,1.5);
      const glint=glints[i],lightAngle=angle+.42;
      const strength=Math.pow(Math.max(0,Math.cos(lightAngle)),5)+.32*Math.pow(Math.max(0,-Math.cos(lightAngle)),8);
      glint.front.visible=glint.back.visible=weight>.001&&arrived>.001&&!reduced;
      glint.material.uniforms.uHead.value=.1+angle/(Math.PI*2)*.9;
      glint.material.uniforms.uWidth.value=.065+Math.min(speed,2)*.022;
      glint.material.uniforms.uAlpha.value=SETTINGS.glintOpacity*strength*weight*arrived;
    });
  }
  function dispose(){floorGroup.removeFromParent();spills.forEach(s=>s.material.dispose());crackMaterial.dispose();crackTexture.dispose();plane.dispose();rim.dispose();glints.forEach(g=>{g.front.removeFromParent();g.back.removeFromParent();g.material.dispose();});}
  return{update,dispose};
};

  