
    /* Opening choreography, in seconds. The same eight physical cards land before
   the scroll score takes over. No physics engine or accumulated transforms. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./score.js'),require('./card-geometry.js'));
  else root.StudioArrival=factory(root.StudioScore,root.FieldbookMotion);
})(typeof window==='object'?window:globalThis,function(S,G){
  'use strict';
  const DURATION=3,FALL=.72,STAGGER=.18,SETTLE=.48,ROTATE_START=FALL;
  const FIRST=4,INITIAL_THETA=S.ORDER.indexOf(FIRST)*Math.PI/4;
  const driftSpeed=W=>W<=760?.01:.035;
  const finalTheta=W=>INITIAL_THETA+driftSpeed(W)*(DURATION-ROTATE_START);
  const start=i=>{const rank=(S.ORDER.indexOf(i)-S.ORDER.indexOf(FIRST)+8)%8;return rank===0?0:.48+(rank-1)*STAGGER;};
  // The featured letter card makes contact before the ring moves. From that frame onward the
  // opening and live carousel share the same linear angular velocity, so there
  // is no acceleration or speed change while the remaining cards arrive.
  const theta=(time,W)=>INITIAL_THETA+driftSpeed(W)*Math.max(0,Math.min(DURATION,time)-ROTATE_START);
  function scene(time,W,H){
    const destination=S.scene(0,W,H,theta(time,W)),{rig}=destination;
    if(time>=DURATION)return destination;
    const poses=destination.poses.map((target,i)=>{
      const age=time-start(i),flight=S.clamp(age/FALL),landed=Math.max(0,age-FALL);
      // Acceleration into contact, followed by a very small, damped rebound.
      // Orientation is set during descent, never by a second tilt after landing.
      const fall=flight*flight,turn=S.phase(flight,.22,1);
      const settle=1-S.phase(landed,.22,SETTLE);
      const rebound=landed>0?.105*rig.scale*Math.exp(-7*landed)*Math.abs(Math.sin(13*landed))*settle:0;
      const recoil=landed>0?.026*Math.exp(-7*landed)*Math.sin(15*landed)*settle:0;
      const initialRx=i===FIRST?0:-.10,initialRz=i===FIRST?0:(i%2?1:-1)*.025;
      return {...target,
        x:target.x*S.phase(flight,.05,.90),
        y:target.y+(1-fall)*9*rig.scale+rebound,
        z:target.z+(1-fall)*2.7,
        rx:S.mix(initialRx,target.rx,turn)+recoil,
        ry:target.ry*turn,
        rz:S.mix(initialRz,target.rz,turn)+recoil,
        alpha:S.phase(age,.025,.11)
      };
    });
    // The staggered descent is collision-free in physical world space. Every
    // target comes from the same moving ring, so landed cards keep turning while
    // the remaining cards descend and the final handoff needs no correction.
    return {...destination,poses,shadowPoses:poses};
  }
  return Object.freeze({FIRST,INITIAL_THETA,DURATION,FALL,STAGGER,SETTLE,ROTATE_START,driftSpeed,finalTheta,start,theta,scene});
});

  