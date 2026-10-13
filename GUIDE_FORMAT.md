# Guide format

Every machine is one folder with these files. Copy `template/` and look at `reference/kiln` (simple) and `reference/power` (complex).

| File | Required from contributors | What it is |
|---|---|---|
| `meta.json` | yes | Number, slug, title, tagline, 3 key numbers, safety line, `needs`, `sources`, `author`. Schema: `community/machine.schema.json`. |
| `guide.mjs` | yes | `CHAPTERS` and `GUIDE`: the steps people read. |
| `model.mjs` | yes | Small pure functions with the real physics or process numbers. Drives the readout. |
| `parts.mjs`, `build.mjs`, `live.js` | optional | The isometric drawing and animation. Maintainers can make these with the project's drawing kit. |

## guide.mjs

```js
export const CHAPTERS = { A: "A · Build the <thing>", B: "B · <Run it>" };
export const GUIDE = [
  { part: "A", short: "Footing", title: "Lay a level footing",
    lead: "Why this step matters, in one or two plain sentences.",
    need: ["Material with real size", "Tool"],
    steps: ["Do this.", "Then this."],          // 2–3 per step
    check: "A test you can actually perform that proves the step is right.",
    readout: "short live label · real number" },
  // Part A: 5–9 build steps. Part B: 2–4 run steps (same fields).
];
```

## Writing rules
- Plain language, short sentences, metric units, real materials.
- Sentence-case titles that start with a verb ("Build a wind turbine").
- One check per step. A check is something you could see, measure or hear.
- Every number comes from a source listed in `meta.json` or from a formula stated in the caption. Say what the model assumes.
- A machine only needs machines that come before it.

## Drawing conventions (for whoever renders)
SVG only. Isometric camera, azimuth about 58°, viewBox 760 × 470. A base plate with a ruler strip and a label plate engraved `50 MACHINES · NN`. One lit accent (the thing to watch); monochrome otherwise. Both light and dark themes. Every line ends on something. Hazardous builds get a safety line in the caption.
