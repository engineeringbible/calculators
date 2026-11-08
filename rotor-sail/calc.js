/**
 * rotor-sail/calc.js — thrust, side force, spin power and net power of Flettner rotor sails from the true wind and the
 * ship speed, with the Tillig & Ringsberg (2020) lift, drag and power coefficients evaluated in height strips over a
 * power-law wind profile, at the spin that maximises the net power or at a fixed rpm, and averaged over a wind table.
 *
 * TWS(z) = TWS10 (z / 10)^α;  apparent wind from TWS(z), TWA and the ship speed;  SR = ω R / AWS
 * L, D = c_L, c_D ½ ρ A AWS²;  T = L sin AWA − D cos AWA;  S = L cos AWA + D sin AWA;  P_rotor = c_P ½ ρ A AWS³
 * P_net = T V_s − P_rotor   (eq. 10)
 * Schema units: metres, knots, degrees, revolutions per minute, kg/m³, kilonewtons, kilowatts.
 */
import { withDefaults, assertPositive, assertRange, assertOneOf, assertInteger } from '../shared/validate.js';

const KN_TO_MS = 1852 / 3600;
const RPM_TO_RAD_S = (2 * Math.PI) / 60;
const STRIPS = 10;
const SR_LIMIT = 4;
const SEARCH_STEPS = 400;
const MIN_AWS_MS = 0.01;
const DEFAULT_WINDS = [
  '# true wind speed at 10 m (kn); true wind angle off the bow (°); share of time (%)',
  '10; 45; 10',
  '10; 90; 15',
  '10; 135; 10',
  '20; 45; 15',
  '20; 90; 20',
  '20; 135; 15',
  '30; 90; 10',
  '5; 0; 5',
].join('\n');

/** Tillig & Ringsberg (2020) eqs (7)–(9): rotor with aspect ratio 6 and an end disc of twice the rotor diameter. */
export const liftCoefficient = (sr) => -0.0046 * sr ** 5 + 0.1145 * sr ** 4 - 0.9817 * sr ** 3 + 3.1309 * sr ** 2 - 0.1039 * sr;
export const dragCoefficient = (sr) => -0.0017 * sr ** 5 + 0.0464 * sr ** 4 - 0.4424 * sr ** 3 + 1.7243 * sr ** 2 - 1.641 * sr + 0.6375;
export const powerCoefficient = (sr) => 0.0001 * sr ** 5 - 0.0004 * sr ** 4 + 0.0143 * sr ** 3 - 0.0168 * sr ** 2 + 0.0234 * sr;

export const schema = {
  id: 'rotor-sail',
  name: 'Rotor sail (Flettner rotor) thrust and saving',
  category: 'maritime',
  summary: 'Thrust, side force, spin power and net power saving of Flettner rotors from the true wind and ship speed, at the best spin, and averaged over a wind table.',
  related: ['true-wind', 'wind-resistance', 'beaufort-sea-state', 'speed-power-fit'],
  assumptions: [
    'Lift, drag and spin power coefficients of Tillig & Ringsberg (2020), eqs (7)–(9): fifth-order polynomials in the spin ratio SR = ωR/AWS, fitted to full-scale measurements on a 4 m × 24 m rotor, for a rotor of aspect ratio 6 with an end disc of twice its diameter; forces on the projected area A = D H with c_i = F_i / (½ ρ A AWS²) and c_P = P / (½ ρ A AWS³). The coefficients agree best between sources for SR 1.5–2.5, the usual operating range; they are held at their SR = 4 values beyond 4.',
    'Thrust and side force from lift (normal to the apparent wind) and drag (along it), eqs (2) and (3), with the apparent wind angle measured from the bow: T = L sin AWA − D cos AWA, S = L cos AWA + D sin AWA; the rotor turns in the direction that gives forward lift, so wind from either side gives the same result.',
    'Wind profile TWS(z) = TWS10 (z/10)^α above the sea surface, exponent 1/9 by default as in ISO 15016:2025 (C.9) (Tillig & Ringsberg used 0.27); the rotor is divided into 10 height strips, each with its own apparent wind and spin ratio at the common rpm (eq. 10).',
    'Net power P_net = T V_s − P_rotor (eq. 10) at the ship speed through water; the main engine power saved is taken as T V_s / η_D. The best spin maximises P_net up to the rpm limit and SR = 4 on every strip; a stopped rotor still has drag.',
    'Not included: the leeway and rudder drag caused by the side force, heel, interaction between rotors and with the superstructure or deck, gusts, the efficiency of the generators that power the rotor, and any reefing for stability or manoeuvring; the saving is therefore an upper estimate.',
  ],
  notes: [
    'Verification 2026-10-31: the polynomials give c_L(3) = 9.52, the full-scale value of about 9.5 at SR = 3 reported by Tillig & Ringsberg (2020, Section 3.4), c_D(1) = 0.323 and c_P(3) = 0.297.',
    'Design decision: SR is defined with the local apparent wind speed, as the paper states in its text (its eq. (6) writes it as u), and the thrust power uses the ship speed through water.',
  ],
  sources: [
    'F. Tillig, J. W. Ringsberg, Design, operation and analysis of wind-assisted cargo ships, Ocean Engineering 211 (2020) 107603 — eqs (2)–(10), Section 3.4 (CC BY 4.0)',
    'ISO 15016:2025, Annex C, formula (C.9) — wind velocity profile with the 1/9 power law',
    'D. Li, M. Leer-Andersen, B. Allenström, Performance and vortex formation of Flettner rotors at high Reynolds numbers, 29th Symposium on Naval Hydrodynamics, Gothenburg 2012 — the basis of the Tillig & Ringsberg coefficients',
  ],
  inputs: [
    { id: 'rotor_diameter_m', label: 'Rotor diameter', group: 'length', unit: 'm', default: 5, min: 0.5, max: 10 },
    { id: 'rotor_height_m', label: 'Rotor height', group: 'length', unit: 'm', default: 30, min: 2, max: 60 },
    { id: 'base_height_m', label: 'Height of the rotor base above the waterline', group: 'length', unit: 'm', default: 20, min: 0, max: 80 },
    { id: 'number_of_rotors', label: 'Number of rotors', group: 'dimensionless', unit: 'none', default: 1, min: 1, max: 12, integer: true },
    { id: 'ship_speed_kn', label: 'Ship speed through the water', group: 'speed', unit: 'kn', default: 12, min: 0, max: 30 },
    { id: 'tws_kn', label: 'True wind speed at 10 m', group: 'speed', unit: 'kn', default: 20, min: 0, max: 80 },
    { id: 'twa_deg', label: 'True wind angle off the bow (0 = head wind)', group: 'angle', unit: 'deg', default: 90, min: 0, max: 180 },
    { id: 'profile_exponent', label: 'Wind profile exponent α', group: 'dimensionless', unit: 'none', default: 0.111, min: 0, max: 0.5 },
    { id: 'air_density_kg_m3', label: 'Air density', group: 'density', unit: 'kg_m3', default: 1.225, min: 1, max: 1.5 },
    {
      id: 'spin_mode',
      label: 'Rotor speed',
      type: 'select',
      default: 'optimal',
      options: [
        { value: 'optimal', label: 'Best net power (up to the maximum rpm)' },
        { value: 'fixed', label: 'Fixed rpm' },
      ],
    },
    { id: 'rotor_rpm', label: 'Fixed rotor speed', group: 'rotational_speed', unit: 'rpm', default: 150, min: 0, max: 1000, visibleWhen: { spin_mode: 'fixed' } },
    { id: 'max_rpm', label: 'Maximum rotor speed', group: 'rotational_speed', unit: 'rpm', default: 200, min: 1, max: 1000, visibleWhen: { spin_mode: 'optimal' } },
    { id: 'eta_d', label: 'Propulsive efficiency η_D', group: 'dimensionless', unit: 'none', default: 0.7, min: 0.3, max: 0.9 },
    { id: 'wind_table', label: 'Wind table (one per line: true wind speed kn; angle off the bow °; share of time %)', type: 'textarea', rows: 9, default: DEFAULT_WINDS },
  ],
  outputs: [
    { id: 'aws_kn', label: 'Apparent wind speed at mid-height', group: 'speed', unit: 'kn' },
    { id: 'awa_deg', label: 'Apparent wind angle at mid-height', group: 'angle', unit: 'deg' },
    { id: 'rpm', label: 'Rotor speed', group: 'rotational_speed', unit: 'rpm' },
    { id: 'spin_ratio', label: 'Spin ratio at mid-height', group: 'dimensionless', unit: 'none' },
    { id: 'thrust_kn', label: 'Thrust (all rotors)', group: 'force', unit: 'kN' },
    { id: 'side_force_kn', label: 'Side force (all rotors)', group: 'force', unit: 'kN' },
    { id: 'thrust_power_kw', label: 'Thrust power T V_s', group: 'power', unit: 'kW' },
    { id: 'rotor_power_kw', label: 'Spin power', group: 'power', unit: 'kW' },
    { id: 'net_power_kw', label: 'Net power (thrust power − spin power)', group: 'power', unit: 'kW' },
    { id: 'engine_power_saved_kw', label: 'Main engine power saved (T V_s / η_D)', group: 'power', unit: 'kW' },
    { id: 'mean_net_power_kw', label: 'Wind table: mean net power', group: 'power', unit: 'kW' },
    { id: 'mean_engine_power_saved_kw', label: 'Wind table: mean main engine power saved', group: 'power', unit: 'kW' },
    { id: 'mean_rotor_power_kw', label: 'Wind table: mean spin power', group: 'power', unit: 'kW' },
    { id: 'wind_results', label: 'Wind table results', type: 'table' },
    { id: 'summary', label: 'Summary', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      aws_kn: '25.9 kn',
      rpm: '189 rpm',
      spin_ratio: '3.70',
      thrust_kn: '134.3 kN',
      side_force_kn: '130.7 kN',
      thrust_power_kw: '829 kW',
      rotor_power_kw: '126 kW',
      net_power_kw: '703 kW',
    },
  },
};

/** Apparent wind speed (m/s) and angle off the bow (rad) from the true wind (m/s, rad off the bow) and the ship speed (m/s). */
export function apparentWind(tws, twa, vs) {
  const x = vs + tws * Math.cos(twa);
  const y = tws * Math.sin(twa);
  return { aws: Math.hypot(x, y), awa: Math.atan2(y, x) };
}

/** Lines of "speed; angle; share" → [{ tws, twa, share }]; comment lines start with #. */
export function parseWindTable(text) {
  const rows = [];
  String(text).split(/\r?\n/).forEach((line, index) => {
    const clean = line.trim();
    if (!clean || clean.startsWith('#')) return;
    const fields = clean.split(/[;\t]+/).map((f) => Number(f.trim().replace(',', '.')));
    if (fields.length < 3 || fields.slice(0, 3).some((v) => !Number.isFinite(v))) throw new Error(`Wind table line ${index + 1}: expected "speed; angle; share" as three numbers`);
    const [tws, twa, share] = fields;
    if (tws < 0) throw new Error(`Wind table line ${index + 1}: the wind speed must not be negative`);
    if (twa < 0 || twa > 180) throw new Error(`Wind table line ${index + 1}: the angle must be between 0 and 180°`);
    if (share < 0) throw new Error(`Wind table line ${index + 1}: the share must not be negative`);
    rows.push({ tws, twa, share });
  });
  return rows;
}

/** Forces (N) and spin power (W) of one rotor at angular speed ω (rad/s) over the height strips. */
function rotorLoads(strips, omega, radius, rho, stripArea) {
  let thrust = 0;
  let side = 0;
  let power = 0;
  let srMax = 0;
  strips.forEach(({ aws, awa }) => {
    if (aws < MIN_AWS_MS) return;
    const sr = (omega * radius) / aws;
    srMax = Math.max(srMax, sr);
    const s = Math.min(sr, SR_LIMIT);
    const q = 0.5 * rho * stripArea * aws ** 2;
    const lift = liftCoefficient(s) * q;
    const drag = dragCoefficient(s) * q;
    thrust += lift * Math.sin(awa) - drag * Math.cos(awa);
    side += lift * Math.cos(awa) + drag * Math.sin(awa);
    power += powerCoefficient(s) * q * aws;
  });
  return { thrust, side, power, srMax };
}

/** One wind condition: strips, the chosen ω and the loads of one rotor. */
function evaluate(i, twsKn, twaDeg) {
  const vs = i.ship_speed_kn * KN_TO_MS;
  const radius = i.rotor_diameter_m / 2;
  const stripArea = (i.rotor_diameter_m * i.rotor_height_m) / STRIPS;
  const strips = Array.from({ length: STRIPS }, (_, k) => {
    const z = i.base_height_m + ((k + 0.5) * i.rotor_height_m) / STRIPS;
    return apparentWind(twsKn * KN_TO_MS * (z / 10) ** i.profile_exponent, (twaDeg * Math.PI) / 180, vs);
  });
  const loads = (omega) => {
    const r = rotorLoads(strips, omega, radius, i.air_density_kg_m3, stripArea);
    return { ...r, omega, net: r.thrust * vs - r.power };
  };
  const mid = apparentWind(twsKn * KN_TO_MS * ((i.base_height_m + i.rotor_height_m / 2) / 10) ** i.profile_exponent, (twaDeg * Math.PI) / 180, vs);
  if (i.spin_mode === 'fixed') return { mid, vs, radius, ...loads(i.rotor_rpm * RPM_TO_RAD_S) };
  const minAws = Math.min(...strips.map((s) => s.aws));
  const limit = Math.min(i.max_rpm * RPM_TO_RAD_S, minAws < MIN_AWS_MS ? 0 : (SR_LIMIT * minAws) / radius);
  let best = loads(0);
  for (let k = 1; k <= SEARCH_STEPS; k += 1) {
    const trial = loads((limit * k) / SEARCH_STEPS);
    if (trial.net > best.net) best = trial;
  }
  let lo = Math.max(0, best.omega - limit / SEARCH_STEPS);
  let hi = Math.min(limit, best.omega + limit / SEARCH_STEPS);
  for (let k = 0; k < 60 && hi - lo > 1e-9; k += 1) {
    const m1 = lo + (hi - lo) * 0.382;
    const m2 = lo + (hi - lo) * 0.618;
    if (loads(m1).net < loads(m2).net) lo = m1;
    else hi = m2;
  }
  const refined = loads((lo + hi) / 2);
  return { mid, vs, radius, ...(refined.net > best.net ? refined : best) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.rotor_diameter_m, 'rotor_diameter_m', 'Rotor diameter');
  assertPositive(i.rotor_height_m, 'rotor_height_m', 'Rotor height');
  assertRange(i.base_height_m, 0, 200, 'base_height_m', 'Base height');
  assertInteger(i.number_of_rotors, 'number_of_rotors', 'Number of rotors');
  assertRange(i.number_of_rotors, 1, 50, 'number_of_rotors', 'Number of rotors');
  assertRange(i.ship_speed_kn, 0, 60, 'ship_speed_kn', 'Ship speed');
  assertRange(i.tws_kn, 0, 150, 'tws_kn', 'True wind speed');
  assertRange(i.twa_deg, 0, 180, 'twa_deg', 'True wind angle');
  assertRange(i.profile_exponent, 0, 1, 'profile_exponent', 'Wind profile exponent');
  assertPositive(i.air_density_kg_m3, 'air_density_kg_m3', 'Air density');
  assertOneOf(i.spin_mode, ['optimal', 'fixed'], 'spin_mode', 'Rotor speed');
  assertRange(i.rotor_rpm, 0, 5000, 'rotor_rpm', 'Fixed rotor speed');
  assertPositive(i.max_rpm, 'max_rpm', 'Maximum rotor speed');
  assertRange(i.eta_d, 0.1, 1, 'eta_d', 'Propulsive efficiency');
  if (i.base_height_m + i.rotor_height_m / 2 <= 0) throw new Error('The rotor must stand above the waterline');
  const table = parseWindTable(i.wind_table);

  const n = i.number_of_rotors;
  const main = evaluate(i, i.tws_kn, i.twa_deg);
  const shareTotal = table.reduce((sum, r) => sum + r.share, 0);
  const results = table.map((r) => ({ ...r, e: evaluate(i, r.tws, r.twa) }));
  const weighted = (f) => (shareTotal > 0 ? results.reduce((sum, r) => sum + r.share * f(r.e), 0) / shareTotal : 0);
  const thrustPower = (e) => (n * e.thrust * e.vs) / 1000;

  const warnings = [];
  const aspect = i.rotor_height_m / i.rotor_diameter_m;
  if (Math.abs(aspect - 6) > 1) warnings.push(`The coefficients are for an aspect ratio of 6 with an end disc of twice the diameter; this rotor has ${aspect.toFixed(1)}.`);
  if (main.srMax > SR_LIMIT + 1e-9) warnings.push('The spin ratio exceeds 4 on part of the rotor at the conditions entered: the coefficients are held at their SR = 4 values there.');
  const overLimit = results.filter((r) => r.e.srMax > SR_LIMIT + 1e-9).length;
  if (overLimit) warnings.push(`The spin ratio exceeds 4 on part of the rotor in ${overLimit} wind table row${overLimit > 1 ? 's' : ''}: the coefficients are held at their SR = 4 values there.`);
  if (main.net < 0) warnings.push('In this wind the rotor costs power even at its best spin; a stopped rotor still adds drag.');
  if (main.side > 2 * Math.abs(main.thrust) && main.thrust > 0) warnings.push(`The side force is ${(main.side / main.thrust).toFixed(1)} times the thrust: leeway and rudder drag, not included, take part of the saving.`);
  if (n > 1) warnings.push('Several rotors are added without interaction between them or with the superstructure, which changes their thrust and side force.');
  if (table.length && Math.abs(shareTotal - 100) > 0.5) warnings.push(`The wind table shares add up to ${shareTotal.toFixed(1)} %; they are normalised.`);

  const rpmOf = (e) => e.omega / RPM_TO_RAD_S;
  return {
    outputs: {
      aws_kn: main.mid.aws / KN_TO_MS,
      awa_deg: (main.mid.awa * 180) / Math.PI,
      rpm: rpmOf(main),
      spin_ratio: main.mid.aws < MIN_AWS_MS ? 0 : (main.omega * main.radius) / main.mid.aws,
      thrust_kn: (n * main.thrust) / 1000,
      side_force_kn: (n * main.side) / 1000,
      thrust_power_kw: thrustPower(main),
      rotor_power_kw: (n * main.power) / 1000,
      net_power_kw: (n * main.net) / 1000,
      engine_power_saved_kw: thrustPower(main) / i.eta_d,
      mean_net_power_kw: weighted((e) => (n * e.net) / 1000),
      mean_engine_power_saved_kw: weighted(thrustPower) / i.eta_d,
      mean_rotor_power_kw: weighted((e) => (n * e.power) / 1000),
      wind_results: {
        columns: ['Wind (kn)', 'Angle (°)', 'Share (%)', 'Rotor (rpm)', 'Thrust (kN)', 'Thrust power (kW)', 'Spin power (kW)', 'Net power (kW)'],
        rows: results.map((r) => [r.tws, r.twa, r.share, rpmOf(r.e), (n * r.e.thrust) / 1000, thrustPower(r.e), (n * r.e.power) / 1000, (n * r.e.net) / 1000]),
      },
      summary: `${n} rotor${n > 1 ? 's' : ''} ${i.rotor_diameter_m} m × ${i.rotor_height_m} m at ${i.ship_speed_kn} kn in ${i.tws_kn} kn true wind from ${i.twa_deg}° off the bow: ${rpmOf(main).toFixed(0)} rpm, thrust ${((n * main.thrust) / 1000).toFixed(1)} kN, net power ${((n * main.net) / 1000).toFixed(0)} kW (main engine saving about ${(thrustPower(main) / i.eta_d).toFixed(0)} kW, spin ${((n * main.power) / 1000).toFixed(0)} kW).`,
    },
    warnings,
  };
}
