
    /* Shared geometry for the live scene and the scroll collision checks.
 * Prints keep their perspective while being assigned disjoint depth layers.
 * This prevents intersecting sheets at EVERY scroll position, including reversals.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FieldbookMotion = factory();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';
  const CARD = Object.freeze({ width: 2, height: 2.5, depth: .0425, bevel: .00625, radius: .10625 });
  // A mounted print above the stock, with a shallow bevel and a satin image face.
  const PRINT = { inset: .04, depth: .009, bevel: .0025, gap: .0005, skinGap: .0004 };
  PRINT.baseZ = CARD.depth / 2 + CARD.bevel + PRINT.gap + PRINT.bevel;
  PRINT.faceZ = PRINT.baseZ + PRINT.depth + PRINT.bevel + PRINT.skinGap;
  Object.freeze(PRINT);
  // Conservative half-extents include the raised front, not just the card stock.
  const VOLUME = Object.freeze({ x: CARD.width / 2 + CARD.bevel,
    y: CARD.height / 2 + CARD.bevel, z: PRINT.faceZ + .001 });
  const clamp = v => Math.max(0, Math.min(1, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const phase = (v, a, b) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

  function heroRig(width, height, heroHeight, scroll) {
    const aspect = width / height, t2 = 2 * Math.tan(28 * Math.PI / 360);
    // The original carousel's proportions, camera elevation and physical ring.
    const distance = Math.max(8.7, 2.92 + (1.6 / .82) / (t2 * aspect), 2.92 + 2 / ((width <= 760 ? .42 : aspect < 1.15 ? .5 : .58) * t2));
    const elevation = aspect < 1 ? 1.15 : 1.4;
    const pitch = Math.atan2(elevation, distance), scale = 20 / Math.hypot(distance, elevation);
    return { pitch, scale, centerY: (height / 2 - heroHeight * (width <= 760 ? .43 : .47) + scroll) * t2 * 20 / height };
  }

  function orbitPose(index, theta, rig) {
    // Reverse the physical orbit while keeping the next study numbered 01–08.
    const angle = -index * Math.PI / 4 + theta;
    const z = Math.cos(angle) * 2.92, c = Math.cos(rig.pitch), s = Math.sin(rig.pitch);
    return { x: Math.sin(angle) * 2.92 * rig.scale, y: (.1 * c - z * s) * rig.scale + rig.centerY,
      z: (.1 * s + z * c) * rig.scale, rx: rig.pitch, ry: Math.atan2(Math.sin(angle), Math.cos(angle)), rz: 0, s: .8 * rig.scale };
  }

  function gatherPose(orbit, stack, progress, rank) {
    const turn = phase(progress, 0, .44);
    const travel = phase(progress, .28 + rank * .012, .90 + rank * .012);
    return { x: lerp(orbit.x, stack.x, travel), y: lerp(orbit.y, stack.y, travel), z: lerp(orbit.z, stack.z, travel),
      rx: lerp(orbit.rx, 0, turn), ry: lerp(orbit.ry, 0, turn), rz: stack.rz * travel, s: lerp(orbit.s, stack.s, travel) };
  }

  function depthRadius(p) {
    const sx = Math.sin(p.rx), cx = Math.cos(p.rx), sy = Math.sin(p.ry), cy = Math.cos(p.ry), sz = Math.sin(p.rz), cz = Math.cos(p.rz);
    // Third row of an XYZ Euler matrix, including stock, mount and image surface.
    return p.s * (Math.abs(sx * sz - cx * sy * cz) * VOLUME.x
      + Math.abs(sx * cz + cx * sy * sz) * VOLUME.y
      + Math.abs(cx * cy) * VOLUME.z);
  }

  function separateLayers(poses, order, cameraZ = 20) {
    let boundary = Infinity;
    for (const index of order) {
      const p = poses[index], depth = depthRadius(p);
      if (p.z + depth > boundary) {
        const oldZ = p.z, ratio = depth / (cameraZ - oldZ);
        p.z = (boundary - cameraZ * ratio) / (1 - ratio);
        const factor = (cameraZ - p.z) / (cameraZ - oldZ);
        // All vertices stay on exactly the same camera rays. No size or position jump.
        p.x *= factor; p.y *= factor; p.s *= factor;
      }
      boundary = p.z - depthRadius(p) - .018;
    }
    return poses;
  }
  return Object.freeze({ CARD, PRINT, VOLUME, heroRig, orbitPose, gatherPose, depthRadius, separateLayers });
});

  