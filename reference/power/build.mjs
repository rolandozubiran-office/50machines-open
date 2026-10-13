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
const [WX, WZ] = LAY.W;
const up = [0, 0, 1];
const Y = [0, 1, 0];

const P = k.fitProjection([...k.boxCorners(B, -18, 0), [LAY.FOREBAY.x, LAY.FOREBAY.y, 142], [LAY.POLES[0][0], LAY.POLES[0][1], LAY.POLE_TOP + 4], [WX, 0, WZ + LAY.R + 8]], WIDTH, HEIGHT, { pad: 22, azimuth: 58 });
const PARTS = makeParts(k, G, P);
const V = G.viewOf(P);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const Ln = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (p) => G.dot3(p, V);
const byDepth = (points) => [...points].sort((a, b) => depth([a[0], a[1], 0]) - depth([b[0], b[1], 0]));
const step = (n, html) => `<g class="om-part" data-step="${n}">${html}</g>`;
let clips = 0;
const clipId = () => `pw-clip-${clips++}`;
const PX = PARTS.PX;

function tube(points, r, { tone = "mid", bend = 4, className = "" } = {}) {
  const route = points.length > 2 ? G.fillet(points, bend, 7, { P, tube: r }) : points;
  const pieces = T.tubePieces(route, r, P, { maxLength: 600 });
  return `<g class="${className}">${pieces.map((piece) => T.tubeSvg(piece, { tone })).join("")}</g>`;
}

// ---------------------------------------------------------------- base and tailrace
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
  const strip = { x: -150, y: 50, w: 210, d: 6, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.8], P);
  out.push(Ln(ticks.minor, { tone: "lo" }), Ln(ticks.major, { tone: "mid" }));
  const label = { x: 82, y: 46, w: 54, d: 13, r: 1.5 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(Ln(k.planOutline(k.insetPlan(label, 1.6), 0.8, P, 4), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 5, label.y + 6.4], 0.8, P, "x"), "REBOOT · 23", { size: 3.2, tone: "lo" }));
  out.push(Ln(k.lineOnTop([label.x + 5, label.y + 9.4], [label.x + 30, label.y + 9.4], 0.8, P), { tone: "faint", free: true }));
  out.push(D([at([label.x + 2.4, label.y + 6.5, 0.8]), at([label.x + label.w - 2.4, label.y + 6.5, 0.8])], { size: 0.45 }));
  return out.join("");
}

const CH = LAY.CHANNEL;
function channelBack() {
  const out = [];
  out.push(S(k.slabOf({ x: CH.x, y: CH.y, w: CH.w, d: 4, r: 1 }, 0, 10, P, 3, 0.4), { tone: "mid" }));
  const water = k.planOutline({ x: CH.x + 1, y: CH.y + 4, w: CH.w - 2, d: CH.d - 8, r: 0.5 }, 5, P, 2);
  out.push(`<path class="pw-water" d="${water}"/>`);
  out.push(S(k.slabOf({ x: CH.x, y: CH.y + 4, w: 3, d: CH.d - 8, r: 0.4 }, 0, 5.2, P, 2), { tone: "mid" }));
  const grate = { x: CH.x + CH.w - 10, y: CH.y + 4, w: 10, d: CH.d - 8, r: 0.4 };
  out.push(S(k.slabOf(grate, 0, 5.4, P, 2), { tone: "lo", inner: Ln(k.planOutline(k.insetPlan(grate, 1.4), 5.4, P, 2), { tone: "faint" }) }));
  const flow = [-6, 0, 6].map((y) => k.lineOnTop([CH.x + 3, y], [CH.x + CH.w - 10, y], 5, P)).join("");
  out.push(`<g data-part="tail-flow" opacity="0">${Ln(flow, { tone: "mid", flow: true })}</g>`);
  return out.join("");
}
function channelFront() {
  return S(k.slabOf({ x: CH.x, y: CH.y + CH.d - 4, w: CH.w, d: 4, r: 1 }, 0, 10, P, 3, 0.4), { tone: "mid", inner: Ln(k.sideSeam({ x: CH.x, y: CH.y + CH.d - 4, w: CH.w, d: 4, r: 1 }, 5, P, 3), { tone: "faint" }) });
}

// ---------------------------------------------------------------- forebay, sluice, flume
const FB = LAY.FOREBAY;
function forebay() {
  const out = [`<path class="iso-halo" d="${k.haloOf(FB, 0, 20, P)}"/>`];
  const courses = [14, 28, 42, 56, 70, 84, 98, 112].map((z) => k.sideSeam(FB, z, P, 3)).join("");
  out.push(S(k.slabOf(FB, 0, LAY.FOREBAY_H, P, 3, 1), { tone: "mid", inner: Ln(courses, { tone: "faint" }) }));
  const inner = k.planOutline(k.insetPlan(FB, 3), LAY.FOREBAY_H, P, 3);
  const id = clipId();
  out.push(`<clipPath id="${id}"><path d="${inner}"/></clipPath><g clip-path="url(#${id})"><path class="om-wall" d="${inner}"/><path class="pw-water" d="${k.planOutline(k.insetPlan(FB, 3), LAY.WATER_Z, P, 3)}"/>`);
  out.push(`<g data-part="intake"></g></g>`);
  out.push(Ln(inner, { tone: "lo" }));
  // inlet pipe from the stream behind
  out.push(tube([[FB.x + 14, FB.y - 26, 104], [FB.x + 14, FB.y, 104]], 4, { tone: "mid" }));
  out.push(S(G.disc(-1.2, 0, 6, G.frameAlong([FB.x + 14, FB.y, 104], [0, -1, 0]), P), { tone: "mid" }));
  return out.join("");
}

const GATE_X = FB.x + FB.w;
function gateFrame() {
  const out = [];
  for (const y of [-11, 8.6]) out.push(S(k.slabOf({ x: GATE_X, y, w: 2.4, d: 2.4, r: 0.4 }, LAY.FLUME_Z, 30, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: GATE_X - 0.2, y: -12, w: 3, d: 24, r: 0.6 }, LAY.FLUME_Z + 30, 3, P, 2, 0.3), { tone: "mid" }));
  out.push(S(k.cylinder(GATE_X + 1.4, 0, 0.8, LAY.FLUME_Z + 33, 5, P, 12), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(GATE_X + 1.4, 0, 4.6, LAY.FLUME_Z + 38, 1, P, 32), { tone: "mid", inner: Ln(k.ring(GATE_X + 1.4, 0, 3.4, LAY.FLUME_Z + 39, P, 24), { tone: "faint" }) }));
  return out.join("");
}
function gatePlate() {
  return S(k.slabOf({ x: GATE_X + 0.2, y: -8.6, w: 1.6, d: 17.2, r: 0.3 }, LAY.FLUME_Z + 2, 16, P, 2), { tone: "hi", crease: "lo", inner: Ln(k.sideSeam({ x: GATE_X + 0.2, y: -8.6, w: 1.6, d: 17.2, r: 0.3 }, LAY.FLUME_Z + 12, P, 2), { tone: "faint" }) });
}

function trestles() {
  const out = [];
  for (const [x, half] of [[-160, 10], [-131, 10], [-102, 18]]) {
    const post = (y) => S(k.cylinder(x, y, 1.8, 0, LAY.FLUME_Z - 4, P, 16), { tone: "mid", crease: "none" }) + S(k.cylinder(x, y, 3, 0, 1.2, P, 20), { tone: "lo" });
    out.push(post(-half));
    out.push(tube([[x, -half, 10], [x, half, LAY.FLUME_Z - 12]], 0.9, { tone: "lo" }));
    out.push(S(k.slabOf({ x: x - 2.4, y: -half - 2.4, w: 4.8, d: half * 2 + 4.8, r: 0.6 }, LAY.FLUME_Z - 4, 4, P, 2, 0.3), { tone: "mid" }));
    out.push(post(half));
  }
  return out.join("");
}

const [FX0, FX1] = LAY.FLUME;
const FW = LAY.FLUME_W;
function flume() {
  const out = [];
  const z = LAY.FLUME_Z;
  out.push(S(k.slabOf({ x: FX0, y: -FW - 1.4, w: FX1 - FX0, d: 1.4, r: 0.3 }, z + 2, 7, P, 2), { tone: "mid" }));
  out.push(S(k.slabOf({ x: FX0, y: -FW - 1.4, w: FX1 - FX0, d: FW * 2 + 2.8, r: 0.4 }, z, 2, P, 2, 0.3), { tone: "mid" }));
  const water = k.planOutline({ x: FX0, y: -FW, w: FX1 - FX0, d: FW * 2, r: 0.2 }, z + 4.5, P, 2);
  out.push(`<g data-part="flume-water" opacity="0"><path class="pw-water" d="${water}"/>${Ln([-5, 0, 5].map((y) => k.lineOnTop([FX0 + 2, y], [FX1 - 0.5, y], z + 4.5, P)).join(""), { tone: "mid", flow: true })}</g>`);
  const near = { x: FX0, y: FW, w: FX1 - FX0, d: 1.4, r: 0.3 };
  const ribs = [];
  for (let x = FX0 + 10; x < FX1 - 4; x += 12) ribs.push(k.segment([x, FW + 1.4, z + 2], [x, FW + 1.4, z + 9], P));
  out.push(S(k.slabOf(near, z + 2, 7, P, 2), { tone: "mid", inner: Ln(ribs.join(""), { tone: "faint" }) }));
  return out.join("");
}
function fall() {
  const lines = [-5, 0, 5].map((y) => k.pathOf([[FX1, y, LAY.FLUME_Z + 2], [FX1 + 2.6, y, LAY.FLUME_Z + 0.4], [FX1 + 4.4, y, LAY.FLUME_Z - 4], [FX1 + 5.2, y, WZ + LAY.R - 2]].map(at))).join("");
  return `<g data-part="fall" opacity="0">${Ln(lines, { tone: "hi", flow: true })}</g>`;
}

// ---------------------------------------------------------------- axle frames
function aFrame(y) {
  const out = [];
  const top = [WX, y, WZ - 5];
  out.push(tube([[WX - 22, y, 0.6], top], 2.2, { tone: "mid" }));
  out.push(tube([[WX + 22, y, 0.6], top], 2.2, { tone: "mid" }));
  out.push(tube([[WX - 14.4, y, 20], [WX + 14.4, y, 20]], 1.4, { tone: "mid" }));
  for (const x of [WX - 22, WX + 22]) out.push(S(k.cylinder(x, y, 3.8, 0, 1.2, P, 20), { tone: "lo" }));
  const block = { x: WX - 7, y: y - 4, w: 14, d: 8, r: 1 };
  out.push(S(k.slabOf(block, WZ - 7, 4, P, 3, 0.4), { tone: "mid" }));
  const F = G.frameOf([WX, y - 4, WZ], Y, [1, 0, 0], [0, 0, 1]);
  out.push(S(G.disc(0, 8, 5.4, F, P), { tone: "mid", inner: Ln(G.circleOf(F, 8, 3.2, P, 24), { tone: "lo" }) }));
  out.push(D([at([WX - 4.6, y + 4, WZ - 3]), at([WX + 4.6, y + 4, WZ - 3])], { size: 0.45 }));
  return out.join("");
}
const axleStub = (y0, y1) => S(G.disc(y0, y1, 3, G.frameOf([WX, 0, WZ], Y, [1, 0, 0], [0, 0, 1]), P), { tone: "mid" });

// ---------------------------------------------------------------- countershaft
function pedestal(y) {
  const out = [];
  const plan = { x: PX - 5, y: y - 4, w: 10, d: 8, r: 1 };
  out.push(S(k.slabOf({ x: PX - 8, y: y - 6, w: 16, d: 12, r: 1.2 }, 0, 2, P, 3), { tone: "lo" }));
  out.push(S(k.slabOf(plan, 2, WZ - 6, P, 3, 0.4), { tone: "mid", inner: Ln(k.sideSeam(plan, 30, P, 3), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: PX - 6, y: y - 4, w: 12, d: 8, r: 1 }, WZ - 4, 8, P, 3, 0.4), { tone: "mid" }));
  out.push(D([at([PX - 4, y + 4, WZ + 2]), at([PX + 4, y + 4, WZ + 2])], { size: 0.45 }));
  return out.join("");
}
const shaft = (y0, y1) => S(G.disc(y0, y1, 1.8, PARTS.Fp, P), { tone: "mid" });

function belt() {
  const spans = PARTS.beltSpans();
  return spans.map(({ t1, t2 }) => {
    const pts = [[t1[0], LAY.BELT_Y - 1.4, t1[1]], [t2[0], LAY.BELT_Y - 1.4, t2[1]], [t2[0], LAY.BELT_Y + 1.4, t2[1]], [t1[0], LAY.BELT_Y + 1.4, t1[1]]].map(at);
    return `<path class="pw-belt" d="${k.pathOf(pts, true)}"/>`;
  }).join("");
}

// ---------------------------------------------------------------- alternator
const [AX, AZ] = LAY.ALT;
function alternator() {
  const out = [];
  const stand = { x: AX - 12, y: 8, w: 24, d: 22, r: 1.5 };
  out.push(`<path class="iso-halo" d="${k.haloOf(stand, 0, 8, P)}" style="filter:blur(4px)"/>`);
  out.push(S(k.slabOf(stand, 0, 18, P, 3, 0.6), { tone: "mid", inner: Ln(k.sideSeam(stand, 9, P, 3), { tone: "faint" }) }));
  out.push(D(k.pointsAt([[stand.x + 3, stand.y + 3, 18], [stand.x + stand.w - 3, stand.y + 3, 18], [stand.x + 3, stand.y + stand.d - 3, 18], [stand.x + stand.w - 3, stand.y + stand.d - 3, 18]], P), { size: 0.45 }));
  for (const y of [13, 22]) out.push(S(k.slabOf({ x: AX - 6, y, w: 12, d: 2.4, r: 0.5 }, 18, 6, P, 2), { tone: "mid" }));
  const F = G.frameOf([AX, 0, AZ], Y, [1, 0, 0], [0, 0, 1]);
  const ribs = G.ribsOf(F, 13, 25.4, 8.2, 30, P, { fade: [0.1, 0.55] });
  out.push(S(G.solidOf([[12, 6.4], [13, 8.2], [25.4, 8.2], [26.4, 7]], F, P), { tone: "mid", inner: k.fadedSvg(ribs, { tone: "lo" }) }));
  out.push(S(G.disc(26.4, 27.6, 6, F, P), { tone: "mid", inner: Ln(G.spokesOf(F, 27.6, 2, 5.4, 12, P), { tone: "lo" }) + Ln(G.circleOf(F, 27.6, 2, P, 16) + G.circleOf(F, 27.6, 5.4, P, 32), { tone: "lo" }) }));
  out.push(S(G.disc(27.6, 32.4, LAY.ALT_R, F, P), { tone: "mid", inner: Ln(G.circleOf(F, 32.4, 1, P, 12), { tone: "lo" }) }));
  // output terminal on top
  out.push(S(k.cylinder(AX + 3, 17, 1.2, AZ + 7.6, 2.6, P, 12), { tone: "mid" }));
  return out.join("");
}

// ---------------------------------------------------------------- batteries, meter, bulbs
const BN = LAY.BENCH;
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BN, 0, 10, P)}"/>`];
  const legs = byDepth(k.corners(BN, 2.6));
  const leg = ([x, y]) => S(k.slabOf({ x: x - 1.4, y: y - 1.4, w: 2.8, d: 2.8, r: 0.4 }, 0, LAY.BENCH_Z, P, 2), { tone: "mid" });
  out.push(legs.slice(0, 2).map(leg).join(""));
  out.push(S(k.slabOf({ x: BN.x + 3, y: BN.y + 2, w: BN.w - 6, d: 1.4, r: 0.3 }, 6, 2, P, 2), { tone: "mid" }));
  out.push(legs.slice(2).map(leg).join(""));
  out.push(S(k.slabOf(BN, LAY.BENCH_Z, 3, P, 3, 0.6), { tone: "mid" }));
  return out.join("");
}
const BAT = [{ x: BN.x + 4, y: BN.y + 4, w: 17, d: 18, r: 1.2 }, { x: BN.x + 24, y: BN.y + 4, w: 17, d: 18, r: 1.2 }];
const BAT_Z = LAY.BENCH_Z + 3;
const BAT_H = 16;
const posts = (b) => [[b.x + 3.4, b.y + 4], [b.x + b.w - 3.4, b.y + 4]];
function batteries() {
  const out = [];
  BAT.forEach((b, i) => {
    out.push(S(k.slabOf(b, BAT_Z, BAT_H, P, 3, 0.6), { tone: "hi", crease: "lo", inner: Ln(k.sideSeam(b, BAT_Z + BAT_H - 3, P, 3), { tone: "faint" }) }));
    out.push(Ln(k.planOutline(k.insetPlan(b, 2), BAT_Z + BAT_H, P, 3), { tone: "faint" }));
    out.push(D(k.pointsAt([0, 1, 2, 3, 4, 5].map((c) => [b.x + 3 + c * 2.2, b.y + b.d - 4, BAT_Z + BAT_H]), P), { size: 0.5, tone: "lo" }));
    for (const [x, y] of posts(b)) out.push(S(k.cylinder(x, y, 1.3, BAT_Z + BAT_H, 2.2, P, 16), { tone: "mid" }));
    out.push(k.faceTextSvg(k.sideMatrix([b.x + 3, b.y + b.d], BAT_Z + 8, P, "left"), i === 0 ? "12 V" : "12 V", { size: 2.6, tone: "lo" }));
  });
  // link between the two batteries, in parallel
  const z = BAT_Z + BAT_H + 2.2;
  out.push(tube([[BAT[0].x + BAT[0].w - 3.4, BAT[0].y + 4, z], [BAT[0].x + BAT[0].w - 3.4, BAT[0].y + 4, z + 2.4], [BAT[1].x + BAT[1].w - 3.4, BAT[1].y + 4, z + 2.4], [BAT[1].x + BAT[1].w - 3.4, BAT[1].y + 4, z]], 0.6, { tone: "mid", bend: 1.6, className: "pw-cable" }));
  return out.join("");
}
const METER = { x: BN.x + 44, y: BN.y + 7, w: 9, d: 12, r: 1 };
const METER_TOP = BAT_Z + 6;
function meter() {
  const out = [];
  out.push(S(k.slabOf(METER, BAT_Z, 6, P, 3, 0.5), { tone: "mid" }));
  const [gx, gy] = [METER.x + METER.w / 2, METER.y + METER.d / 2];
  out.push(S(k.cylinder(gx, gy, 3.8, METER_TOP, 1.2, P, 40, 0.3), { tone: "hi", crease: "lo" }));
  out.push(Ln(k.ring(gx, gy, 3.2, METER_TOP + 1.2, P, 40), { tone: "lo" }));
  const t = k.radialTicks(gx, gy, 3.1, 20, 5, METER_TOP + 1.2, [0.5, 1], P, (-120 * Math.PI) / 180, (240 * Math.PI) / 180);
  out.push(Ln(t.minor, { tone: "lo" }), Ln(t.major, { tone: "mid" }));
  return out.join("");
}
function needle(volts) {
  const [gx, gy] = [METER.x + METER.w / 2, METER.y + METER.d / 2];
  const a = ((-120 + 240 * Math.min(1, Math.max(0, (volts - 10) / 5))) * Math.PI) / 180;
  return k.lineOnTop([gx - Math.sin(a) * 0.8, gy + Math.cos(a) * 0.8], [gx + Math.sin(a) * 2.9, gy - Math.cos(a) * 2.9], METER_TOP + 1.3, P);
}

function cables() {
  const out = [];
  const top = BAT_Z + BAT_H + 2.2;
  const [p0] = posts(BAT[0]);
  out.push(tube([[AX + 3, 17, AZ + 10.2], [AX + 3, 17, AZ + 18], [p0[0], p0[1], AZ + 18], [p0[0], p0[1], top]], 0.7, { tone: "mid", bend: 4, className: "pw-cable" }));
  const [, p1] = posts(BAT[1]);
  const [px, py] = LAY.POLES[0];
  out.push(tube([[p1[0], p1[1], top], [p1[0], p1[1], top + 8], [px - 2.6, py + 2, top + 8], [px - 2.6, py + 2, LAY.POLE_TOP - 6]], 0.7, { tone: "mid", bend: 4, className: "pw-cable" }));
  return out.join("");
}

function pole([x, y]) {
  const out = [];
  out.push(S(k.cylinder(x, y, 4, 0, 2, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, 1.8, 2, LAY.POLE_TOP - 2, P, 20), { tone: "mid", crease: "none", inner: Ln(k.sideArc(x, y, 1.8, 40, P, 12), { tone: "faint" }) }));
  out.push(S(k.slabOf({ x: x - 5, y: y - 1, w: 10, d: 2, r: 0.4 }, LAY.POLE_TOP - 6, 2, P, 2), { tone: "mid" }));
  out.push(S(k.cylinder(x, y, 2.4, LAY.POLE_TOP, 1, P, 20), { tone: "mid" }));
  return out.join("");
}
function wire() {
  const [[x, y0], [, y1]] = LAY.POLES;
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const y = y0 + ((y1 - y0) * i) / 40;
    pts.push([x, y, PARTS.catenary(y)]);
  }
  return tube(pts, 0.45, { tone: "mid", className: "pw-cable" });
}
function bulbs() {
  const [[x]] = LAY.POLES;
  return PARTS.BULB_Y.map((y, i) => {
    const z = PARTS.catenary(y);
    const out = [];
    out.push(S(k.cylinder(x, y, 0.35, z - 3, 3, P, 8), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(x, y, 1.2, z - 5.2, 2.2, P, 16), { tone: "mid" }));
    const c = [x, y, z - 7.6];
    out.push(`<g class="pw-bulb" data-bulb="${i}">${S(G.sphereOf(c, 2.6, P), { tone: "mid" })}</g>`);
    return out.join("");
  }).join("");
}
function glows() {
  const [[x]] = LAY.POLES;
  return PARTS.BULB_Y.map((y, i) => {
    const [sx, sy] = at([x, y, PARTS.catenary(y) - 7.6]);
    return `<circle class="pw-glow" data-glow="${i}" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="16" fill="url(#pw-glow)" opacity="0"/>`;
  }).join("");
}

// ---------------------------------------------------------------- assemble
const FAR_A = -22;
const NEAR_A = 22;
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: "A small water-power plant on one base. Water from a stone forebay runs through a sluice gate along a flume on trestles and falls into the buckets of a 2.4 metre overshot wheel. A toothed ring on the wheel drives a small pinion, whose shaft turns a one-metre pulley; a belt from it spins a car alternator a hundred times faster than the wheel. Cables run from the alternator to two 12 volt batteries with a voltmeter, and from them to a string of six bulbs hung between two poles.",
  body: [
    `<defs><radialGradient id="pw-glow"><stop offset="0" stop-color="var(--pw-glow)" stop-opacity=".95"/><stop offset=".35" stop-color="var(--pw-glow)" stop-opacity=".45"/><stop offset="1" stop-color="var(--pw-glow)" stop-opacity="0"/></radialGradient></defs>`,
    step(1, base()),
    step(1, channelBack()),
    step(2, forebay()),
    step(3, trestles()),
    step(2, gateFrame()),
    step(2, `<g data-part="gate">${gatePlate()}</g>`),
    step(3, flume()),
    step(5, aFrame(FAR_A)),
    step(5, axleStub(-26, -18)),
    step(4, `<g data-part="wheel">${PARTS.wheel(0)}</g>`),
    step(3, fall()),
    step(1, channelFront()),
    step(5, aFrame(NEAR_A)),
    step(5, axleStub(18, 27)),
    step(6, `<g data-part="pinion">${PARTS.pinion(0)}</g>`),
    step(6, shaft(13.4, 16)),
    step(6, pedestal(20)),
    step(6, shaft(24, 28)),
    step(7, belt()),
    step(6, `<g data-part="pulley">${PARTS.pulley(0)}</g>`),
    step(6, shaft(32.4, 36)),
    step(6, pedestal(40)),
    step(6, shaft(44, 46)),
    step(7, alternator()),
    step(8, bench()),
    step(8, batteries()),
    step(8, meter()),
    step(8, `<path class="iso-line" data-tone="hi" data-part="needle" data-free="start" style="stroke-width:.9" d="${needle(12.4)}"/>`),
    step(8, cables()),
    step(8, pole(LAY.POLES[0])),
    step(8, wire()),
    step(8, bulbs()),
    step(8, pole(LAY.POLES[1])),
    step(8, glows()),
  ],
});

// ---------------------------------------------------------------- page
const CSS = `<style>
.iso{--pw-water:#1c2023;--pw-glow:#ffe2a0;--pw-belt:#1a1a1a;--om-wall:#0d0d0d;--om-ring:#ffffff14;--om-hover:#232323}
.iso[data-theme="light"]{--pw-water:#dfe5e8;--pw-glow:#f4a640;--pw-belt:#e4e4e1;--om-wall:#dcdcd8;--om-ring:#0000001a;--om-hover:#f0f0ed}
.pw-water{fill:var(--pw-water)}
.iso-line[data-flow]{animation-duration:var(--pw-flow-dur,1600ms)}.om-wall{fill:var(--om-wall)}
.pw-belt{fill:var(--pw-belt);stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight);stroke-linejoin:round}
[data-flowing] .pw-full>.iso-top,[data-flowing] .pw-full>.iso-shade{fill:var(--pw-water)}
[data-live] .pw-cable .tb-edge{stroke:var(--anatomy-lit)}
.pw-bulb[data-on] .iso-fill,.pw-bulb[data-on] .iso-shade,.pw-bulb[data-on] .iso-top{fill:var(--pw-glow);stroke:var(--pw-glow)}
.pw-bulb[data-on] .iso-edge{stroke:var(--anatomy-lit)}
.pw-glow{pointer-events:none;mix-blend-mode:screen}
.iso[data-theme="light"] .pw-glow{mix-blend-mode:multiply}
.om-stage-box{position:relative;outline:none;touch-action:pan-y}
.om-stage-box:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}
.pw-controls{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:10px 18px;margin-top:10px}
.pw-gate{display:flex;align-items:center;gap:10px;font-family:var(--anatomy-mono);font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted)}
.pw-gate input{width:170px;accent-color:var(--anatomy-hi)}
.pw-gate output{min-width:64px;color:var(--anatomy-strong);letter-spacing:.04em}
.og .pw-gate[hidden]{display:none}
.pw-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:1px;margin-top:12px;background:var(--om-ring);border:1px solid var(--om-ring)}
.pw-stats div{background:var(--anatomy-card);padding:8px 10px}
.pw-stats span{display:block;font-family:var(--anatomy-mono);font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted)}
.pw-stats b{display:block;margin-top:2px;font:600 15px/1.2 var(--anatomy-mono);color:var(--anatomy-strong);font-variant-numeric:tabular-nums}
@media (max-width:640px){.pw-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.pw-gate input{width:120px}}
${GUIDE_MODE ? readFileSync(join(HERE, "..", "guide.css"), "utf8") : ""}
</style>`;

const controls = `<div class="pw-stats" aria-hidden="true"><div><span>Flow</span><b data-stat="flow">0 L/s</b></div><div><span>Wheel</span><b data-stat="wheel">0 rpm</b></div><div><span>Alternator</span><b data-stat="alt">0 rpm</b></div><div><span>Battery</span><b data-stat="volts">12.6 V</b></div><div><span>Power</span><b data-stat="watts">0 W</b></div></div><div class="pw-controls"><label class="pw-gate" data-run-only><span>Sluice</span><input id="pw-gate" type="range" min="0" max="100" step="1" value="${GUIDE_MODE ? 0 : 70}" data-gate aria-label="Sluice gate opening in percent"><output data-gate-out>${GUIDE_MODE ? 0 : 70}% open</output></label></div>`;
const LIVE = `<span aria-live="polite" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)" data-live></span>`;
const CAPTION = `An overshot wheel ${(LAY.R * 2 * 0.025).toFixed(1)} m across under a ${M.HEAD} m head. Water power is 9.81 × flow × head; the wheel keeps about ${M.WHEEL_EFF * 100}% of it, and the gears, belt and a car alternator about half of that again. A 120-tooth ring on the wheel turns a 10-tooth pinion, and its 1 m pulley belts a 12 cm alternator pulley, ${M.RATIO.toFixed(0)}:1 in all. A car alternator does not charge below about ${M.CUT_IN.toLocaleString("en")} rpm, so below ${M.cutInFlow().toFixed(0)} L/s the wheel turns and nothing reaches the batteries. Fully open, ${M.Q_MAX} L/s gives about ${Math.round(M.CHAIN_EFF * M.hydroWatts(M.Q_MAX))} W, ten 60 W bulbs' worth; the string has six.`;

const body = GUIDE_MODE
  ? CSS + `<div class="og">` + k.plateHtml({
      fig: "Reboot 23",
      title: "Make electricity from a stream",
      hint: "← → step through the guide",
      readout: GUIDE[0].readout,
      keys: [{ mark: "lit", label: "What this step adds; in part B, live current" }, { mark: "raised", label: "Parts already in place" }],
      caption: `${CAPTION} This is a guide to how the parts go together, not engineering drawings: have the dam, the wheel's bearings and the wiring checked before you build, and fuse the battery leads.`,
      body: `<div class="om-stage-box" tabindex="0" role="group" aria-label="Water wheel generator build guide. Left and right arrows step through the guide.">${svg}</div>${controls}<nav class="og-rail" data-rail aria-label="Guide steps"></nav><section class="og-panel" data-panel></section><div class="og-nav"><button type="button" data-prev>← Back</button><button type="button" data-next>Next →</button></div>${LIVE}`,
    }) + `</div>`
  : CSS + k.plateHtml({
      fig: "Reboot 23",
      title: "Electricity from a stream",
      hint: "Drag the sluice · ← → open and close",
      readout: "",
      keys: [{ mark: "lit", label: "Current: the cables and the bulbs it lights" }, { mark: "raised", label: "The wheel, the batteries and the gate" }],
      caption: CAPTION,
      body: `<div class="om-stage-box" tabindex="0" role="group" aria-label="Water wheel generator. Left and right arrows open and close the sluice.">${svg}</div>${controls}${LIVE}`,
    });

const strip = (src) => src.replace(/^import .*$/gm, "").replace(/^export /gm, "");
const latheSource = readFileSync(`${SKILL}/kit/lathe.mjs`, "utf8");
const latheNames = [...latheSource.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
const modelSource = readFileSync(join(HERE, "model.mjs"), "utf8");
const modelNames = [...modelSource.matchAll(/^export (?:function|const) ([A-Za-z0-9_]+)/gm)].map((m) => m[1]);
const DATA = { P, guide: GUIDE_MODE ? GUIDE : null, chapters: CHAPTERS, needle: { meter: METER, top: METER_TOP } };
const runtime = [
  kitScript(),
  `const k = { ${Object.keys(k).join(", ")} };`,
  `const G = (() => {\n${strip(latheSource)}\nreturn { ${latheNames.join(", ")} };\n})();`,
  `const M = (() => {\n${strip(modelSource)}\nreturn { ${modelNames.join(", ")} };\n})();`,
  strip(readFileSync(join(HERE, "parts.mjs"), "utf8")),
  `const DATA = ${JSON.stringify(DATA)};`,
  `const needleAt = ${needle.toString().replace(/METER_TOP/g, "DATA.needle.top").replace(/METER\b/g, "DATA.needle.meter")};`,
  readFileSync(join(HERE, "live.js"), "utf8"),
  GUIDE_MODE ? readFileSync(join(HERE, "..", "guide.js"), "utf8") : "",
].join("\n");

const name = GUIDE_MODE ? "power-guide" : "power";
const file = theme === "light" ? `${name}-light.html` : `${name}.html`;
writeFileSync(join(OUT, file), k.pageHtml({ title: GUIDE_MODE ? "Make electricity from a stream" : "Electricity from a stream", theme, body, script: runtime, width: 820 }));
console.log("wrote", join(OUT, file), Math.round(svg.length / 1024) + " KB svg");
