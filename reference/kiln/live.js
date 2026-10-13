// Live behaviour. Globals from the inlined modules: k, G, T, M, LAY, makeParts, DATA.
const P = DATA.P;
const parts = makeParts(k, G, T, P);
const box = document.querySelector(".om-stage-box");
const svg = box.querySelector("svg");
const part = (name) => svg.querySelector(`[data-part="${name}"]`);
const el = {
  cones: part("cones"), lo: part("glow-lo"), hi: part("glow-hi"), holes: part("holes"), spy: part("spy"),
  fire: [part("fire-0"), part("fire-1")], spill: [part("spill-0"), part("spill-1")],
  doors: [part("door-0"), part("door-1")], damper: part("damper"),
};
const stat = (name) => document.querySelector(`[data-stat="${name}"]`);
const stats = { hour: stat("hour"), temp: stat("temp"), glow: stat("glow"), cones: stat("cones"), phase: stat("phase") };
const readout = document.querySelector("[data-readout]");
const live = document.querySelector("[data-live]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const RUN_S = 4.5; // seconds a guide step takes to play its stretch of the firing
const END_H = Math.ceil(M.coolHours());

const state = { hour: 0, from: 0, to: 0, t0: 0, playing: false, touring: !DATA.guide && !still.matches, clock: 0, hold: 0, guideText: null };
const fmt = (n) => Math.round(n).toLocaleString("en");

let lastBends = null;
let lastText = "";
let lastPhase = "";
let lastShut = -1;
function draw() {
  const s = state;
  const h = s.hour;
  const t = M.tempAt(h);
  const peak = M.peakTo(h);
  const bends = M.CONES.map((c) => M.coneBend(peak, c));
  if (!lastBends || bends.some((b, i) => Math.abs(b - lastBends[i]) > 0.002)) {
    lastBends = bends;
    el.cones.innerHTML = parts.cones(bends);
  }
  const glow = M.glowOf(t);
  const flick = still.matches ? 1 : 0.82 + 0.1 * Math.sin(s.clock * 11.3) + 0.08 * Math.sin(s.clock * 17.9 + 1.3);
  const fire = M.fireOf(h);
  el.lo.setAttribute("opacity", (0.9 * smooth(0, 0.35, glow)).toFixed(3));
  el.hi.setAttribute("opacity", (0.85 * smooth(0.35, 1, glow)).toFixed(3));
  el.holes.setAttribute("opacity", (0.9 * Math.max(glow, 0.6 * fire)).toFixed(3));
  el.spy.setAttribute("opacity", (0.9 * glow).toFixed(3));
  el.fire.forEach((node, i) => node.setAttribute("opacity", (fire * flick * (i ? 0.95 : 1)).toFixed(3)));
  el.spill.forEach((node) => node.setAttribute("opacity", (0.35 * fire * flick).toFixed(3)));
  // once stoking stops, the doors slide over the stoke holes and the damper goes in
  const shut = smooth(M.SOAK_END, M.SOAK_END + 1.2, h);
  if (Math.abs(shut - lastShut) > 1e-4) {
    lastShut = shut;
    el.doors.forEach((node) => (shut > 0 ? node.setAttribute("transform", k.translateAlong(P, [-LAY.DOOR.slide * shut, 0, 0])) : node.removeAttribute("transform")));
    if (shut > 0) el.damper.setAttribute("transform", k.translateAlong(P, [-(LAY.DAMPER.out - 1.6) * shut, 0, 0])); else el.damper.removeAttribute("transform");
  }
  const down = M.conesDown(peak);
  const phase = M.phaseOf(h);
  stats.hour.textContent = `${h.toFixed(1)} h`;
  stats.temp.textContent = `${fmt(t)} °C`;
  stats.glow.textContent = M.colourOf(t);
  stats.cones.textContent = `${down} of ${M.CONES.length}`;
  stats.phase.textContent = phase;
  const text = s.guideText || `${fmt(t)} °C · ${h.toFixed(1)} h`;
  if (text !== lastText) { lastText = text; readout.textContent = text; }
  if (!s.guideText && phase !== lastPhase) {
    lastPhase = phase;
    if (!DATA.guide) live.textContent = phase;
  }
}

let frame = 0;
let last = 0;
let visible = false;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const s = state;
  s.clock += dt;
  if (s.touring) {
    if (s.hour < END_H) s.hour = Math.min(END_H, s.hour + dt * 1.25);
    else if ((s.hold += dt) > 3) { s.hold = 0; s.hour = 0; }
  } else if (s.playing) {
    const u = clamp((now - s.t0) / 1000 / RUN_S);
    s.hour = s.from + (s.to - s.from) * M.ease(u);
    if (u >= 1) { s.hour = s.to; s.playing = false; }
  }
  draw();
  const settled = !s.touring && !s.playing && M.fireOf(s.hour) < 0.01;
  frame = visible && !settled && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible && !still.matches) { last = 0; frame = requestAnimationFrame(tick); } else draw(); };
function playTo(hour) {
  const s = state;
  if (still.matches) { s.hour = hour; s.playing = false; draw(); return; }
  s.from = s.hour;
  s.to = hour;
  s.t0 = performance.now();
  s.playing = Math.abs(hour - s.hour) > 1e-3;
  run();
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(box);

// hooks for the guide runtime
function guideBuild(step) { state.guideText = step.readout; state.playing = false; state.hour = 0; draw(); }
function guideRun(step) { state.guideText = null; playTo(step.hour); draw(); }
draw();
