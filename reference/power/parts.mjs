// Layout and the parts rebuilt while the wheel turns. Shared by build.mjs and the page.
// World units: 1 unit is about 2.5 cm. x runs upstream → downstream, y toward the viewer, z up.

export const LAY = {
  BASE: { x: -232, y: -72, w: 434, d: 146, r: 10 },
  FOREBAY: { x: -220, y: -28, w: 42, d: 56, r: 2 },
  FOREBAY_H: 126,
  WATER_Z: 122,
  FLUME: [-178, -52], // x from the gate to the lip
  FLUME_Z: 112, // underside of the flume floor
  FLUME_W: 8, // half width inside
  W: [-60, 62], // wheel centre x, z
  R: 48,
  RIM_IN: 41.6,
  SOLE: [39.2, 40.4],
  BUCKETS: 24,
  ARMS: 8,
  HUB_R: 7,
  GEAR_R: 50,
  PINION_R: 50 / 12,
  PULLEY_R: 20,
  ALT: [70, 30], // alternator pulley centre x, z
  ALT_R: 2.4,
  BELT_Y: 30,
  CHANNEL: { x: -114, y: -16, w: 160, d: 32, r: 2 },
  BENCH: { x: 94, y: -2, w: 56, d: 26, r: 1.5 },
  BENCH_Z: 22,
  POLES: [[178, -38], [178, 54]],
  POLE_TOP: 94,
  SAG: 13,
};

export function makeParts(k, G, P) {
  const L_ = LAY;
  const V = G.viewOf(P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const depth = (p) => G.dot3(p, V);
  const [WX, WZ] = L_.W;
  const PX = WX + L_.GEAR_R + L_.PINION_R;
  const Fw = G.frameOf([WX, 0, WZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const Fp = G.frameOf([PX, 0, WZ], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
  const at3 = (F, u, v, s) => G.add3(F.o, G.add3(G.mul3(F.u, u), G.add3(G.mul3(F.v, v), G.mul3(F.a, s))));
  const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  const bar = (r0, r1, a, w) => {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    const n = [-s * w / 2, c * w / 2];
    return [[r0 * c - n[0], r0 * s - n[1]], [r1 * c - n[0], r1 * s - n[1]], [r1 * c + n[0], r1 * s + n[1]], [r0 * c + n[0], r0 * s + n[1]]];
  };

  // static pieces of the wheel, built once
  const FAR_RIM = S(G.ringBand(-11, -9, L_.RIM_IN, L_.R, Fw, P, { hole: [-9, L_.RIM_IN] }), { tone: "hi", crease: "lo" });
  const SOLE = S(G.ringBand(-9, 9, L_.SOLE[0], L_.SOLE[1], Fw, P, { hole: [9, L_.SOLE[0]] }), { tone: "mid" });
  const NEAR_RIM = S(G.ringBand(9, 11, L_.RIM_IN, L_.R, Fw, P, { hole: [11, L_.RIM_IN] }), { tone: "hi", crease: "lo", inner: Ln(G.circleOf(Fw, 11, L_.R - 2.2, P, 120), { tone: "faint" }) });
  const HUB = S(G.disc(-13, 13, L_.HUB_R, Fw, P), { tone: "mid", inner: Ln(G.circleOf(Fw, 13, 4.6, P, 40), { tone: "lo" }) });
  const AXLE_FAR = S(G.disc(-18, -13, 3, Fw, P), { tone: "mid" });
  const AXLE_NEAR = S(G.disc(13, 18, 3, Fw, P), { tone: "mid" });

  function wheel(phi) {
    const out = [FAR_RIM];
    const arms = (s0, s1) => Array.from({ length: L_.ARMS }, (_, i) => S(G.prismOf(Fw, bar(L_.HUB_R - 0.5, L_.RIM_IN + 0.6, (i * 2 * Math.PI) / L_.ARMS - phi, 2.6), s0, s1, P), { tone: "mid" })).join("");
    out.push(arms(-10.8, -9.2));
    out.push(SOLE);
    const buckets = [];
    for (let i = 0; i < L_.BUCKETS; i++) {
      const a = (i * 2 * Math.PI) / L_.BUCKETS - phi;
      const lean = 0.2;
      const p0 = polar(L_.SOLE[1] - 0.2, a);
      const p1 = polar(L_.R - 0.4, a + lean);
      const n = [-Math.sin(a + lean / 2) * 1, Math.cos(a + lean / 2) * 1];
      const quad = [p0, p1, [p1[0] + n[0], p1[1] + n[1]], [p0[0] + n[0], p0[1] + n[1]]];
      const mid = at3(Fw, (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, 0);
      // buckets on the falling side hold water
      const full = Math.sin(a) < 0.85 && Math.cos(a) > -0.05 && Math.sin(a) > -0.6;
      buckets.push({ key: depth(mid), svg: S(G.prismOf(Fw, quad, -9, 9, P), { tone: "mid", className: full ? "pw-full" : undefined }) });
    }
    out.push(buckets.sort((x, y) => x.key - y.key).map((b) => b.svg).join(""));
    out.push(AXLE_FAR);
    out.push(arms(9.2, 10.8));
    out.push(HUB);
    out.push(AXLE_NEAR);
    out.push(NEAR_RIM);
    const teeth = G.spokesOf(Fw, 13, L_.GEAR_R - 1.5, L_.GEAR_R, 120, P, { phase: -phi });
    out.push(S(G.ringBand(11, 13, L_.GEAR_R - 4, L_.GEAR_R, Fw, P, { hole: [13, L_.GEAR_R - 4] }), { tone: "mid", inner: Ln(G.circleOf(Fw, 13, L_.GEAR_R - 1.5, P, 160), { tone: "lo" }) + Ln(teeth, { tone: "lo" }) }));
    return out.join("");
  }

  // pinion and countershaft pulley, turning 12× the wheel
  function pinion(phi) {
    const turn = phi * 12;
    const teeth = G.spokesOf(Fp, 13, L_.PINION_R - 1, L_.PINION_R, 10, P, { phase: turn });
    return S(G.disc(11, 13.4, L_.PINION_R, Fp, P), { tone: "mid", inner: Ln(G.circleOf(Fp, 13.4, L_.PINION_R - 1, P, 24), { tone: "lo" }) + Ln(teeth, { tone: "lo" }) });
  }
  function pulley(phi) {
    const turn = -phi * 12;
    const out = [];
    out.push(Array.from({ length: 6 }, (_, i) => S(G.prismOf(Fp, bar(3, L_.PULLEY_R - 2, (i * Math.PI) / 3 + turn, 2.2), 29.3, 30.7, P), { tone: "mid" })).join(""));
    out.push(S(G.ringBand(28, 32, L_.PULLEY_R - 2.6, L_.PULLEY_R, Fp, P, { hole: [32, L_.PULLEY_R - 2.6] }), { tone: "hi", crease: "lo" }));
    out.push(S(G.disc(27.6, 32.4, 3.6, Fp, P), { tone: "mid", inner: Ln(G.circleOf(Fp, 32.4, 2, P, 20), { tone: "lo" }) }));
    return out.join("");
  }

  // the open belt: two straight spans tangent to both pulleys, in the plane y = BELT_Y
  function beltSpans() {
    const [ax, az] = L_.ALT;
    const dx = ax - PX, dz = az - WZ;
    const len = Math.hypot(dx, dz);
    const th = Math.atan2(dz, dx);
    const b = Math.acos((L_.PULLEY_R - L_.ALT_R) / len);
    return [th + b, th - b].map((g) => {
      const t1 = [PX + L_.PULLEY_R * Math.cos(g), WZ + L_.PULLEY_R * Math.sin(g)];
      const t2 = [ax + L_.ALT_R * Math.cos(g), az + L_.ALT_R * Math.sin(g)];
      return { t1, t2 };
    });
  }

  // the string of bulbs between the two poles
  function catenary(y) {
    const [[, y0], [, y1]] = L_.POLES;
    const m = (y - (y0 + y1) / 2) / ((y1 - y0) / 2);
    return L_.POLE_TOP - 4 - L_.SAG * (1 - m * m);
  }
  const BULB_Y = Array.from({ length: 6 }, (_, i) => -24 + i * 13.6);

  return { wheel, pinion, pulley, beltSpans, catenary, BULB_Y, PX, Fw, Fp };
}
