// Live behaviour. Globals from the inlined modules: k, G, M, LAY, makeParts, DATA, needleAt.
const P = DATA.P;
const parts = makeParts(k, G, P);
const box = document.querySelector(".om-stage-box");
const svg = box.querySelector("svg");
const part = (name) => svg.querySelector(`[data-part="${name}"]`);
const el = {
  wheel: part("wheel"), pinion: part("pinion"), pulley: part("pulley"), gate: part("gate"), needle: part("needle"),
  fall: part("fall"), flume: part("flume-water"), intake: part("intake"), tail: part("tail-flow"),
  bulbs: [...svg.querySelectorAll(".pw-bulb")], glows: [...svg.querySelectorAll(".pw-glow")],
};
const stat = (name) => document.querySelector(`[data-stat="${name}"]`);
const stats = { flow: stat("flow"), wheel: stat("wheel"), alt: stat("alt"), volts: stat("volts"), watts: stat("watts") };
const readout = document.querySelector("[data-readout]");
const live = document.querySelector("[data-live]");
const slider = document.querySelector("[data-gate]");
const sliderOut = document.querySelector("[data-gate-out]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

const state = { target: Number(slider.value) / 100, gate: Number(slider.value) / 100, rpm: 0, phi: 0, touring: !DATA.guide && !still.matches, clock: 0, guideText: null };
if (still.matches) { state.gate = state.target; state.rpm = M.wheelRpmOf(M.flowOf(state.gate)); }

const TOUR = [0.2, 0.45, 0.7, 1, 0.35];
const tourAt = (t) => TOUR[Math.floor(t / 4.5) % TOUR.length];
const fmt = (n) => Math.round(n).toLocaleString("en");

let lastPhi = NaN;
let lastText = "";
let lastPhase = "";
function draw() {
  const s = state;
  const q = M.flowOf(s.gate);
  const alt = s.rpm * M.RATIO;
  const watts = M.electricWatts(q, alt);
  const volts = M.voltsOf(alt);
  if (Math.abs(s.phi - lastPhi) > 1e-4 || Number.isNaN(lastPhi)) {
    lastPhi = s.phi;
    el.wheel.innerHTML = parts.wheel(s.phi);
    el.pinion.innerHTML = parts.pinion(s.phi);
    el.pulley.innerHTML = parts.pulley(s.phi);
  }
  el.gate.setAttribute("transform", k.translateAlong(P, [0, 0, 9 * s.gate]));
  const wet = clamp(q / 8);
  for (const node of [el.fall, el.flume, el.intake, el.tail]) node.setAttribute("opacity", wet.toFixed(3));
  svg.style.setProperty("--pw-flow-dur", `${Math.round(2600 - 1800 * clamp(q / M.Q_MAX))}ms`);
  svg.toggleAttribute("data-flowing", q > 2);
  svg.toggleAttribute("data-live", watts > 2);
  const lit = watts / M.BULB;
  el.bulbs.forEach((bulb, i) => bulb.toggleAttribute("data-on", lit - i > 0.08));
  el.glows.forEach((glow, i) => glow.setAttribute("opacity", (clamp(lit - i) * 0.9).toFixed(3)));
  el.needle.setAttribute("d", needleAt(volts));
  stats.flow.textContent = `${fmt(q)} L/s`;
  stats.wheel.textContent = `${s.rpm.toFixed(1)} rpm`;
  stats.alt.textContent = `${fmt(alt)} rpm`;
  stats.volts.textContent = `${volts.toFixed(1)} V`;
  stats.watts.textContent = `${fmt(watts)} W`;
  const phase = q < 1 ? "dry" : alt < M.CUT_IN ? "below" : watts < M.BULB * M.BULBS ? "charging" : "full";
  const text = s.guideText || (phase === "dry" ? "sluice shut · wheel still" : phase === "below" ? `below cut-in · ${fmt(alt)} of ${fmt(M.CUT_IN)} rpm` : `${fmt(watts)} W · ${(watts / volts).toFixed(1)} A · ${Math.min(M.BULBS, Math.floor(lit + 0.08))} of ${M.BULBS} bulbs`);
  if (text !== lastText) { lastText = text; readout.textContent = text; }
  if (phase !== lastPhase) {
    lastPhase = phase;
    live.textContent = { dry: "Sluice shut", below: "Wheel turning, alternator below cut-in", charging: "Charging", full: "Charging, every bulb lit" }[phase];
  }
}

let frame = 0;
let last = 0;
let visible = false;
let idle = 0;
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const s = state;
  if (s.touring) { s.clock += dt; const t = tourAt(s.clock); if (t !== s.target) { s.target = t; slider.value = String(Math.round(t * 100)); sliderOut.textContent = `${slider.value}% open`; } }
  if (still.matches) { s.gate = s.target; s.rpm = M.wheelRpmOf(M.flowOf(s.gate)); }
  else {
    s.gate += (s.target - s.gate) * (1 - Math.exp(-dt / 0.45));
    const want = M.wheelRpmOf(M.flowOf(s.gate));
    s.rpm += (want - s.rpm) * (1 - Math.exp(-dt / 1.6));
    if (Math.abs(want - s.rpm) < 0.005) s.rpm = want;
    s.phi += ((s.rpm * 2 * Math.PI) / 60) * dt;
  }
  draw();
  const settled = !s.touring && Math.abs(s.target - s.gate) < 1e-3 && s.rpm === 0;
  frame = visible && !settled && !still.matches ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } else if (still.matches) draw(); };
function setGate(value, fromUser = true) {
  state.target = clamp(value);
  slider.value = String(Math.round(state.target * 100));
  sliderOut.textContent = `${slider.value}% open`;
  if (fromUser && !DATA.guide) {
    state.touring = false;
    clearTimeout(idle);
    idle = setTimeout(() => { if (!still.matches) { state.touring = true; state.clock = 0; run(); } }, 9000);
  }
  run();
}

new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(box);
slider.addEventListener("input", () => setGate(Number(slider.value) / 100));
if (!DATA.guide) {
  box.addEventListener("keydown", (event) => {
    const stepBy = event.shiftKey ? 0.25 : 0.05;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") setGate(state.target + stepBy);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") setGate(state.target - stepBy);
    else if (event.key === "Home") setGate(0);
    else if (event.key === "End") setGate(1);
    else return;
    event.preventDefault();
  });
}

// hooks for the guide runtime
function guideBuild(step) { state.guideText = step.readout; setGate(0, false); draw(); }
function guideRun(step) { state.guideText = null; setGate(step.gate, false); draw(); }
draw();
