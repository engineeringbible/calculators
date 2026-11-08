/**
 * tank-volume/calc.js — total and partial volumes of horizontal and vertical cylinders, spheres and rectangular
 * tanks at a liquid level, the level for a target volume, mass from density, and the free-surface moment of inertia.
 *
 * Horizontal cylinder segment: A = R² acos((R − h)/R) − (R − h) √(2Rh − h²); hemispherical heads add π h² (3R − h)/3.
 * Schema units: SI — m, m³, t/m³, t, m⁴.
 */
import { withDefaults, assertPositive, assertNonNegative, assertOneOf } from '../shared/validate.js';

export const SHAPES = {
  horizontal_cylinder: { label: 'Horizontal cylinder (axis horizontal)' },
  vertical_cylinder: { label: 'Vertical cylinder (axis vertical)' },
  sphere: { label: 'Sphere' },
  rectangular: { label: 'Rectangular tank' },
};

export const schema = {
  id: 'tank-volume',
  name: 'Tank volume and partial fill',
  category: 'mechanical',
  summary: 'Total and partial volume of cylinders, spheres and rectangular tanks at a liquid level, level for a target volume, mass from density and free-surface moment.',
  related: ['bunker-quantity', 'initial-stability', 'thermal-expansion', 'draft-survey'],
  assumptions: [
    'Ideal geometric shells with no internal structure: stiffeners, frames, pipes, suction wells, heating coils and manholes are not deducted, so a ship tank-table volume is typically 1–3 % smaller than the geometric value.',
    'Horizontal cylinders have flat ends or two hemispherical heads; torispherical, ellipsoidal and dished ends (the common pressure-vessel heads) lie between the two and need the manufacturer\'s head volume.',
    'The tank is level (no trim or heel); the liquid level is measured vertically from the lowest point of the shell. A trimmed or heeled tank needs the ship\'s tank tables with trim and heel corrections.',
    'Mass = volume × the density entered at the liquid temperature; for bunkers convert with the Table 54B method in the bunker-quantity calculator.',
    'The free-surface moment of inertia is taken about the longitudinal (fore-and-aft) centreline of the free surface: i = L c³/12 for a rectangular surface of length L and athwartships breadth c, π r⁴/4 for a circular surface; multiply by the liquid density to obtain the free-surface moment in t·m for the stability calculation. The horizontal cylinder is assumed to lie fore-and-aft.',
    'The level for a target volume is found by bisection to 0.01 mm; it is reported as the geometric level, not a sounding or ullage corrected for the tape position.',
  ],
  notes: [
    'Verification 2026-10-30: the horizontal-cylinder segment at a quarter of the diameter holds 19.55 % of the full volume, matching the standard partial-volume tables; the spherical cap formula gives exactly half the sphere at the centre, and the inverse level search reproduces the input level to 10⁻⁶ m.',
    'Design decision: the free-surface inertia is output alongside the volume because the two are needed together in stability work, and the horizontal cylinder\'s chord width is reported for the same reason.',
    'Design decision: hemispherical heads are the only curved-head option; other head shapes vary by manufacturer and are left to the tank tables.',
  ],
  sources: [
    'CRC Standard Mathematical Tables and Formulae, 33rd ed., mensuration of the circular segment and spherical cap',
    'API MPMS Chapter 2 (tank calibration) for the context of real tank tables versus geometric volumes',
    'Derrett & Barrass, Ship Stability for Masters and Mates, 7th ed., ch. 21 (free surface moment i = l b³/12)',
  ],
  inputs: [
    { id: 'shape', label: 'Tank shape', type: 'select', default: 'horizontal_cylinder', options: Object.entries(SHAPES).map(([value, s]) => ({ value, label: s.label })) },
    { id: 'diameter_m', label: 'Inside diameter', group: 'length', unit: 'm', default: 2.0, min: 0.01, max: 100, visibleWhen: { shape: ['horizontal_cylinder', 'vertical_cylinder', 'sphere'] } },
    { id: 'length_m', label: 'Length of the cylindrical part (fore-and-aft)', group: 'length', unit: 'm', default: 10, min: 0.01, max: 500, visibleWhen: { shape: ['horizontal_cylinder', 'rectangular'] } },
    { id: 'heads', label: 'Ends', type: 'select', default: 'flat', options: [{ value: 'flat', label: 'Flat ends' }, { value: 'hemispherical', label: 'Two hemispherical heads' }], visibleWhen: { shape: 'horizontal_cylinder' } },
    { id: 'width_m', label: 'Breadth (athwartships)', group: 'length', unit: 'm', default: 5, min: 0.01, max: 500, visibleWhen: { shape: 'rectangular' } },
    { id: 'height_m', label: 'Height', group: 'length', unit: 'm', default: 4, min: 0.01, max: 500, visibleWhen: { shape: ['rectangular', 'vertical_cylinder'] } },
    {
      id: 'mode',
      label: 'Find',
      type: 'select',
      default: 'volume',
      options: [
        { value: 'volume', label: 'Volume at a given liquid level' },
        { value: 'level', label: 'Level for a target volume' },
      ],
    },
    { id: 'level_m', label: 'Liquid level (from the bottom)', group: 'length', unit: 'm', default: 0.5, min: 0, max: 500, visibleWhen: { mode: 'volume' } },
    { id: 'target_volume_m3', label: 'Target liquid volume', group: 'volume', unit: 'm3', default: 6, min: 0, max: 1e6, visibleWhen: { mode: 'level' } },
    { id: 'density_t_m3', label: 'Liquid density', group: 'density', unit: 't_m3', default: 0.99, min: 0.01, max: 20, help: 'HFO 0.97–0.99, MGO 0.84, fresh water 1.000, sea water 1.025, lube oil 0.90 t/m³ at the tank temperature.' },
  ],
  outputs: [
    { id: 'total_volume_m3', label: 'Total (geometric) volume', group: 'volume', unit: 'm3' },
    { id: 'tank_height_m', label: 'Internal height (full level)', group: 'length', unit: 'm' },
    { id: 'level_out_m', label: 'Liquid level', group: 'length', unit: 'm' },
    { id: 'ullage_m', label: 'Ullage (free height above the liquid)', group: 'length', unit: 'm' },
    { id: 'liquid_volume_m3', label: 'Liquid volume', group: 'volume', unit: 'm3' },
    { id: 'fill_pct', label: 'Fill', group: 'ratio', unit: 'pct' },
    { id: 'mass_t', label: 'Liquid mass', group: 'mass', unit: 't' },
    { id: 'surface_width_m', label: 'Breadth of the free surface (athwartships)', group: 'length', unit: 'm' },
    { id: 'surface_area_m2', label: 'Free surface area', group: 'area', unit: 'm2' },
    { id: 'surface_inertia_m4', label: 'Free-surface moment of inertia i about the longitudinal axis', group: 'second_moment_of_area', unit: 'm4' },
    { id: 'free_surface_moment_t_m', label: 'Free surface moment i × ρ', group: 'mass_moment', unit: 't_m' },
  ],
  // the worked example of content.md: "Load this example" on the page, and checked against the article (shared/example.js)
  example: {
    inputs: {}, // the defaults are this example
    results: {
      total_volume_m3: '31.42 m³',
      ullage_m: '1.50 m',
      liquid_volume_m3: '6.14 m³',
      fill_pct: '19.55 %',
      mass_t: '6.08 t',
      surface_width_m: '1.73 m',
      surface_area_m2: '17.3 m²',
      surface_inertia_m4: '4.33 m⁴',
    },
  },
};

/** Circular segment area for a circle of radius R filled to height h from the bottom. */
export function circularSegmentArea(R, h) {
  const clamped = Math.min(2 * R, Math.max(0, h));
  return R * R * Math.acos((R - clamped) / R) - (R - clamped) * Math.sqrt(Math.max(0, 2 * R * clamped - clamped * clamped));
}

/** Chord width of a circle of radius R at height h from the bottom. */
export function chordWidth(R, h) {
  const clamped = Math.min(2 * R, Math.max(0, h));
  return 2 * Math.sqrt(Math.max(0, 2 * R * clamped - clamped * clamped));
}

/** Volume of a sphere of radius R filled to height h from the bottom (spherical cap). */
export function sphericalCapVolume(R, h) {
  const clamped = Math.min(2 * R, Math.max(0, h));
  return (Math.PI * clamped * clamped * (3 * R - clamped)) / 3;
}

/** Liquid volume and free-surface geometry of a tank at level h. */
export function tankAtLevel(i, h) {
  const R = i.diameter_m / 2;
  switch (i.shape) {
    case 'horizontal_cylinder': {
      const chord = chordWidth(R, h);
      const volume = circularSegmentArea(R, h) * i.length_m + (i.heads === 'hemispherical' ? sphericalCapVolume(R, h) : 0);
      const surfaceArea = chord * i.length_m + (i.heads === 'hemispherical' ? (Math.PI * chord * chord) / 4 : 0);
      const inertia = (i.length_m * chord ** 3) / 12 + (i.heads === 'hemispherical' ? (Math.PI * (chord / 2) ** 4) / 4 : 0);
      return { volume, surfaceWidth: chord, surfaceArea, inertia };
    }
    case 'vertical_cylinder':
      return { volume: Math.PI * R * R * h, surfaceWidth: h > 0 && h < i.height_m ? 2 * R : 0, surfaceArea: h > 0 && h < i.height_m ? Math.PI * R * R : 0, inertia: h > 0 && h < i.height_m ? (Math.PI * R ** 4) / 4 : 0 };
    case 'sphere': {
      const chord = chordWidth(R, h);
      return { volume: sphericalCapVolume(R, h), surfaceWidth: chord, surfaceArea: (Math.PI * chord * chord) / 4, inertia: (Math.PI * (chord / 2) ** 4) / 4 };
    }
    case 'rectangular': {
      const slack = h > 0 && h < i.height_m;
      return { volume: i.length_m * i.width_m * h, surfaceWidth: slack ? i.width_m : 0, surfaceArea: slack ? i.length_m * i.width_m : 0, inertia: slack ? (i.length_m * i.width_m ** 3) / 12 : 0 };
    }
    default:
      throw new Error(`Unknown tank shape "${i.shape}"`);
  }
}

/** Internal height of the tank (the level when full). */
export function tankHeight(i) {
  if (i.shape === 'horizontal_cylinder' || i.shape === 'sphere') return i.diameter_m;
  return i.height_m;
}

/** Level that holds a target volume, by bisection. */
export function levelForVolume(i, targetVolume) {
  const height = tankHeight(i);
  let lo = 0;
  let hi = height;
  for (let k = 0; k < 100; k += 1) {
    const mid = (lo + hi) / 2;
    if (tankAtLevel(i, mid).volume < targetVolume) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * @param {object} rawInputs values in schema units; missing keys take the schema defaults
 * @returns {{ outputs: object, warnings: string[] }}
 */
export function calculate(rawInputs) {
  const i = withDefaults(schema, rawInputs);
  assertOneOf(i.shape, Object.keys(SHAPES), 'shape', 'Tank shape');
  assertOneOf(i.mode, ['volume', 'level'], 'mode', 'Find');
  assertOneOf(i.heads, ['flat', 'hemispherical'], 'heads', 'Ends');
  assertPositive(i.density_t_m3, 'density_t_m3', 'Liquid density');
  if (i.shape !== 'rectangular') assertPositive(i.diameter_m, 'diameter_m', 'Diameter');
  if (i.shape === 'horizontal_cylinder' || i.shape === 'rectangular') assertPositive(i.length_m, 'length_m', 'Length');
  if (i.shape === 'rectangular') assertPositive(i.width_m, 'width_m', 'Breadth');
  if (i.shape === 'rectangular' || i.shape === 'vertical_cylinder') assertPositive(i.height_m, 'height_m', 'Height');

  const height = tankHeight(i);
  const total = tankAtLevel(i, height).volume;
  let level;
  if (i.mode === 'volume') {
    level = assertNonNegative(i.level_m, 'level_m', 'Liquid level');
    if (level > height + 1e-9) throw new Error(`Liquid level ${level} m exceeds the tank height ${height.toFixed(3)} m`);
  } else {
    const target = assertNonNegative(i.target_volume_m3, 'target_volume_m3', 'Target volume');
    if (target > total + 1e-9) throw new Error(`Target volume ${target} m³ exceeds the tank volume ${total.toFixed(3)} m³`);
    level = levelForVolume(i, target);
  }
  const state = tankAtLevel(i, level);
  const fill = (state.volume / total) * 100;

  const warnings = [];
  if (fill > 0 && fill < 100) warnings.push(`Slack tank: the free surface moment of ${state.inertia.toFixed(1)} m⁴ × ρ reduces the ship's GM by i ρ / Δ (see the initial-stability calculator).`);
  if (fill > 98) warnings.push('Tank above 98 % full: no expansion space for temperature rise — the usual filling limit for fuel tanks is 95–98 %.');
  warnings.push('Geometric volume: internal structure, coils and wells are not deducted (tank tables are typically 1–3 % lower).');

  return {
    outputs: {
      total_volume_m3: total,
      tank_height_m: height,
      level_out_m: level,
      ullage_m: height - level,
      liquid_volume_m3: state.volume,
      fill_pct: fill,
      mass_t: state.volume * i.density_t_m3,
      surface_width_m: state.surfaceWidth,
      surface_area_m2: state.surfaceArea,
      surface_inertia_m4: state.inertia,
      free_surface_moment_t_m: state.inertia * i.density_t_m3,
    },
    warnings,
  };
}
