// Layout and the parts rebuilt while the kiln fires. Shared by build.mjs and the page.
// World units: 1 unit is 2.5 cm. x runs along the kiln, y toward the viewer (the stoking front), z up.

export const LAY = {
  BASE: { x: -128, y: -56, w: 232, d: 116, r: 10 },
  FOOT: { x: -40, y: -36, w: 80, d: 72, r: 1.5 }, // stone footing, z 0..2
  K: { x0: -36, x1: 36, y0: -32, y1: 32 }, // outside of the brickwork
  WALL: 9, // one brick length, 22.5 cm
  COURSE: 2.6, // 6.5 cm brick plus joint
  Z0: 2, // top of the footing, the hearth
  ZF: 28, // top of the perforated floor
  ZS: 67, // springing of the crown
  R_IN: 23,
  R_OUT: 32,
  CUT_X: -22, // the cutaway removes the front wall from here to the right-hand end...
  CUT_Y: -8, // ...and the end wall from here to the front
  CUT_PHI: 75, // and the crown's courses from the front springing up to 75°
  TUNNELS: [-13, 13], // fire tunnels, 30 cm wide
  T_HALF: 6,
  T_SPRING: 15,
  RING: 4.4, // arch ring depth
  RINGS_Y: [-20.75, -10.4, 0, 10.4, 20.75], // five spaced arches per tunnel, 11 cm thick
  RING_T: 4.5,
  CHIMNEY: { r: 8, top: 135 },
  SPY: { y: -12.1, z: 31.8 },
  CONES: { x: 16.4, y0: -16.6, gap: 3.0, z: 28.9, h: 5.4, r: 1.0 },
  DOOR: { w: 13, h: 15, slide: 13.5 },
  DAMPER: { z: 124.6, out: 7.2 },
};

export function makeParts(k, G, T, P) {
  const C = LAY.CONES;
  const S = (paths, style) => k.solidSvg(paths, style);
  // a pyrometric cone: a slender tapered body leaning 8°, that softens and bows over toward +x as it takes heat
  function conePoints(x, y, bend) {
    const lean = (8 * Math.PI) / 180;
    const turn = bend * 2.62; // radians at the tip when fully down
    const n = 14;
    const ds = C.h / n;
    const pts = [[x, y, C.z]];
    let px = x, pz = C.z;
    for (let i = 0; i < n; i++) {
      const s = (i + 0.5) / n;
      const th = lean + turn * Math.pow(s, 1.25);
      px += Math.sin(th) * ds;
      pz += Math.cos(th) * ds;
      pts.push([px, y, pz]);
    }
    return pts;
  }
  function cone(i, bend) {
    const y = C.y0 + i * C.gap;
    const pts = conePoints(C.x, y, bend);
    const pieces = T.tubePieces(pts, (t) => C.r * (1 - 0.82 * t), P, { maxLength: 400, caps: [false, true] });
    return pieces.map((piece) => T.tubeSvg(piece, { tone: "hi" })).join("");
  }
  // all four cones, far to near
  function cones(bends) {
    return bends.map((b, i) => `<g class="kn-cone">${cone(i, b)}</g>`).join("");
  }
  return { cones, conePoints, S };
}
