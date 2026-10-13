// Shared guide runtime. The figure's live script defines guideBuild(step) and guideRun(step).
const STEPS = DATA.guide;
const BUILD = STEPS.filter((s) => s.part === "A").length;
const groups = [...svg.querySelectorAll(".om-part")];
const rail = document.querySelector("[data-rail]");
const panel = document.querySelector("[data-panel]");
const prev = document.querySelector("[data-prev]");
const next = document.querySelector("[data-next]");
const runOnly = [...document.querySelectorAll("[data-run-only]")];
const esc = (text) => String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const NAMES = DATA.chapters || { A: "A · Build the machine", B: "B · Run it" };
let current = -1;

rail.innerHTML = ["A", "B"].map((p) => `<div class="og-chapter"><span class="og-chapter-name">${NAMES[p]}</span><div class="og-chips">${STEPS.map((s, i) => (s.part === p ? `<button type="button" class="og-chip" data-go="${i}" aria-label="Step ${i + 1}: ${esc(s.title)}"><span class="om-num">${String(i + 1).padStart(2, "0")}</span>${esc(s.short)}</button>` : "")).join("")}</div></div>`).join("");
const chips = [...rail.querySelectorAll(".og-chip")];

function show(index) {
  index = Math.max(0, Math.min(STEPS.length - 1, index));
  const s = STEPS[index];
  const built = s.part === "A" ? index + 1 : BUILD;
  for (const g of groups) {
    const n = Number(g.dataset.step);
    g.dataset.state = n < built ? "done" : n === built && s.part === "A" ? "now" : n > built ? "later" : "done";
  }
  chips.forEach((chip, i) => { chip.toggleAttribute("data-on", i === index); chip.toggleAttribute("data-past", i < index); });
  runOnly.forEach((node) => { node.hidden = s.part !== "B"; });
  panel.innerHTML = `
    <div class="og-head"><span class="og-count">Step ${index + 1} of ${STEPS.length}</span><h2 class="og-title">${esc(s.title)}</h2></div>
    <p class="og-lead">${esc(s.lead)}</p>
    <div class="og-cols">
      <div><h3>You need</h3><ul>${s.need.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>
      <div><h3>Do</h3><ol>${s.steps.map((n) => `<li>${esc(n)}</li>`).join("")}</ol></div>
    </div>
    <p class="og-check"><span>Check</span>${esc(s.check)}</p>`;
  prev.disabled = index === 0;
  next.textContent = index === STEPS.length - 1 ? "Start again" : index === BUILD - 1 ? `${NAMES.B.replace(/^B · /, "")} →` : "Next →";
  if (s.part === "A") guideBuild(s); else guideRun(s);
  live.textContent = `Step ${index + 1}: ${s.title}`;
  current = index;
}

rail.addEventListener("click", (event) => { const b = event.target.closest("[data-go]"); if (b) show(Number(b.dataset.go)); });
prev.addEventListener("click", () => show(current - 1));
next.addEventListener("click", () => show(current === STEPS.length - 1 ? 0 : current + 1));
box.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight") show(current + 1);
  else if (event.key === "ArrowLeft") show(current - 1);
  else if (event.key === "Home") show(0);
  else if (event.key === "End") show(STEPS.length - 1);
  else return;
  event.preventDefault();
});
const start = Number((location.hash.match(/^#step(\d+)$/) || [])[1] || 1) - 1;
show(start);

// ---- reel mode: #reel plays the guide by itself as a 1080 × 1920 vertical video ----
if (location.hash.startsWith("#reel")) {
  const root = document.documentElement;
  root.classList.add("reel");
  const font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@800;900&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap";
  document.head.appendChild(font);
  const figText = document.querySelector('[data-corner="fig"]')?.textContent || "";
  const number = (figText.match(/(\d+)/) || [])[1] || "";
  const title = document.querySelector('[data-corner="title"]')?.textContent || document.title;
  const head = document.createElement("div");
  head.className = "reel-head";
  head.innerHTML = `<div class="reel-kicker">Reboot · 50 machines to restart civilization</div><div class="reel-num"><b>${esc(number)}</b><span>/50</span></div><div class="reel-title">${esc(title)}</div>`;
  const foot = document.createElement("div");
  foot.className = "reel-step";
  const bar = document.createElement("div");
  bar.className = "reel-bar";
  bar.innerHTML = STEPS.map(() => "<i></i>").join("");
  const end = document.createElement("div");
  end.className = "reel-end";
  end.innerHTML = `<div class="reel-kicker">Machine ${esc(number)} of 50</div><div class="reel-end-title">Build it yourself</div><div class="reel-end-sub">The full step-by-step guide is on the Reboot site. Link in bio.</div><div class="reel-end-mark">REBOOT</div>`;
  const plate = document.querySelector(".iso-plate");
  plate.append(head, foot, bar, end);
  const segs = [...bar.children];
  const STEP_MS = (s) => (s.part === "A" ? 1500 : 5800);
  const plan = [];
  let t = 1200;
  STEPS.forEach((s, i) => { plan.push({ at: t, index: i }); t += STEP_MS(s); });
  const ENDS = t;
  const DONE = t + 2600;
  const say = (i) => {
    const s = STEPS[i];
    foot.innerHTML = `<div class="reel-chapter">${s.part === "A" ? "Build" : "Run"} · step ${i + 1} of ${STEPS.length}</div><div class="reel-step-title">${esc(s.title)}</div><div class="reel-lead">${esc(s.lead)}</div>`;
    segs.forEach((seg, k) => seg.toggleAttribute("data-on", k <= i));
  };
  let shown = -1;
  let start = 0;
  say(0);
  const play = () => {
    const now = performance.now();
    if (!start) start = now;
    const ms = now - start;
    let want = 0;
    for (const p of plan) if (ms >= p.at) want = p.index;
    if (want !== shown) { shown = want; show(want); say(want); }
    root.toggleAttribute("data-reel-end", ms >= ENDS);
    if (ms >= DONE) { root.dataset.reelDone = "1"; return; }
    requestAnimationFrame(play);
  };
  requestAnimationFrame(play);
}
