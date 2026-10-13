// Electricity from a stream: an overshot water wheel driving a car alternator.
// Every number on the page reads from here.

export const HEAD = 2.6; // m, from the flume to the tailrace
export const Q_MAX = 60; // L/s through the sluice when it is fully open
export const WHEEL_EFF = 0.8; // overshot wheels reach 80–90%
export const CHAIN_EFF = 0.5; // gears, belt and a car alternator together
export const RIM_RATIO = 12; // 120-tooth rim gear to a 10-tooth pinion
export const BELT_RATIO = 20 / 2.4; // 1.0 m pulley to a 12 cm alternator pulley
export const RATIO = RIM_RATIO * BELT_RATIO; // 100 : 1
export const CUT_IN = 1000; // alternator rpm before it starts to charge
export const FULL_AT = 1400; // rpm where it gives its full share
export const BULB = 60; // W per bulb on the string
export const BULBS = 6;

const ramp = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export const flowOf = (gate) => Q_MAX * gate; // L/s
export const hydroWatts = (q) => 9.81 * q * HEAD * WHEEL_EFF; // 1 L/s of water is 1 kg/s
export const wheelRpmOf = (q) => (q < 1 ? 0 : 2 + 0.25 * q); // a 2.4 m overshot wheel turns 8–17 rpm
export const charge = (altRpm) => ramp((altRpm - CUT_IN) / (FULL_AT - CUT_IN));
export const electricWatts = (q, altRpm) => CHAIN_EFF * hydroWatts(q) * charge(altRpm);
export const voltsOf = (altRpm) => 12.6 + 1.6 * charge(altRpm);
export const cutInFlow = () => (CUT_IN / RATIO - 2) / 0.25; // L/s
