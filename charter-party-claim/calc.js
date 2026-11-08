/**
 * charter-party-claim/calc.js — a time-charter speed and consumption claim by the good-weather method: the ship's
 * speed and daily consumption on good-weather days are extrapolated to the whole passage and compared with the
 * warranted performance at the owners' end of the "about" range; gains are credited from the other end.
 *
 * V_gw = D_gw / T_gw − current;  C_gw = F_gw / (T_gw / 24);  V_al = V_w − a_V;  C_al = C_w (1 + a_C)
 * T_gw = D / V_gw;  T_al = D / V_al;  time lost = T_gw − T_al
 * fuel at good-weather performance = C_gw T_gw / 24;  allowed fuel = C_al T_al / 24;  over-consumption = difference
 * credits (offset): time gained below D / (V_w + a_V), fuel saved below C_w (1 − a_C) T_al / 24
 * Schema units: knots, nautical miles, hours, tonnes, tonnes per day, currency.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf, assertFinite } from '../shared/validate.js';

export const schema = {
  id: 'charter-party-claim',
  name: 'Charter party performance claim',
  category: 'maritime',
  summary: 'Time lost and over-consumption against the warranted speed and consumption by the good-weather method, with the "about" allowances and the claim value.',
  related: ['speed-power-fit', 'fuel-voyage-cost', 'optimal-speed-charter', 'beaufort-sea-state'],
  assumptions: [
    'Good-weather method of English law: the performance on the good-weather periods of the passage (as the charter party defines them, typically up to Beaufort 4 and Douglas sea state 3) is taken as the ship\'s capability and extrapolated to the whole passage, as if all of it were sailed in good weather (The Didymi [1988] 2 Lloyd\'s Rep 108 CA; The Gas Enterprise [1993] 2 Lloyd\'s Rep 352 CA; The Ocean Virgo [2015] EWHC 3405 (Comm)).',
    'Basic formula (Kasi, 4-5 Gray\'s Inn Square): time lost = passage time at the good-weather speed − passage time at the allowed speed; over-consumption = good-weather daily consumption × passage days at the good-weather speed − allowed daily consumption × passage days at the allowed speed, so the fuel burned in the time lost is included. Other formulas have been advocated (London Arbitration 12/14).',
    '"About" gives the owners 0.5 knot on speed and 5 % on consumption, both applied under a double "about" (The Al Bida [1987] 1 Lloyd\'s Rep 124 CA; London Arbitration 15/07); the margin is for the tribunal and is an input here, set to zero for "without about" or an average-speed warranty.',
    'Offset: gains to the charterers are set off against their losses in a damages claim (The Ioanna [1985] 2 Lloyd\'s Rep 164); fuel saved is measured from the lower end of the "about" range over the passage time at the allowed speed (The Gaz Energy (No 2) [2012] EWHC 1686 (Comm); London Arbitration 20/07 for the time base), and time gained, by the same principle, from the upper end of the speed range. A net gain gives no claim either way (The Al Bida).',
    'Current: the mean current component along the track in the good-weather periods (+ with the ship) is subtracted from the speed over the ground; whether currents are corrected when the charter party is silent is unsettled, the better view being that they are (London Arbitrations 21/04 and 15/05).',
    'Claim values are the time lost × daily hire and the over-consumption × bunker price; excluded periods (extreme weather, speed reduced on the charterers\' orders), off-hire, interest and the evidence (deck logs against weather routing reports) are matters for the charter party and the tribunal.',
  ],
  notes: [
    'Verification 2026-10-31: the basic example of Kasi (warranted 15 kn on 30 t/day, good-weather performance 14 kn on 31 t/day, 15 000 nmi) gives 71.43 h lost and 133.93 t over-consumed, as published; the London Arbitration 20/07 example (about 12.5 kn on about 30 t/day, 288 nmi at 10 kn burning 29 t) gives 4.8 h lost and a 1 t credit when the consumption is taken without margin.',
    'Design decision: the hire and bunker price are applied to the time and fuel heads only; damages beyond those heads and the choice of good-weather periods are left to the user.',
  ],
  sources: [
    'A. Kasi, Performance claims under NYPE 1946 and 1993 (time charter): establishing and extrapolating, 4-5 Gray\'s Inn Square — basic formula and worked example',
    'A. Kasi, The "about" margin in speed-consumption warranty, 4-5 Gray\'s Inn Square — 0.5 knot and 5 %, double about, offset and London Arbitration 20/07',
    'West P&I, Defence guide: speed and consumption claims — good-weather days, currents, The Ioanna and The Gaz Energy credits',
    'The Gaz Energy (No 2): Hyundai Merchant Marine Co Ltd v Trafigura Beheer BV [2012] EWHC 1686 (Comm) — over-consumption from the upper and under-consumption from the lower end of the "about" range',
    'T. Coghlin et al., Time Charters, 7th ed., Informa Law 2014 — speed and performance claims',
  ],
  inputs: [
    { id: 'warranted_speed_kn', label: 'Warranted speed', group: 'speed', unit: 'kn', default: 14, min: 1, max: 40 },
    { id: 'speed_allowance_kn', label: 'Speed allowance ("about")', group: 'speed', unit: 'kn', default: 0.5, min: 0, max: 3 },
    { id: 'warranted_consumption_t_day', label: 'Warranted consumption', group: 'mass_flow', unit: 't_day', default: 30, min: 0.1, max: 500 },
    { id: 'consumption_allowance_pct', label: 'Consumption allowance ("about")', group: 'ratio', unit: 'pct', default: 5, min: 0, max: 20 },
    { id: 'gw_distance_nmi', label: 'Distance sailed in good weather', group: 'length', unit: 'nmi', default: 1200, min: 1, max: 50000 },
    { id: 'gw_time_h', label: 'Steaming time in good weather', group: 'time', unit: 'h', default: 90, min: 1, max: 5000 },
    { id: 'gw_fuel_t', label: 'Fuel consumed in good weather', group: 'mass', unit: 't', default: 120, min: 0, max: 100000 },
    { id: 'gw_current_kn', label: 'Mean current in good weather (+ with the ship)', group: 'speed', unit: 'kn', default: 0, min: -5, max: 5 },
    { id: 'total_distance_nmi', label: 'Total distance of the passage', group: 'length', unit: 'nmi', default: 5000, min: 1, max: 50000 },
    { id: 'hire_per_day', label: 'Hire rate per day', group: 'money', unit: 'cur', default: 15000, min: 0, max: 1e7 },
    { id: 'bunker_price', label: 'Bunker price', group: 'price_per_mass', unit: 'cur_t', default: 600, min: 0, max: 5000 },
    {
      id: 'offset',
      label: 'Gains to the charterers',
      type: 'select',
      default: 'credit',
      options: [
        { value: 'credit', label: 'Credited against the losses (The Ioanna)' },
        { value: 'none', label: 'Not credited (each head stands alone)' },
      ],
    },
  ],
  outputs: [
    { id: 'gw_speed_kn', label: 'Good-weather speed', group: 'speed', unit: 'kn' },
    { id: 'gw_consumption_t_day', label: 'Good-weather consumption', group: 'mass_flow', unit: 't_day' },
    { id: 'allowed_speed_kn', label: 'Allowed speed (warranted − allowance)', group: 'speed', unit: 'kn' },
    { id: 'allowed_consumption_t_day', label: 'Allowed consumption (warranted + allowance)', group: 'mass_flow', unit: 't_day' },
    { id: 'time_lost_h', label: 'Time lost (− time gained, credited)', group: 'time', unit: 'h' },
    { id: 'over_consumption_t', label: 'Over-consumption (− fuel saved, credited)', group: 'mass', unit: 't' },
    { id: 'time_claim', label: 'Value of the time head', group: 'money', unit: 'cur' },
    { id: 'fuel_claim', label: 'Value of the fuel head', group: 'money', unit: 'cur' },
    { id: 'total_claim', label: 'Claim', group: 'money', unit: 'cur' },
    { id: 'passage_table', label: 'Passage extrapolated at each performance', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      gw_speed_kn: '13.33 kn',
      gw_consumption_t_day: '32.0 t/day',
      allowed_speed_kn: '13.5 kn',
      allowed_consumption_t_day: '31.5 t/day',
      time_lost_h: '4.63 h',
      over_consumption_t: '13.89 t',
    },
  },
};

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.warranted_speed_kn, 'warranted_speed_kn', 'Warranted speed');
  assertNonNegative(i.speed_allowance_kn, 'speed_allowance_kn', 'Speed allowance');
  if (i.speed_allowance_kn >= i.warranted_speed_kn) throw new Error('The speed allowance must be smaller than the warranted speed');
  assertPositive(i.warranted_consumption_t_day, 'warranted_consumption_t_day', 'Warranted consumption');
  assertRange(i.consumption_allowance_pct, 0, 50, 'consumption_allowance_pct', 'Consumption allowance');
  assertPositive(i.gw_distance_nmi, 'gw_distance_nmi', 'Good-weather distance');
  assertPositive(i.gw_time_h, 'gw_time_h', 'Good-weather time');
  assertNonNegative(i.gw_fuel_t, 'gw_fuel_t', 'Good-weather fuel');
  assertFinite(i.gw_current_kn, 'gw_current_kn', 'Current');
  assertPositive(i.total_distance_nmi, 'total_distance_nmi', 'Total distance');
  assertNonNegative(i.hire_per_day, 'hire_per_day', 'Hire rate');
  assertNonNegative(i.bunker_price, 'bunker_price', 'Bunker price');
  assertOneOf(i.offset, ['credit', 'none'], 'offset', 'Gains to the charterers');

  const gwSpeed = i.gw_distance_nmi / i.gw_time_h - i.gw_current_kn;
  if (gwSpeed <= 0) throw new Error('The current exceeds the speed over the ground: the good-weather speed through the water must be greater than zero');
  const gwRate = i.gw_fuel_t / (i.gw_time_h / 24);
  const share = i.consumption_allowance_pct / 100;
  const allowedSpeed = i.warranted_speed_kn - i.speed_allowance_kn;
  const bestSpeed = i.warranted_speed_kn + i.speed_allowance_kn;
  const allowedRate = i.warranted_consumption_t_day * (1 + share);
  const bestRate = i.warranted_consumption_t_day * (1 - share);
  const d = i.total_distance_nmi;
  const tGw = d / gwSpeed;
  const tAllowed = d / allowedSpeed;
  const tBest = d / bestSpeed;
  const fuelGw = (gwRate * tGw) / 24;
  const fuelAllowed = (allowedRate * tAllowed) / 24;
  const fuelBest = (bestRate * tAllowed) / 24;
  const credit = i.offset === 'credit';

  const timeLost = tGw > tAllowed ? tGw - tAllowed : credit && tGw < tBest ? tGw - tBest : 0;
  const over = fuelGw > fuelAllowed ? fuelGw - fuelAllowed : credit && fuelGw < fuelBest ? fuelGw - fuelBest : 0;
  const timeValue = (timeLost / 24) * i.hire_per_day;
  const fuelValue = over * i.bunker_price;
  const net = timeValue + fuelValue;
  const total = Math.max(0, net);

  const warnings = [];
  if (i.gw_time_h < 24) warnings.push('Less than 24 h of good weather: shorter periods may be used if they are a representative sample (The Ocean Virgo), but the extrapolation is less certain.');
  if (i.gw_distance_nmi > d) warnings.push('The good-weather distance exceeds the total distance of the passage: check the inputs.');
  if (net < 0) warnings.push('The credits exceed the losses: there is no claim, and the owners cannot recover the net gain (The Al Bida).');
  if (!credit && (tGw < tBest || fuelGw < fuelBest)) warnings.push('The ship did better than the warranty on one head; that gain is not credited with the option chosen.');
  warnings.push('Good weather, the speed basis (over the ground or through the water), current corrections and the allowances are defined by the charter party, which governs.');

  return {
    outputs: {
      gw_speed_kn: gwSpeed,
      gw_consumption_t_day: gwRate,
      allowed_speed_kn: allowedSpeed,
      allowed_consumption_t_day: allowedRate,
      time_lost_h: timeLost,
      over_consumption_t: over,
      time_claim: timeValue,
      fuel_claim: fuelValue,
      total_claim: total,
      passage_table: {
        columns: ['Performance', 'Speed (kn)', 'Consumption (t/day)', 'Passage time (h)', 'Passage fuel (t)'],
        rows: [
          ['Good weather, extrapolated', gwSpeed, gwRate, tGw, fuelGw],
          ['Allowed (losses measured from here)', allowedSpeed, allowedRate, tAllowed, fuelAllowed],
          ['Best warranted (gains measured from here)', bestSpeed, bestRate, tBest, fuelBest],
        ],
      },
      summary: `Good weather ${gwSpeed.toFixed(2)} kn on ${gwRate.toFixed(2)} t/day against ${allowedSpeed.toFixed(2)} kn on ${allowedRate.toFixed(2)} t/day allowed, over ${d} nmi: time ${timeLost >= 0 ? 'lost' : 'gained'} ${Math.abs(timeLost).toFixed(2)} h, fuel ${over >= 0 ? 'over-consumed' : 'saved'} ${Math.abs(over).toFixed(2)} t; claim ${total.toFixed(0)}.`,
    },
    warnings,
  };
}
