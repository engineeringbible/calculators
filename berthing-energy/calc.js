/**
 * berthing-energy/calc.js — PIANC (2002) berthing energy for fender design: normal energy E_N = ½ M_D v_B² C_M C_E C_C C_S,
 * abnormal energy E_A = E_N × factor of safety, with the Brolsma design velocities, three added-mass methods, the
 * eccentricity geometry of a side berthing and the fender energy/reaction/hull-pressure check.
 * Schema units: t, m, m/s, degrees, kJ (= kN·m), kN, kPa.
 */
import { withDefaults, assertPositive, assertNonNegative, assertRange, assertOneOf } from '../shared/validate.js';

/** Brolsma design berthing velocities (m/s), tug assisted, BS 6349-4:2014 Fig. 9 / PIANC 2002 as tabulated by ShibataFenderTeam; null = below 0.08 m/s (not recommended). */
export const BROLSMA_TABLE = [
  { md: 1000, a: 0.179, b: 0.343, c: 0.517, d: 0.669, e: 0.865 },
  { md: 3000, a: 0.136, b: 0.269, c: 0.404, d: 0.524, e: 0.649 },
  { md: 5000, a: 0.117, b: 0.236, c: 0.352, d: 0.459, e: 0.558 },
  { md: 10000, a: 0.094, b: 0.192, c: 0.287, d: 0.377, e: 0.448 },
  { md: 15000, a: 0.082, b: 0.169, c: 0.252, d: 0.332, e: 0.391 },
  { md: 20000, a: null, b: 0.153, c: 0.228, d: 0.303, e: 0.355 },
  { md: 30000, a: null, b: 0.133, c: 0.198, d: 0.264, e: 0.308 },
  { md: 40000, a: null, b: 0.119, c: 0.178, d: 0.239, e: 0.279 },
  { md: 50000, a: null, b: 0.110, c: 0.164, d: 0.221, e: 0.258 },
  { md: 75000, a: null, b: 0.094, c: 0.141, d: 0.190, e: 0.223 },
  { md: 100000, a: null, b: 0.083, c: 0.126, d: 0.171, e: 0.201 },
  { md: 150000, a: null, b: null, c: 0.107, d: 0.146, e: 0.174 },
  { md: 200000, a: null, b: null, c: 0.095, d: 0.131, e: 0.158 },
  { md: 250000, a: null, b: null, c: 0.086, d: 0.120, e: 0.146 },
  { md: 300000, a: null, b: null, c: 0.080, d: 0.111, e: 0.137 },
  { md: 400000, a: null, b: null, c: null, d: 0.099, e: 0.124 },
  { md: 500000, a: null, b: null, c: null, d: 0.090, e: 0.115 },
];
export const MIN_DESIGN_VELOCITY_M_S = 0.08;

export const BROLSMA_CONDITIONS = {
  a: 'a — easy berthing, sheltered',
  b: 'b — difficult berthing, sheltered',
  c: 'c — easy berthing, exposed',
  d: 'd — good berthing, exposed (PIANC: may be high)',
  e: 'e — difficult berthing, exposed (PIANC: may be high)',
};

/** PIANC 2002 Table 4.2.5 abnormal-berthing factors as interpreted by the fender manuals. */
export const SAFETY_FACTORS = {
  tanker_large: { label: 'Tankers, bulk, gas carriers — Suezmax/Capesize and above (1.25)', factor: 1.25 },
  tanker_small: { label: 'Tankers, bulk, gas carriers — Handymax and smaller (1.75)', factor: 1.75 },
  container_large: { label: 'Container ships — Post-Panamax and above (1.50)', factor: 1.5 },
  container_small: { label: 'Container ships — Panamax and smaller (2.00)', factor: 2.0 },
  general_cargo: { label: 'General cargo, freighters (1.75)', factor: 1.75 },
  roro: { label: 'RoRo and ferries (2.00)', factor: 2.0 },
  cruise: { label: 'Cruise ships, car carriers (2.00)', factor: 2.0 },
  fast_ferry: { label: 'Fast ferries (2.00)', factor: 2.0 },
  tug: { label: 'Tugs, workboats (2.00)', factor: 2.0 },
  custom: { label: 'Custom factor', factor: null },
};

export const CONTACT_PRESETS = {
  fifth: { label: 'Fifth-point berthing (x = L/5)', x: 0.2 },
  quarter: { label: 'Quarter-point berthing (x = L/4)', x: 0.25 },
  third: { label: 'Third-point berthing (x = L/3, dolphins)', x: 1 / 3 },
  midship: { label: 'Midships contact (x = L/2)', x: 0.5 },
  custom: { label: 'Custom distance from bow', x: null },
};

export const schema = {
  id: 'berthing-energy',
  name: 'Berthing energy and fender selection',
  category: 'maritime',
  summary: 'PIANC berthing energy from displacement, approach velocity and the mass, eccentricity, configuration and softness factors; fender energy and reaction.',
  related: ['hydrostatics', 'anchor-catenary', 'lifting-sling', 'wave-properties'],
  assumptions: [
    'PIANC WG33 (2002) kinetic method: E_N = ½ M_D v_B² C_M C_E C_C C_S with the displacement at berthing (not necessarily fully laden) and the velocity component perpendicular to the berthing line; PIANC WG211 (2024) has since dropped C_C and C_S and revised the velocities — this page implements the 2002 method, which BS 6349-4, EAU 2004 and most existing specifications still use.',
    'Added mass: PIANC 2002 combines added mass and under-keel clearance — C_M = 1.8 for K_C/D ≤ 0.1, 1.5 for K_C/D ≥ 0.5, 1.875 − 0.75 K_C/D between, and then C_C = 1.0; the Vasco Costa (1 + 2D/B) and Shigeru Ueda (1 + πD/(2 C_B B)) alternatives are offered with the separate berth-configuration factor.',
    'Eccentricity C_E = (K² + R² cos²γ)/(K² + R²) with the radius of gyration K = (0.19 C_B + 0.11) L_BP, R the distance from the centre of mass to the contact point (R² = (L/2 − x)² + (B/2)²) and γ = 90° − α − asin(B/(2R)); the formula assumes the velocity vector is perpendicular to the berth within the berthing angle α and that the hull contact is at the parallel body — the special case γ = 90° should be used with care.',
    'Berth configuration C_C (when not already inside the PIANC C_M): solid quay 0.8 (K_C/D ≤ 0.5) or 0.9 (K_C/D > 0.5) for α ≤ 5°, partly closed 0.9/1.0, open piles 1.0, and 1.0 whenever α > 5°; softness C_S = 0.9 for hard fenders (deflection ≤ 150 mm), 1.0 otherwise.',
    'Design velocities from the Brolsma curves (BS 6349-4:2014 Fig. 9) tabulated against displacement for conditions a–e, interpolated log-linearly; they assume conventional ships berthing with tug assistance and values below 0.08 m/s are not recommended (floored); without tugs EAU 2004 / ROM 2.0-11 give 1.3–3 times higher speeds. Measured velocities at the berth are always preferable.',
    'The abnormal energy E_A = E_N × factor uses PIANC 2002 Table 4.2.5 (tankers/bulk 1.25 large to 1.75 small, container 1.5–2.0, general cargo 1.75, RoRo/ferries/cruise/tugs 2.0); PIANC stresses that "the designers\' judgement should be paramount". The fender must absorb E_A at its rated performance, reduced by manufacturing tolerance, angle, temperature and velocity factors (not applied here).',
    'Hull pressure = fender reaction / panel contact area, compared with PIANC guidance (tankers and bulk carriers 150–300 kPa, container ships 200–400 kPa, general cargo 400–700 kPa, RoRo usually belted) — enter the allowable for the actual ship class.',
  ],
  notes: [
    'Verification 2026-10-30: the fender manual\'s 100 000 DWT tanker (M_D 125 000 t, L_BP 236 m, B 43 m, D 15.1 m, third-point contact at 5°) reproduces C_B 0.796, K 61.7 m, R 44.8 m, γ 56.3° and C_E 0.761; Brolsma table and coefficient values transcribed from the ShibataFenderTeam design manual (2021) which reproduces PIANC 2002 and BS 6349-4:2014.',
    'Design decision: the 2002 method (with C_C and C_S) rather than the 2024 WG211 method, because existing berth specifications and BS 6349-4 use it; the register records that WG211 supersedes it.',
    'Design decision: velocities are read from the tabulated Brolsma values with log-linear interpolation in displacement, floored at 0.08 m/s where the table shows no value.',
  ],
  sources: [
    'PIANC MarCom WG33, Guidelines for the Design of Fender Systems: 2002 (kinetic energy method, Table 4.2.5 safety factors, hull pressure guidance) — superseded by PIANC WG211 (2024)',
    'BS 6349-4:2014, Maritime works — Code of practice for design of fendering and mooring systems (Brolsma berthing velocities, Figure 9)',
    'ShibataFenderTeam, Fender Design Manual (2021 edition), pp. 18–22 and 33 — reproduction of the PIANC coefficients, velocity table and worked example',
    'F. Vasco Costa, "The Berthing Ship" (1964); S. Ueda (1981) added-mass method; EAU 2004 Recommendations of the Committee for Waterfront Structures',
  ],
  inputs: [
    { id: 'displacement_t', label: 'Displacement at berthing M_D', group: 'mass', unit: 't', default: 125000, min: 10, max: 1e6 },
    { id: 'lbp_m', label: 'Length between perpendiculars L_BP', group: 'length', unit: 'm', default: 236, min: 5, max: 500 },
    { id: 'beam_m', label: 'Beam B', group: 'length', unit: 'm', default: 43, min: 1, max: 80 },
    { id: 'draft_m', label: 'Draught at berthing D', group: 'length', unit: 'm', default: 15.1, min: 0.3, max: 30 },
    { id: 'water_density_t_m3', label: 'Water density', group: 'density', unit: 't_m3', default: 1.025, min: 0.99, max: 1.04 },
    { id: 'ukc_m', label: 'Under-keel clearance K_C at the berth', group: 'length', unit: 'm', default: 3, min: 0, max: 50 },
    { id: 'velocity_mode', label: 'Berthing velocity', type: 'select', default: 'brolsma', options: [{ value: 'brolsma', label: 'Brolsma design curve (BS 6349-4 / PIANC)' }, { value: 'given', label: 'Enter the velocity perpendicular to the berth' }] },
    { id: 'brolsma_condition', label: 'Navigation condition', type: 'select', default: 'c', options: Object.entries(BROLSMA_CONDITIONS).map(([value, label]) => ({ value, label })), visibleWhen: { velocity_mode: 'brolsma' } },
    { id: 'velocity_m_s', label: 'Berthing velocity v_B', group: 'speed', unit: 'm_s', default: 0.15, min: 0.01, max: 3, visibleWhen: { velocity_mode: 'given' } },
    { id: 'contact', label: 'Contact point', type: 'select', default: 'third', options: Object.entries(CONTACT_PRESETS).map(([value, c]) => ({ value, label: c.label })) },
    { id: 'contact_x_frac', label: 'Distance of contact point from bow, as a fraction of L_BP', group: 'dimensionless', unit: 'none', default: 0.333, min: 0.05, max: 0.5, visibleWhen: { contact: 'custom' } },
    { id: 'angle_deg', label: 'Berthing angle α', group: 'angle', unit: 'deg', default: 5, min: 0, max: 30 },
    { id: 'cm_method', label: 'Added mass coefficient C_M', type: 'select', default: 'pianc', options: [{ value: 'pianc', label: 'PIANC 2002 (1.5–1.8 by under-keel clearance; C_C = 1)' }, { value: 'vasco_costa', label: 'Vasco Costa 1 + 2D/B' }, { value: 'ueda', label: 'Shigeru Ueda 1 + πD/(2 C_B B)' }] },
    { id: 'structure', label: 'Berth structure (for C_C with Vasco Costa / Ueda)', type: 'select', default: 'open', options: [{ value: 'open', label: 'Open pile structure (C_C 1.0)' }, { value: 'partly_closed', label: 'Partly closed structure (0.9 / 1.0)' }, { value: 'solid', label: 'Solid quay wall (0.8 / 0.9)' }], visibleWhen: { cm_method: ['vasco_costa', 'ueda'] } },
    { id: 'softness', label: 'Fender softness', type: 'select', default: 'soft', options: [{ value: 'soft', label: 'Soft fender, deflection > 150 mm (C_S 1.0)' }, { value: 'hard', label: 'Hard fender, deflection ≤ 150 mm (C_S 0.9)' }] },
    { id: 'vessel_class', label: 'Vessel class for the abnormal berthing factor', type: 'select', default: 'tanker_large', options: Object.entries(SAFETY_FACTORS).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'custom_factor', label: 'Custom factor of safety', group: 'dimensionless', unit: 'none', default: 1.5, min: 1, max: 3, visibleWhen: { vessel_class: 'custom' } },
    { id: 'fender_energy_kj', label: 'Fender rated energy capacity E_RPD (0 = not checked)', group: 'energy', unit: 'kJ', default: 2500, min: 0, max: 1e5 },
    { id: 'fender_reaction_kn', label: 'Fender reaction at rated deflection R_F', group: 'force', unit: 'kN', default: 2200, min: 0, max: 1e5 },
    { id: 'panel_area_m2', label: 'Panel contact area with the hull', group: 'area', unit: 'm2', default: 12, min: 0, max: 200 },
    { id: 'allowable_pressure_kpa', label: 'Allowable hull pressure', group: 'pressure', unit: 'kPa', default: 200, min: 50, max: 1000, help: 'PIANC: tankers/bulk 150–300, container 200–400, general cargo 400–700 kPa.' },
  ],
  outputs: [
    { id: 'cb', label: 'Block coefficient C_B = M_D/(ρ L B D)', group: 'dimensionless', unit: 'none' },
    { id: 'velocity_used_m_s', label: 'Design berthing velocity v_B', group: 'speed', unit: 'm_s' },
    { id: 'cm', label: 'Added mass coefficient C_M', group: 'dimensionless', unit: 'none' },
    { id: 'k_m', label: 'Radius of gyration K = (0.19 C_B + 0.11) L', group: 'length', unit: 'm' },
    { id: 'r_m', label: 'Distance centre of mass → contact R', group: 'length', unit: 'm' },
    { id: 'gamma_deg', label: 'Angle γ between R and the velocity vector', group: 'angle', unit: 'deg' },
    { id: 'ce', label: 'Eccentricity coefficient C_E', group: 'dimensionless', unit: 'none' },
    { id: 'cc', label: 'Berth configuration coefficient C_C', group: 'dimensionless', unit: 'none' },
    { id: 'cs', label: 'Softness coefficient C_S', group: 'dimensionless', unit: 'none' },
    { id: 'kinetic_energy_kj', label: 'Ship kinetic energy ½ M_D v_B²', group: 'energy', unit: 'kJ' },
    { id: 'normal_energy_kj', label: 'Normal berthing energy E_N', group: 'energy', unit: 'kJ' },
    { id: 'safety_factor', label: 'Abnormal berthing factor', group: 'dimensionless', unit: 'none' },
    { id: 'abnormal_energy_kj', label: 'Abnormal berthing energy E_A', group: 'energy', unit: 'kJ' },
    { id: 'fender_check', label: 'Fender energy check', type: 'text' },
    { id: 'hull_pressure_kpa', label: 'Average hull pressure R_F / A', group: 'pressure', unit: 'kPa' },
    { id: 'pressure_check', label: 'Hull pressure check', type: 'text' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      cb: '0.796',
      velocity_used_m_s: '0.12 m/s',
      cm: '1.726',
      r_m: '44.8 m',
      safety_factor: '1.25',
      hull_pressure_kpa: '183 kPa',
    },
  },
};

/** Brolsma velocity (m/s) for a displacement and condition, log-linear interpolation, floored at 0.08 m/s. */
export function brolsmaVelocity(displacementT, condition) {
  const table = BROLSMA_TABLE;
  const value = (row) => row[condition] ?? MIN_DESIGN_VELOCITY_M_S;
  if (displacementT <= table[0].md) return value(table[0]);
  if (displacementT >= table[table.length - 1].md) return value(table[table.length - 1]);
  for (let k = 1; k < table.length; k += 1) {
    if (displacementT <= table[k].md) {
      const a = table[k - 1];
      const b = table[k];
      const t = (Math.log(displacementT) - Math.log(a.md)) / (Math.log(b.md) - Math.log(a.md));
      return Math.max(MIN_DESIGN_VELOCITY_M_S, value(a) + t * (value(b) - value(a)));
    }
  }
  return MIN_DESIGN_VELOCITY_M_S;
}

/** Eccentricity geometry for a side berthing contact at xFrac of L from the bow with berthing angle alphaDeg. */
export function eccentricity(cb, lbp, beam, xFrac, alphaDeg) {
  const K = (0.19 * cb + 0.11) * lbp;
  const dx = lbp / 2 - xFrac * lbp;
  const R = Math.sqrt(dx * dx + (beam / 2) ** 2);
  const gammaDeg = 90 - alphaDeg - (Math.asin(beam / (2 * R)) * 180) / Math.PI;
  const cosG = Math.cos((gammaDeg * Math.PI) / 180);
  return { K, R, gammaDeg, ce: (K * K + R * R * cosG * cosG) / (K * K + R * R) };
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertPositive(i.displacement_t, 'displacement_t', 'Displacement');
  assertPositive(i.lbp_m, 'lbp_m', 'Length');
  assertPositive(i.beam_m, 'beam_m', 'Beam');
  assertPositive(i.draft_m, 'draft_m', 'Draught');
  assertPositive(i.water_density_t_m3, 'water_density_t_m3', 'Water density');
  assertNonNegative(i.ukc_m, 'ukc_m', 'Under-keel clearance');
  assertOneOf(i.velocity_mode, ['brolsma', 'given'], 'velocity_mode', 'Velocity mode');
  assertOneOf(i.contact, Object.keys(CONTACT_PRESETS), 'contact', 'Contact point');
  assertRange(i.angle_deg, 0, 45, 'angle_deg', 'Berthing angle');
  assertOneOf(i.cm_method, ['pianc', 'vasco_costa', 'ueda'], 'cm_method', 'Added mass method');
  assertOneOf(i.structure, ['open', 'partly_closed', 'solid'], 'structure', 'Berth structure');
  assertOneOf(i.softness, ['soft', 'hard'], 'softness', 'Softness');
  assertOneOf(i.vessel_class, Object.keys(SAFETY_FACTORS), 'vessel_class', 'Vessel class');
  assertNonNegative(i.fender_energy_kj, 'fender_energy_kj', 'Fender energy');
  assertNonNegative(i.fender_reaction_kn, 'fender_reaction_kn', 'Fender reaction');
  assertNonNegative(i.panel_area_m2, 'panel_area_m2', 'Panel area');
  assertPositive(i.allowable_pressure_kpa, 'allowable_pressure_kpa', 'Allowable pressure');

  const cb = i.displacement_t / (i.water_density_t_m3 * i.lbp_m * i.beam_m * i.draft_m);
  if (cb > 1 || cb < 0.3) throw new Error(`Block coefficient ${cb.toFixed(3)} is not plausible: check displacement, L_BP, B and D`);
  let velocity;
  if (i.velocity_mode === 'brolsma') {
    assertOneOf(i.brolsma_condition, Object.keys(BROLSMA_CONDITIONS), 'brolsma_condition', 'Condition');
    velocity = brolsmaVelocity(i.displacement_t, i.brolsma_condition);
  } else velocity = assertPositive(i.velocity_m_s, 'velocity_m_s', 'Berthing velocity');

  const kcd = i.ukc_m / i.draft_m;
  let cm;
  if (i.cm_method === 'pianc') cm = kcd <= 0.1 ? 1.8 : kcd >= 0.5 ? 1.5 : 1.875 - 0.75 * kcd;
  else if (i.cm_method === 'vasco_costa') cm = 1 + (2 * i.draft_m) / i.beam_m;
  else cm = 1 + (Math.PI * i.draft_m) / (2 * cb * i.beam_m);

  const xFrac = i.contact === 'custom' ? assertRange(i.contact_x_frac, 0.02, 0.5, 'contact_x_frac', 'Contact position') : CONTACT_PRESETS[i.contact].x;
  const ecc = eccentricity(cb, i.lbp_m, i.beam_m, xFrac, i.angle_deg);

  let cc = 1;
  if (i.cm_method !== 'pianc' && i.angle_deg <= 5) {
    if (i.structure === 'solid') cc = kcd <= 0.5 ? 0.8 : 0.9;
    else if (i.structure === 'partly_closed') cc = kcd <= 0.5 ? 0.9 : 1.0;
  }
  const cs = i.softness === 'hard' ? 0.9 : 1.0;
  const kinetic = 0.5 * i.displacement_t * velocity * velocity;
  const normal = kinetic * cm * ecc.ce * cc * cs;
  const factor = i.vessel_class === 'custom' ? assertRange(i.custom_factor, 1, 5, 'custom_factor', 'Custom factor') : SAFETY_FACTORS[i.vessel_class].factor;
  const abnormal = normal * factor;

  let fenderCheck = 'Not checked (enter the fender rated energy)';
  if (i.fender_energy_kj > 0) {
    const ratio = i.fender_energy_kj / abnormal;
    fenderCheck = ratio >= 1 ? `OK — E_RPD ${i.fender_energy_kj.toFixed(0)} kJ ≥ E_A ${abnormal.toFixed(0)} kJ (margin ${((ratio - 1) * 100).toFixed(0)} %, before tolerance/angle/temperature/velocity factors)` : `INSUFFICIENT — E_RPD ${i.fender_energy_kj.toFixed(0)} kJ < E_A ${abnormal.toFixed(0)} kJ: choose a larger fender or add units`;
  }
  const pressure = i.panel_area_m2 > 0 && i.fender_reaction_kn > 0 ? i.fender_reaction_kn / i.panel_area_m2 : null;
  let pressureCheck = 'Not checked (enter the reaction and panel area)';
  if (pressure !== null) pressureCheck = pressure <= i.allowable_pressure_kpa ? `OK — ${pressure.toFixed(0)} kPa ≤ ${i.allowable_pressure_kpa} kPa allowable` : `EXCEEDED — ${pressure.toFixed(0)} kPa > ${i.allowable_pressure_kpa} kPa: larger panel or lower-reaction fender`;

  const warnings = [];
  if (i.velocity_mode === 'brolsma') warnings.push(`Brolsma design velocity ${velocity.toFixed(3)} m/s for condition ${i.brolsma_condition} assumes tug assistance; without tugs speeds can be 1.3–3 times higher.`);
  if (i.velocity_mode === 'brolsma' && (i.brolsma_condition === 'd' || i.brolsma_condition === 'e')) warnings.push('PIANC notes that curves d and e may be high and should be used with caution.');
  if (velocity <= MIN_DESIGN_VELOCITY_M_S + 1e-9) warnings.push('Velocity floored at 0.08 m/s: design speeds below this are not recommended.');
  if (ecc.gammaDeg < 10) warnings.push('γ is small (contact nearly in line with the velocity vector): the eccentricity formula is sensitive here; PIANC says the special case γ = 90° should be used with care and small γ gives C_E ≈ 1.');
  if (i.angle_deg > 10) warnings.push('Berthing angle above 10°: the first contact is near the bow or stern and the ship is likely to hit a single fender — check the fender spacing and the hull belting.');
  if (i.cm_method === 'pianc') warnings.push('PIANC 2002 added mass includes the under-keel clearance effect, so C_C = 1.0 regardless of the structure.');
  warnings.push('PIANC WG33 (2002) method; the 2024 WG211 guidelines supersede it with revised velocities and without C_C and C_S — use them for new specifications that cite WG211.');
  warnings.push('Fender rated energy must be reduced by manufacturing tolerance, compression angle, temperature and velocity factors before comparing with E_A (not applied here).');

  return {
    outputs: {
      cb,
      velocity_used_m_s: velocity,
      cm,
      k_m: ecc.K,
      r_m: ecc.R,
      gamma_deg: ecc.gammaDeg,
      ce: ecc.ce,
      cc,
      cs,
      kinetic_energy_kj: kinetic,
      normal_energy_kj: normal,
      safety_factor: factor,
      abnormal_energy_kj: abnormal,
      fender_check: fenderCheck,
      hull_pressure_kpa: pressure,
      pressure_check: pressureCheck,
    },
    warnings,
  };
}
