// An updraft wood-fired kiln: one firing of green bricks and pots. Every number on the page reads from here.
// Sourced: bricks fire at 900–1,000 °C, earthenware at 1,000–1,200 °C (it can go as low as 600 °C).
// Physics: water boils at 100 °C; hot bodies start to glow visibly at about 525 °C (the Draper point).
// Assumed (the model's own schedule, said so on the page): the hours below.

export const AMBIENT = 20; // °C
export const SMOKE_END = 6; // h of slow "water-smoking" up to 200 °C
export const SMOKE_TO = 200; // °C
export const CLIMB_END = 14; // h, 100 °C an hour from 200 to 1,000 °C
export const TOP = 1000; // °C, bricks done, the bottom of the earthenware range
export const SOAK_END = 15; // h, one hour held at the top
export const COOL_TAU = 8; // h, natural cooling with every opening shut
export const CONES = [900, 950, 1000, 1050]; // the cone pack: guide, firing, target, guard
export const CONE_SPAN = 30; // °C: a cone starts to bend this far below its rating and is down at it
export const DRAPER = 525; // °C
export const OPEN_AT = 100; // °C, unbrick the door below this

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ease = (x) => { const t = clamp(x); return t * t * (3 - 2 * t); };

export function tempAt(h) {
  if (h <= 0) return AMBIENT;
  if (h < SMOKE_END) return AMBIENT + ((SMOKE_TO - AMBIENT) * h) / SMOKE_END;
  if (h < CLIMB_END) return SMOKE_TO + ((TOP - SMOKE_TO) * (h - SMOKE_END)) / (CLIMB_END - SMOKE_END);
  if (h < SOAK_END) return TOP;
  return AMBIENT + (TOP - AMBIENT) * Math.exp(-(h - SOAK_END) / COOL_TAU);
}
// the schedule only climbs until the soak ends, so the hottest moment so far is easy to find
export const peakTo = (h) => tempAt(Math.min(h, SOAK_END));
export const coneBend = (peak, rating) => clamp((peak - rating + CONE_SPAN) / CONE_SPAN);
export const conesDown = (peak) => CONES.filter((c) => coneBend(peak, c) >= 0.999).length;
// how hard the fire is being driven: low while water-smoking, full in the climb, held in the soak, out when cooling
export function fireOf(h) {
  if (h <= 0) return 0;
  if (h < SMOKE_END) return 0.3;
  if (h < CLIMB_END) return 1;
  if (h < SOAK_END) return 0.7;
  return 0.7 * Math.exp(-(h - SOAK_END) / 1.2); // embers die away once stoking stops
}
// visible glow of the ware and walls: none below the Draper point, full at the top
export const glowOf = (t) => clamp((t - DRAPER) / (TOP - DRAPER));
export function colourOf(t) {
  if (t < DRAPER) return "none";
  if (t < 700) return "dull red";
  if (t < 850) return "cherry red";
  return "orange";
}
export const coolHours = () => SOAK_END + COOL_TAU * Math.log((TOP - AMBIENT) / (OPEN_AT - AMBIENT));
export function phaseOf(h) {
  if (h <= 0) return "cold";
  if (h < SMOKE_END) return "water-smoking";
  if (h < CLIMB_END) return "climbing";
  if (h < SOAK_END) return "soaking";
  return tempAt(h) > OPEN_AT ? "cooling" : "unload";
}
