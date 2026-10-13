import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL = process.env.ANATOMY_KIT || "../../anatomy"; // drawing kit folder, see GUIDE_FORMAT.md
const k = await import(`${SKILL}/kit/iso-kit.mjs`);
const G = await import(`${SKILL}/kit/lathe.mjs`);
const T = await import(`${SKILL}/kit/tube.mjs`);
const { kitScript } = await import(`${SKILL}/scripts/inline-kit.mjs`);
import * as M from "./model.mjs";
import { LAY, makeParts } from "./parts.mjs";
import { GUIDE, CHAPTERS } from "./guide.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const GUIDE_MODE = process.argv.includes("--guide");
const OUT = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? HERE;
const WIDTH = 760;
const HEIGHT = 470;
const B = LAY.BASE;
const { x0: X0, x1: X1, y0: Y0, y1: Y1 } = LAY.K;
const WL = LAY.WALL;
const C = LAY.COURSE;
const { Z0, ZF, ZS, R_IN, R_OUT, CUT_X, CUT_Y } = LAY;
const XI0 = X0 + WL, XI1 = X1 - WL, YI0 = Y0 + WL, YI1 = Y1 - WL; // inside of the walls
const DEG = Math.PI / 180;

const P = k.fitProjection([...k.boxCorners(B, -18, 0), [0, -8, LAY.CHIMNEY.top + 1], [0, 8, LAY.CHIMNEY.top + 1]], WIDTH, HEIGHT, { pad: 22, azimuth: 58 });
const PARTS = makeParts(k, G, T, P);
const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (p) => G.dot3(p, V);
const byDepth = (points) => [...points].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
const step = (n, html) => `<g class="om-part" data-step="${n}">${html}</g>`;
const poly = (points) => k.pathOf(points.map(at), true);
const seg = (a, b) => k.segment(a, b, P);
let clips = 0;
const clipId = () => `kn-clip-${clips++}`;
const sorted = (items) => items.sort((a, b) => a.key - b.key).map((i) => i.svg).join("");
const toneIndex = (n) => G.toneOf(n, P);
const facing = (n) => G.dot3(n, V) > 1e-6;

// ---------------------------------------------------------------- brickwork helpers
// courses every 6.5 cm from the hearth, head joints every 22.5 cm, half-bond course to course
const courseOf = (z) => Math.round((z - Z0) / C);
function brickwork(plan, z0, z1, { faces = "xy" } = {}) {
  const seams = [];
  for (let z = Z0 + C * Math.ceil((z0 - Z0) / C + 0.01); z < z1 - 0.3; z += C) seams.push(k.sideSeam(plan, z, P, 2));
  const joints = [];
  for (let z = z0; z < z1 - 0.3; ) {
    const c = courseOf(z);
    const zt = Math.min(Z0 + (c + 1) * C, z1);
    if (faces.includes("y")) {
      const yf = plan.y + plan.d;
      for (let x = X0 + (c % 2) * 4.5; x < plan.x + plan.w - 0.8; x += 9) if (x > plan.x + 0.8) joints.push(seg([x, yf, z], [x, yf, zt]));
    }
    if (faces.includes("x")) {
      const xf = plan.x + plan.w;
      for (let y = Y0 + ((c + 1) % 2) * 4.5; y < plan.y + plan.d - 0.8; y += 9) if (y > plan.y + 0.8) joints.push(seg([xf, y, z], [xf, y, zt]));
    }
    z = zt;
  }
  return seams.join("") + joints.join("");
}
function wall(plan, z0, z1, { cls, faces = "xy", tone = "mid" } = {}) {
  return S(k.slabOf(plan, z0, z1 - z0, P, 2), { tone, className: cls, inner: Ln(brickwork(plan, z0, z1, { faces }), { tone: "faint" }) });
}
// the inside faces of an opening through a wall: each edge of the opening, run through the wall's thickness
function reveal(outline2, toPoint, through) {
  const out = [];
  const n = outline2.length;
  for (let i = 0; i < n - 1; i++) {
    const a = outline2[i], b = outline2[i + 1];
    const quad = [toPoint(a, 0), toPoint(b, 0), toPoint(b, through), toPoint(a, through)];
    const e = G.sub3(quad[1], quad[0]);
    const t = G.sub3(quad[3], quad[0]);
    let nrm = G.unit3(G.cross3(e, t));
    // inward normal points toward the opening's centre line
    const mid = toPoint([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 0);
    const c = toPoint(outline2.centre, 0);
    if (G.dot3(nrm, G.sub3(c, mid)) < 0) nrm = G.mul3(nrm, -1);
    if (!facing(nrm)) continue;
    out.push(`<path class="iso-shade" data-shade="${toneIndex(nrm)}" d="${poly(quad)}"/>`);
  }
  return out.join("");
}

// ---------------------------------------------------------------- base plate
function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(B, -18, 18, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(B, 26))) {
    out.push(S(k.cylinder(x, y, 9, -18, 1.6, P, 32), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 7, -16.4, 2.4, P, 32), { tone: "mid" }));
  }
  out.push(S(k.slabOf(B, -14, 14, P, 10, 1.6), { tone: "mid", inner: Ln(k.sideSeam(B, -7, P, 10), { tone: "faint" }) }));
  out.push(Ln(k.planOutline(k.insetPlan(B, 6), 0, P, 10), { tone: "lo" }));
  const screws = k.corners(B, 13);
  out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2.4, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  const strip = { x: -112, y: 46, w: 132, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.8], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const label = { x: 44, y: 42, w: 54, d: 13, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 5, label.y + 6.4], 0.8, P, "x"), "REBOOT · 01", { size: 3.2, tone: "lo" }));
  out.push(Ln(k.lineOnTop([label.x + 5, label.y + 9.4], [label.x + 30, label.y + 9.4], 0.8, P), { tone: "faint", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 6.5, 0.8]), at([label.x + label.w - 2.4, label.y + 6.5, 0.8])], { size: 0.45 }));
  return out.join("");
}

// ---------------------------------------------------------------- footing
const FT = LAY.FOOT;
function footing() {
  const out = [`<path class="iso-halo" d="${k.haloOf(FT, 0, 10, P)}" style="filter:blur(5px)"/>`];
  // flagstones: joints across the top run edge to edge
  const lines = [];
  for (let x = FT.x + 20; x < FT.x + FT.w - 1; x += 20) lines.push(k.lineOnTop([x, FT.y], [x, FT.y + FT.d], Z0, P));
  lines.push(k.lineOnTop([FT.x, 0], [FT.x + FT.w, 0], Z0, P));
  out.push(S(k.slabOf(FT, 0, Z0, P, 3, 0.5), { tone: "lo", inner: Ln(lines.join(""), { tone: "faint" }) }));
  return out.join("");
}

// ---------------------------------------------------------------- drying ground with green ware (left)
const potProfiles = {
  jar: { p: [[0, 0], [0, 2.4], [0.8, 3.6, 1], [3, 4.9, 1], [5.6, 5.2, 1], [8.2, 4.5, 1], [10.2, 3, 1], [11, 2.5], [11.9, 2.8]], mouth: 2.2 },
  pot: { p: [[0, 0], [0, 2.8], [1, 4.3, 1], [3.4, 5.5, 1], [5.6, 5.3, 1], [7, 4.7], [7.8, 4.9]], mouth: 4.2 },
  bowl: { p: [[0, 0], [0, 2.1], [0.6, 3.1, 1], [2.2, 4.9, 1], [3.8, 5.9]], mouth: 5.3 },
  small: { p: [[0, 0], [0, 1.8], [0.6, 2.6, 1], [2.6, 3.4, 1], [4.6, 3.1, 1], [6, 2.1, 1], [6.6, 1.9], [7.2, 2.1]], mouth: 1.6 },
  filter: { p: [[0, 0], [0, 3.4], [8.8, 5], [9.6, 5.4]], mouth: 4.8 },
  crucible: { p: [[0, 0], [0, 1.6], [0.5, 2.2, 1], [3, 2.6, 1], [5, 2.9]], mouth: 2.4 },
};
function pot(kind, [x, y, z]) {
  const { p, mouth } = potProfiles[kind];
  const F = G.frameOf([x, y, z], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const top = p[p.length - 1][0];
  const rim = p[p.length - 1][1];
  const out = [S(G.solidOf(p, F, P), { tone: "hi", crease: "lo", className: "kn-ware" })];
  out.push(`<path class="kn-void" d="${G.circleOf(F, top, mouth, P, 40)}"/>`);
  out.push(Ln(G.circleOf(F, top, mouth, P, 40), { tone: "mid" }));
  if (rim - mouth > 0.4) out.push(Ln(G.circleOf(F, top, (rim + mouth) / 2, P, 40), { tone: "faint" }));
  return { key: depth([x, y, z + 2]), svg: `<g>${out.join("")}</g>` };
}
// a stack of bricks set on edge, courses crossing: 21.5 cm square, 10.25 cm a course
const BRICK = { l: 8.6, w: 4.1, t: 2.6 };
function brickStack(x, y, z, courses, { cls = "kn-ware", tone = "hi" } = {}) {
  const plan = { x, y, w: BRICK.l, d: BRICK.l, r: 0.3 };
  const h = courses * BRICK.w;
  const lines = [];
  for (let c = 1; c < courses; c++) lines.push(k.sideSeam(plan, z + c * BRICK.w, P, 2));
  for (let c = 0; c < courses; c++) {
    const za = z + c * BRICK.w, zb = za + BRICK.w;
    for (const f of [1, 2]) {
      const off = (BRICK.l * f) / 3;
      if (c % 2) lines.push(seg([x + off, y + BRICK.l, za], [x + off, y + BRICK.l, zb]));
      else lines.push(seg([x + BRICK.l, y + off, za], [x + BRICK.l, y + off, zb]));
    }
  }
  const top = [];
  for (const f of [1, 2]) {
    const off = (BRICK.l * f) / 3;
    if ((courses - 1) % 2) top.push(k.lineOnTop([x + off, y], [x + off, y + BRICK.l], z + h, P));
    else top.push(k.lineOnTop([x, y + off], [x + BRICK.l, y + off], z + h, P));
  }
  return { key: depth([x + BRICK.l / 2, y + BRICK.l / 2, z + h / 2]), svg: S(k.slabOf(plan, z, h, P, 2), { tone, crease: "lo", className: cls, inner: Ln(lines.join("") + top.join(""), { tone: "lo" }) }) };
}
function dryingGround() {
  const out = [];
  const pallet = { x: -118, y: -26, w: 50, d: 44, r: 1 };
  out.push(`<path class="iso-halo" d="${k.haloOf(pallet, 0, 6, P)}" style="filter:blur(4px)"/>`);
  for (const y of [-22, -4, 12]) out.push(S(k.slabOf({ x: pallet.x + 1, y, w: pallet.w - 2, d: 3, r: 0.4 }, 0, 1.6, P, 2), { tone: "lo" }));
  const boards = [];
  for (let x = pallet.x + 10; x < pallet.x + pallet.w - 1; x += 10) boards.push(k.lineOnTop([x, pallet.y], [x, pallet.y + pallet.d], 2.8, P));
  out.push(S(k.slabOf(pallet, 1.6, 1.2, P, 2, 0.3), { tone: "mid", inner: Ln(boards.join(""), { tone: "faint" }) }));
  const z = 2.8;
  const items = [
    brickStack(-114, -22, z, 4, { cls: "kn-green" }),
    brickStack(-103.6, -22, z, 3, { cls: "kn-green" }),
    brickStack(-114, -11.6, z, 2, { cls: "kn-green" }),
    pot("jar", [-87, -14, z]),
    pot("bowl", [-84, 4, z]),
    pot("small", [-99, -4, z]),
  ];
  // a two-brick mould: a timber frame with two 21.5 × 10.25 cm cells and a handle at each end
  const mould = { x: -110, y: 4, w: 11, d: 12, r: 0.4 };
  const cells = [0, 1].map((i) => ({ x: mould.x + 1.2, y: mould.y + 1.2 + i * 4.9, w: BRICK.l, d: BRICK.w, r: 0.2 }));
  const moSvg = [S(k.slabOf(mould, z, 2.6, P, 2), { tone: "mid", inner: Ln(k.sideSeam(mould, z + 1.3, P, 2), { tone: "faint" }) })];
  for (const c of cells) moSvg.push(`<path class="kn-void" d="${k.planOutline(c, z + 2.6, P, 2)}"/>`, Ln(k.planOutline(c, z + 2.6, P, 2), { tone: "lo" }));
  moSvg.push(S(k.slabOf({ x: mould.x + mould.w, y: mould.y + 4.6, w: 2.6, d: 2.8, r: 0.4 }, z + 0.8, 1.2, P, 2), { tone: "mid" }));
  items.push({ key: depth([mould.x + 5, mould.y + 6, z]), svg: moSvg.join("") });
  out.push(sorted(items));
  return out.join("");
}

// ---------------------------------------------------------------- firebox: walls, benches, arches
const FB_TOP = ZF;
const PL = {
  endL: { x: X0, y: Y0, w: WL, d: YI1 - Y0, r: 0.5 },
  far: { x: XI0, y: Y0, w: XI1 - XI0, d: WL, r: 0.5 },
  endR: { x: XI1, y: Y0, w: WL, d: YI1 - Y0, r: 0.5 },
  near: { x: X0, y: YI1, w: X1 - X0, d: WL, r: 0.5 },
};
const [TA, TB] = LAY.TUNNELS;
const TH = LAY.T_HALF;
const benches = [
  { x: XI0, y: YI0, w: TA - TH - XI0, d: YI1 - YI0, r: 0.3 },
  { x: TA + TH, y: YI0, w: TB - TH - (TA + TH), d: YI1 - YI0, r: 0.3 },
  { x: TB + TH, y: YI0, w: XI1 - (TB + TH), d: YI1 - YI0, r: 0.3 },
];
function fireboxBack() {
  const out = [];
  out.push(wall(PL.endL, Z0, FB_TOP, { faces: "x", cls: "kn-cav" }));
  out.push(wall(PL.far, Z0, FB_TOP, { faces: "y", cls: "kn-cav" }));
  for (const b of benches) out.push(wall(b, Z0, LAY.T_SPRING, { faces: "xy", cls: "kn-cav" }));
  return out.join("");
}
// the mouth of a tunnel in the front wall, as an outline in (x, z) on the face
function mouthOutline(cx, n = 18) {
  const pts = [[cx - TH, Z0]];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI;
    pts.push([cx + TH * Math.cos(a), LAY.T_SPRING + TH * Math.sin(a)]);
  }
  pts.push([cx + TH, Z0]);
  pts.centre = [cx, LAY.T_SPRING];
  return pts;
}
// voussoirs: 9 wedge bricks per arch, an arch ring 11 cm deep
function voussoirs(F, s0, s1, { count = 9, rin = TH, rout = TH + LAY.RING } = {}) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const a0 = Math.PI - (i / count) * Math.PI, a1 = Math.PI - ((i + 1) / count) * Math.PI;
    const g = 0.06;
    const quad = [[rin * Math.cos(a0 - g * 0), rin * Math.sin(a0)], [rout * Math.cos(a0), rout * Math.sin(a0)], [rout * Math.cos(a1), rout * Math.sin(a1)], [rin * Math.cos(a1), rin * Math.sin(a1)]];
    const mid = G.add3(F.o, G.add3(G.mul3(F.u, ((rin + rout) / 2) * Math.cos((a0 + a1) / 2)), G.add3(G.mul3(F.v, ((rin + rout) / 2) * Math.sin((a0 + a1) / 2)), G.mul3(F.a, (s0 + s1) / 2))));
    out.push({ key: depth(mid), svg: S(G.prismOf(F, quad, s0, s1, P), { tone: "mid", className: "kn-cav" }) });
  }
  return out;
}
function tunnelArches() {
  const items = [];
  for (const cx of LAY.TUNNELS) {
    for (const yc of LAY.RINGS_Y) {
      const F = G.frameOf([cx, yc, LAY.T_SPRING], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      items.push(...voussoirs(F, -LAY.RING_T / 2, LAY.RING_T / 2));
    }
  }
  return sorted(items);
}
// fuel laid in the tunnels: two split logs each, Ø 9 cm
function tunnelLogs() {
  const items = [];
  for (const cx of LAY.TUNNELS) {
    for (const dx of [-2.6, 2.6]) {
      const F = G.frameOf([cx + dx, -14, Z0 + 1.9], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
      const r = 1.9;
      items.push({ key: depth([cx + dx, 0, Z0 + r]), svg: S(G.disc(0, 34, r, F, P), { tone: "mid", className: "kn-cav", inner: Ln(G.circleOf(F, 34, r * 0.55, P, 24), { tone: "faint" }) }) });
    }
  }
  return sorted(items);
}
// the inside of each mouth: the jamb and soffit through the wall's 22.5 cm
const MOUTHS = LAY.TUNNELS.map((cx) => mouthOutline(cx));
const onFace = ([x, z], dy) => [x, Y1 - dy, z];
function mouthReveals() {
  return `<g class="kn-cav">${MOUTHS.map((m) => reveal(m, onFace, WL)).join("")}</g>`;
}
const MASK = `<mask id="kn-mouths" maskUnits="userSpaceOnUse" x="-50" y="-50" width="${WIDTH + 100}" height="${HEIGHT + 100}"><rect x="-50" y="-50" width="${WIDTH + 100}" height="${HEIGHT + 100}" fill="#fff"/>${MOUTHS.map((m) => `<path d="${poly(m.map((p) => onFace(p, 0)))}" fill="#000"/>`).join("")}</mask>`;
function fireboxFront() {
  const out = [];
  out.push(wall(PL.endR, Z0, FB_TOP, { faces: "x" }));
  out.push(`<g mask="url(#kn-mouths)">${wall(PL.near, Z0, FB_TOP, { faces: "xy" })}</g>`);
  out.push(Ln(MOUTHS.map((m) => poly(m.map((p) => onFace(p, 0)))).join(""), { tone: "mid" }));
  return out.join("");
}
function mouthArches() {
  const items = [];
  for (const cx of LAY.TUNNELS) {
    const F = G.frameOf([cx, Y1, LAY.T_SPRING], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    items.push(...voussoirs(F, 0, 0.6).map((v) => ({ ...v, svg: v.svg.replace(' kn-cav"', '"') })));
  }
  return sorted(items);
}

// ---------------------------------------------------------------- perforated floor
const FLOOR = { x: XI0, y: YI0, w: XI1 - XI0, d: YI1 - YI0, r: 0.3 };
const HOLES = [];
for (const cx of LAY.TUNNELS) for (const dx of [-2.6, 2.6]) for (let i = 0; i < LAY.RINGS_Y.length - 1; i++) {
  const y = (LAY.RINGS_Y[i] + LAY.RINGS_Y[i + 1]) / 2;
  HOLES.push({ x: cx + dx - 1, y: y - 1.3, w: 2, d: 2.6, r: 0.4 });
}
function floor() {
  const lines = [];
  for (let y = FLOOR.y + BRICK.w; y < FLOOR.y + FLOOR.d - 0.5; y += BRICK.w + 0.08) lines.push(k.lineOnTop([FLOOR.x, y], [FLOOR.x + FLOOR.w, y], ZF, P));
  const out = [S(k.slabOf(FLOOR, ZF - C, C, P, 2), { tone: "mid", className: "kn-cav", inner: Ln(lines.join(""), { tone: "faint" }) })];
  const holes = HOLES.map((h) => k.planOutline(h, ZF, P, 2)).join("");
  out.push(`<path class="kn-void" d="${holes}"/>`, `<path class="kn-hole-hot" data-part="holes" d="${holes}" opacity="0"/>`, Ln(holes, { tone: "lo" }));
  return out.join("");
}

// ---------------------------------------------------------------- chamber walls
const UP = {
  endL: PL.endL,
  far: PL.far,
  endR: { x: XI1, y: Y0, w: WL, d: CUT_Y - Y0, r: 0.5 },
  nearL: { x: X0, y: YI1, w: CUT_X - X0, d: WL, r: 0.5 },
};
function chamberBack() {
  return wall(UP.endL, ZF, ZS, { faces: "x", cls: "kn-cav" }) + wall(UP.far, ZF, ZS, { faces: "y", cls: "kn-cav" });
}
const SPY = LAY.SPY;
function chamberRight() {
  const out = [wall(UP.endR, ZF, ZS, { faces: "xy" })];
  // spy hole with a fired-clay bung, Ø 10 cm
  const F = G.frameOf([X1, SPY.y, SPY.z], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  out.push(`<path class="kn-void" d="${G.circleOf(F, 0, 2.3, P, 32)}"/>`, Ln(G.circleOf(F, 0, 2.3, P, 32), { tone: "lo" }));
  out.push(`<path class="kn-spy" data-part="spy" d="${G.circleOf(F, 0, 2.3, P, 32)}" opacity="0"/>`);
  out.push(`<g data-part="bung">${S(G.disc(-1.2, 1.8, 1.9, F, P), { tone: "mid" })}${S(G.disc(1.8, 3.4, 1.1, F, P), { tone: "mid" })}</g>`);
  return out.join("");
}
function chamberNear() {
  return wall(UP.nearL, ZF, ZS, { faces: "xy" });
}

// ---------------------------------------------------------------- crown (barrel vault in brick courses) and chimney
const FV = G.frameOf([0, 0, ZS], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
const STRIPS = 12;
const phiOf = (i) => (i * 180) / STRIPS;
function vcourse(i, xa, xb, { joints = true, bedFrom = null } = {}) {
  const f0 = phiOf(i) * DEG, f1 = phiOf(i + 1) * DEG;
  const quad = [[R_IN * Math.cos(f0), R_IN * Math.sin(f0)], [R_OUT * Math.cos(f0), R_OUT * Math.sin(f0)], [R_OUT * Math.cos(f1), R_OUT * Math.sin(f1)], [R_IN * Math.cos(f1), R_IN * Math.sin(f1)]];
  const fm = (f0 + f1) / 2;
  const outward = [0, Math.cos(fm), Math.sin(fm)];
  const outside = facing(outward);
  const r = outside ? R_OUT : R_IN;
  const lines = [];
  if (joints) {
    for (let x = X0 + (i % 2) * 4.5; x < xb - 0.8; x += 9) {
      if (x <= xa + 0.8) continue;
      lines.push(seg([x, r * Math.cos(f0), ZS + r * Math.sin(f0)], [x, r * Math.cos(f1), ZS + r * Math.sin(f1)]));
    }
  }
  // the bed face under a course, where the course below it is cut away: brick ends every 22.5 cm
  if (bedFrom !== null && facing([0, Math.sin(f0), -Math.cos(f0)])) {
    for (let x = X0 + ((i + 1) % 2) * 4.5; x < xb - 0.8; x += 9) {
      if (x <= Math.max(xa, bedFrom) + 0.8) continue;
      lines.push(seg([x, R_IN * Math.cos(f0), ZS + R_IN * Math.sin(f0)], [x, R_OUT * Math.cos(f0), ZS + R_OUT * Math.sin(f0)]));
    }
  }
  const mid = [(xa + xb) / 2, ((R_IN + R_OUT) / 2) * Math.cos(fm), ZS + ((R_IN + R_OUT) / 2) * Math.sin(fm)];
  return { key: depth(mid), svg: S(G.prismOf(FV, quad, xa, xb, P), { tone: "mid", className: outside ? undefined : "kn-cav", inner: Ln(lines.join(""), { tone: "faint" }) }), outside };
}
const CUT_STRIPS = Math.round(LAY.CUT_PHI / (180 / STRIPS)); // courses 0..CUT_STRIPS-1 are cut away
function crownFar() {
  const items = [];
  for (let i = STRIPS / 2; i < STRIPS; i++) items.push(vcourse(i, X0, XI1));
  return sorted(items);
}
function gable(xa, xb, ymax = R_IN, cls) {
  const pts = [];
  if (ymax < R_IN) pts.push([ymax, 0], [ymax, Math.sqrt(R_IN * R_IN - ymax * ymax)]);
  const a0 = ymax < R_IN ? Math.acos(ymax / R_IN) : 0;
  for (let i = 0; i <= 24; i++) {
    const a = a0 + ((Math.PI - a0) * i) / 24;
    if (i === 0 && ymax < R_IN) continue;
    pts.push([R_IN * Math.cos(a), R_IN * Math.sin(a)]);
  }
  const lines = [];
  for (let z = C * Math.ceil(0.01 + (ZS - Z0) / C) + Z0; z < ZS + R_IN - 1; z += C) {
    const h = z - ZS;
    const w = Math.sqrt(R_IN * R_IN - h * h);
    lines.push(seg([xb, -w, z], [xb, Math.min(w, ymax), z]));
    if (ymax < R_IN && w > ymax) lines.push(seg([xa, ymax, z], [xb, ymax, z]));
  }
  return S(G.prismOf(FV, pts, xa, xb, P), { tone: "mid", className: cls, inner: Ln(lines.join(""), { tone: "faint" }) });
}
function crownBackEnd() {
  return gable(X0, XI0, R_IN, "kn-cav");
}
function crownRightEnd() {
  const items = [];
  for (let i = STRIPS / 2; i < STRIPS; i++) items.push(vcourse(i, XI1, X1));
  return gable(XI1, X1, CUT_Y) + sorted(items);
}
function crownNear() {
  const items = [];
  for (let i = 0; i < STRIPS / 2; i++) items.push(vcourse(i, X0, i < CUT_STRIPS ? CUT_X : X1, { bedFrom: i === CUT_STRIPS ? CUT_X : null }));
  return items.map((i) => i.svg).join("");
}
const CH = LAY.CHIMNEY;
const FC = G.frameOf([0, 0, ZS], [0, 0, 1], [0, 1, 0], [1, 0, 0]);
const CH_TOP = CH.top - ZS - 2.4;
function chimney() {
  const out = [];
  const arcs = [];
  for (let z = ZS + R_OUT + 2.4; z < CH.top - 2.6; z += C) arcs.push(G.arcOf(FC, z - ZS, CH.r, P));
  out.push(S(G.saddleOf(FC, CH.r, R_OUT, CH_TOP, P, { steps: 64 }), { tone: "mid", inner: Ln(arcs.join(""), { tone: "faint" }) }));
  out.push(S(G.ringBand(CH_TOP, CH_TOP + 2.4, 6.2, CH.r + 1.4, FC, P, { hole: [CH_TOP + 2.4, 6.2] }), { tone: "mid" }));
  out.push(`<path class="kn-void" d="${G.circleOf(FC, CH_TOP + 2.4, 6.2, P, 48)}"/>`, Ln(G.circleOf(FC, CH_TOP + 2.4, 6.2, P, 48), { tone: "lo" }));
  return out.join("");
}
// a sliding steel damper through a slot near the top
const DM = LAY.DAMPER;
function damperSlot() {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const y = -3.4 + (6.8 * i) / 6; pts.push([Math.sqrt(CH.r * CH.r - y * y), y, DM.z - 0.6]); }
  for (let i = 6; i >= 0; i--) { const y = -3.4 + (6.8 * i) / 6; pts.push([Math.sqrt(CH.r * CH.r - y * y), y, DM.z + 1.4]); }
  return `<path class="kn-void" d="${poly(pts)}"/>${Ln(poly(pts), { tone: "lo" })}`;
}
function damper() {
  const x0 = 7.3;
  const plate = { x: x0, y: -3, w: DM.out + 2.4, d: 6, r: 0.4 };
  const id = clipId();
  const clip = G.hullOf([[x0, -3.4, DM.z - 1.2], [x0, 3.4, DM.z - 1.2], [x0, -3.4, DM.z + 4], [x0, 3.4, DM.z + 4], [x0 + 30, -3.4, DM.z - 1.2], [x0 + 30, 3.4, DM.z - 1.2], [x0 + 30, -3.4, DM.z + 4], [x0 + 30, 3.4, DM.z + 4]].map(at));
  const body = S(k.slabOf(plate, DM.z, 0.8, P, 2), { tone: "hi", crease: "lo" }) + S(k.cylinder(x0 + DM.out + 0.6, 0, 0.6, DM.z + 0.8, 1.6, P, 16), { tone: "mid" }) + S(k.cylinder(x0 + DM.out + 0.6, 0, 1.3, DM.z + 2.4, 0.9, P, 20), { tone: "mid" });
  return `<clipPath id="${id}"><path d="${k.pathOf(clip, true)}"/></clipPath><g clip-path="url(#${id})"><g data-part="damper">${body}</g></g>`;
}

// ---------------------------------------------------------------- the setting inside
function setting() {
  const z = ZF;
  const items = [
    brickStack(-26.2, -22.4, z, 3),
    brickStack(-15.6, -22.4, z, 3),
    brickStack(-5, -22.4, z, 3),
    brickStack(5.6, -22.4, z, 2),
    brickStack(-26.2, -11.8, z, 3),
    brickStack(-26.2, -1.2, z, 2),
    pot("small", [-21.9, -18.1, z + 3 * BRICK.w]),
    pot("bowl", [-0.7, -18.1, z + 3 * BRICK.w]),
    pot("jar", [-11, -3, z]),
    pot("pot", [2, 4, z]),
    pot("filter", [-13, 12, z]),
    pot("crucible", [9, 13, z]),
    pot("crucible", [12.6, 4.4, z]),
  ];
  // the cone pack on a brick laid flat, seen through the spy hole
  const Cn = LAY.CONES;
  const pad = { x: Cn.x - 1.6, y: Cn.y0 - 1.5, w: 3.2, d: Cn.gap * 3 + 3, r: 0.6 };
  const conesSvg = S(k.slabOf(pad, z, Cn.z - z, P, 3), { tone: "mid" }) + `<g data-part="cones">${PARTS.cones([0, 0, 0, 0])}</g>`;
  items.push({ key: depth([Cn.x, -12, z + 2]), svg: conesSvg });
  return sorted(items);
}

// ---------------------------------------------------------------- heat: glows tied to temperature
const OPEN = (() => {
  const pts = [];
  for (const x of [CUT_X, X1]) for (let f = 0; f <= LAY.CUT_PHI; f += 5) pts.push([x, R_OUT * Math.cos(f * DEG), ZS + R_OUT * Math.sin(f * DEG)]);
  pts.push([CUT_X, Y1, ZF], [X1, Y1, ZF], [X1, CUT_Y, ZF], [X1, CUT_Y, ZS + Math.sqrt(R_IN * R_IN - CUT_Y * CUT_Y)]);
  return k.pathOf(G.hullOf(pts.map(at)), true);
})();
function chamberGlow() {
  const id = clipId();
  const [cx, cy] = at([-2, -6, ZF + 18]);
  return `<clipPath id="${id}"><path d="${OPEN}"/></clipPath><g clip-path="url(#${id})" class="kn-glows">` +
    `<circle class="kn-glow" data-part="glow-lo" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="150" fill="url(#kn-glow-lo)" opacity="0"/>` +
    `<circle class="kn-glow" data-part="glow-hi" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="120" fill="url(#kn-glow-hi)" opacity="0"/></g>`;
}
function mouthGlows() {
  return MOUTHS.map((m, i) => {
    const id = clipId();
    const [cx, cy] = at(onFace([m.centre[0], Z0 + 6], 0));
    return `<clipPath id="${id}"><path d="${poly(m.map((p) => onFace(p, 0)))}"/></clipPath><circle class="kn-glow" data-part="fire-${i}" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="26" fill="url(#kn-glow-hi)" opacity="0" clip-path="url(#${id})"/>` +
      `<circle class="kn-glow" data-part="spill-${i}" cx="${cx.toFixed(1)}" cy="${(cy + 6).toFixed(1)}" r="34" fill="url(#kn-glow-lo)" opacity="0"/>`;
  }).join("");
}

// ---------------------------------------------------------------- stoke-hole doors on a rail
const DR = LAY.DOOR;
const RAIL_Z = 25.6;
function rail() {
  const out = [];
  for (const x of [-24, 34]) out.push(S(k.slabOf({ x: x - 1.2, y: Y1, w: 2.4, d: 2.2, r: 0.3 }, RAIL_Z - 1.4, 3, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: -25, y: Y1 + 1, w: 60, d: 1.2, r: 0.3 }, RAIL_Z, 1.2, P, 2), { tone: "mid" }));
  out.push(D([at([-24, Y1 + 2.2, RAIL_Z + 0.6]), at([34, Y1 + 2.2, RAIL_Z + 0.6])], { size: 0.45 }));
  return out.join("");
}
function door(x) {
  const plate = { x, y: Y1 + 2.4, w: DR.w, d: 0.8, r: 0.2 };
  const out = [];
  for (const hx of [x + 2.4, x + DR.w - 2.4]) out.push(S(k.slabOf({ x: hx - 0.6, y: Y1 + 1, w: 1.2, d: 2.2, r: 0.2 }, RAIL_Z + 1.2, 0.8, P, 2), { tone: "mid" }), S(k.slabOf({ x: hx - 0.6, y: Y1 + 2.2, w: 1.2, d: 0.4, r: 0.1 }, RAIL_Z - 1, 3, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf(plate, Z0 + 1.4, RAIL_Z - 1 - Z0 - 1.4, P, 2), { tone: "hi", crease: "lo", inner: Ln(k.sideSeam(plate, Z0 + 4, P, 2) + k.sideSeam(plate, RAIL_Z - 4, P, 2), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: x + DR.w / 2 - 2.2, y: Y1 + 3.2, w: 4.4, d: 1.2, r: 0.4 }, 13, 1.4, P, 2), { tone: "mid" }));
  out.push(D([at([x + 1.2, Y1 + 3.2, RAIL_Z - 2.6]), at([x + DR.w - 1.2, Y1 + 3.2, RAIL_Z - 2.6])], { size: 0.4 }));
  return out.join("");
}
function doors() {
  return `<g data-part="door-0">${door(-6.5)}</g><g data-part="door-1">${door(20)}</g>`;
}

// ---------------------------------------------------------------- woodpile (right)
function woodpile() {
  const out = [];
  const pile = { x: 52, y: -20, w: 32, d: 36, r: 1 };
  out.push(`<path class="iso-halo" d="${k.haloOf(pile, 0, 6, P)}" style="filter:blur(4px)"/>`);
  for (const y of [-15, 8]) out.push(S(k.slabOf({ x: 53, y, w: 30, d: 3, r: 0.4 }, 0, 2.6, P, 2), { tone: "lo" }));
  const r = 2.6;
  const L = 32;
  const items = [];
  const xs = [58, 63.4, 68.8, 74.2, 79.6];
  const rows = [xs, xs.slice(0, 4).map((x) => x + 2.7), xs.slice(0, 3).map((x) => x + 5.4)];
  rows.forEach((row, j) => row.forEach((x) => {
    const zc = 2.6 + r + j * r * Math.sqrt(3);
    const F = G.frameOf([x, -18, zc], [0, 1, 0], [1, 0, 0], [0, 0, 1]);
    items.push({ key: depth([x, 0, zc]), svg: S(G.disc(0, L, r, F, P), { tone: "mid", inner: Ln(G.circleOf(F, L, r * 0.6, P, 28) + G.circleOf(F, L, r * 0.25, P, 16), { tone: "faint" }) }) });
  }));
  for (const x of [54.6, 83]) for (const y of [-16, 12]) items.push({ key: depth([x, y, 8]) + (x > 80 ? 40 : -40), svg: S(k.cylinder(x, y, 1, 0, 16, P, 14), { tone: "mid", crease: "none" }) });
  out.push(sorted(items));
  return out.join("");
}

// ---------------------------------------------------------------- assemble
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "A wood-fired updraft brick kiln on one base, with its front right corner cut away. Two arched stoke holes in the front lead into fire tunnels under a perforated brick floor. Inside, green bricks stand in stacks and pots stand on the floor, with a row of four pyrometric cones near a spy hole in the end wall. A brick barrel-vault crown carries a round chimney with a sliding damper. Green bricks and pots dry on a pallet to the left, and split logs are stacked to the right.",
  body: [
    `<defs>${MASK}<radialGradient id="kn-glow-lo"><stop offset="0" stop-color="var(--kn-heat-lo)" stop-opacity=".9"/><stop offset=".45" stop-color="var(--kn-heat-lo)" stop-opacity=".45"/><stop offset="1" stop-color="var(--kn-heat-lo)" stop-opacity="0"/></radialGradient><radialGradient id="kn-glow-hi"><stop offset="0" stop-color="var(--kn-heat-hi)" stop-opacity=".95"/><stop offset=".4" stop-color="var(--kn-heat-hi)" stop-opacity=".5"/><stop offset="1" stop-color="var(--kn-heat-hi)" stop-opacity="0"/></radialGradient></defs>`,
    step(1, base()),
    step(6, dryingGround()),
    step(1, footing()),
    step(2, fireboxBack()),
    step(9, tunnelLogs()),
    step(3, tunnelArches()),
    step(2, mouthReveals()),
    step(4, floor()),
    step(2, fireboxFront()),
    step(3, mouthArches()),
    step(9, mouthGlows()),
    step(9, rail()),
    step(9, doors()),
    step(5, chamberBack()),
    step(8, crownFar()),
    step(8, crownBackEnd()),
    step(7, setting()),
    step(7, chamberGlow()),
    step(5, chamberRight()),
    step(8, crownRightEnd()),
    step(5, chamberNear()),
    step(8, crownNear()),
    step(8, chimney()),
    step(8, damperSlot()),
    step(8, damper()),
    step(9, woodpile()),
  ],
});

// ---------------------------------------------------------------- page
const CSS = `<style>
.iso{--kn-heat-lo:#ff4d1a;--kn-heat-hi:#ffb24a;--kn-void:#050505;--om-wall:#0d0d0d;--om-ring:#ffffff14;--om-hover:#232323}
.iso[data-theme="light"]{--kn-heat-lo:#e2401b;--kn-heat-hi:#f08a1c;--kn-void:#3d3a36;--om-wall:#dcdcd8;--om-ring:#0000001a;--om-hover:#f0f0ed}
.kn-cav{--anatomy-paper:#101010;--anatomy-top:#151515;--anatomy-shade-0:#0b0b0b;--anatomy-shade-1:#0d0d0d;--anatomy-shade-2:#0f0f0f;--anatomy-shade-3:#121212;--anatomy-faint:#232323}
.iso[data-theme="light"] .kn-cav{--anatomy-paper:#d2cfca;--anatomy-top:#dcd9d4;--anatomy-shade-0:#c3c0bb;--anatomy-shade-1:#c9c6c1;--anatomy-shade-2:#cfccc7;--anatomy-shade-3:#d6d3ce;--anatomy-faint:#b9b6b1;--anatomy-lo:#a19e99}
.kn-green{--anatomy-top:var(--anatomy-shade-3)}
.kn-void{fill:var(--kn-void);stroke:none}
.kn-hole-hot,.kn-spy{fill:var(--kn-heat-hi);stroke:none}
.kn-glow{pointer-events:none;mix-blend-mode:screen}
.iso[data-theme="light"] .kn-glow{mix-blend-mode:multiply}
.kn-cone .tb-edge{stroke:var(--anatomy-lit)}
.om-stage-box{position:relative;outline:none;touch-action:pan-y}
.om-stage-box:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.kn-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;margin-top:12px;background:var(--om-ring);border:1px solid var(--om-ring)}
.kn-stats div{background:var(--anatomy-card);padding:8px 10px}
.kn-stats span{display:block;font-family:var(--anatomy-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted)}
.kn-stats b{display:block;margin-top:2px;font:600 15px/1.2 var(--anatomy-mono);color:var(--anatomy-strong);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@media (max-width:640px){.kn-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.kn-stats div:nth-child(5){grid-column:span 2}}
html.reel .kn-stats{margin:18px 30px 0}
html.reel .kn-stats span{font-size:15px}
html.reel .kn-stats b{font-size:30px}
${GUIDE_MODE ? readFileSync(join(HERE, "..", "guide.css"), "utf8") : ""}
</style>`;

const stats = `<div class="kn-stats" aria-hidden="true"><div><span>Firing</span><b data-stat="hour">0.0 h</b></div><div><span>Chamber</span><b data-stat="temp">20 °C</b></div><div><span>Glow</span><b data-stat="glow">none</b></div><div><span>Cones down</span><b data-stat="cones">0 of 4</b></div><div><span>Phase</span><b data-stat="phase">cold</b></div></div>`;
const LIVE = `<span aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" data-live></span>`;
const m = (x) => (x * 0.025).toFixed(2).replace(/\.?0+$/, "");
const CAPTION = `An updraft kiln ${m(X1 - X0)} × ${m(Y1 - Y0)} m, in 215 × 102.5 × 65 mm bricks. Fire in two tunnels under a perforated floor; the hot gas rises through the setting and leaves by the chimney. Bricks fire at 900–1,000 °C and earthenware at 1,000–1,200 °C, so this firing tops out at ${M.TOP.toLocaleString("en")} °C. The schedule is the model's assumption: ${M.SMOKE_END} hours of slow water-smoking to ${M.SMOKE_TO} °C, a climb of 100 °C an hour, a one-hour soak, then natural cooling with every opening shut, below ${M.OPEN_AT} °C after about ${Math.round(M.coolHours())} hours. The four cones are chosen to bend at ${M.CONES.map((c) => c.toLocaleString("en")).join(", ")} °C; the model bends each one from the hottest moment so far, starting ${M.CONE_SPAN} °C below its rating, though real cones answer to time as well as temperature. Glow starts near 525 °C; its colours are the usual eye estimates.`;

const body = GUIDE_MODE
  ? CSS + `<div class="og">` + k.plateHtml({
      fig: "Reboot 01",
      title: "Build a pottery kiln",
      hint: "← → step through the guide",
      readout: GUIDE[0].readout,
      keys: [{ mark: "lit", label: "What this step adds; in part B, the heat and the cones" }, { mark: "raised", label: "Parts already in place" }],
      caption: `${CAPTION} This is a guide to how the parts go together, not engineering drawings. A kiln at 1,000 °C burns on contact and its stoke holes throw flame: build it outdoors, well clear of buildings and anything that burns, wear leather gloves and eye protection at the stoke holes and spy hole, and never open it hot.`,
      body: `<div class="om-stage-box" tabindex="0" role="group" aria-label="Pottery kiln build guide. Left and right arrows step through the guide.">${svg}</div>${stats}<nav class="og-rail" data-rail aria-label="Guide steps"></nav><section class="og-panel" data-panel></section><div class="og-nav"><button type="button" data-prev>← Back</button><button type="button" data-next>Next →</button></div>${LIVE}`,
    }) + `</div>`
  : CSS + k.plateHtml({
      fig: "Reboot 01",
      title: "A pottery kiln",
      hint: "A sped-up firing, over and over",
      readout: "",
      keys: [{ mark: "lit", label: "Heat: the fire, the glowing setting and the cones" }, { mark: "raised", label: "The kiln and its setting" }],
      caption: CAPTION,
      body: `<div class="om-stage-box" tabindex="0" role="group" aria-label="Pottery kiln firing.">${svg}</div>${stats}${LIVE}`,
    });

const strip = (src) => src.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const namesOf = (src) => [...src.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((x) => x[1]);
const latheSource = readFileSync(`${SKILL}/kit/lathe.mjs`, "utf8");
const tubeSource = readFileSync(`${SKILL}/kit/tube.mjs`, "utf8");
const modelSource = readFileSync(join(HERE, "model.mjs"), "utf8");
const DATA = { P, guide: GUIDE_MODE ? GUIDE : null, chapters: CHAPTERS };
const runtime = [
  kitScript(),
  `const k = { ${Object.keys(k).join(", ")} };`,
  `const G = (() => {\n${strip(latheSource)}\nreturn { ${namesOf(latheSource).join(", ")} };\n})();`,
  `const T = (() => {\n${strip(tubeSource)}\nreturn { ${namesOf(tubeSource).join(", ")} };\n})();`,
  `const M = (() => {\n${strip(modelSource)}\nreturn { ${namesOf(modelSource).join(", ")} };\n})();`,
  strip(readFileSync(join(HERE, "parts.mjs"), "utf8")),
  `const DATA = ${JSON.stringify(DATA)};`,
  readFileSync(join(HERE, "live.js"), "utf8"),
  GUIDE_MODE ? readFileSync(join(HERE, "..", "guide.js"), "utf8") : "",
].join("\n");

const name = GUIDE_MODE ? "kiln-guide" : "kiln";
const file = theme === "light" ? `${name}-light.html` : `${name}.html`;
writeFileSync(join(OUT, file), k.pageHtml({ title: GUIDE_MODE ? "Build a pottery kiln" : "A pottery kiln", theme, body, script: runtime, width: 820 }));
console.log("wrote", join(OUT, file), Math.round(svg.length / 1024) + " KB svg");
