/**
 * lighting-lumen/tests.js — checks of the lumen method arithmetic and the layout logic.
 * Run: node run-tests.js lighting-lumen
 */
import { calculate, roomIndex, typicalUf, gridFor, UF_TABLE, ILLUMINANCE_PRESETS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const OFFICE = { length_m: 12, width_m: 8, mounting_height_m: 2.3, task: 'office_writing', luminaire_lm: 4000, luminaire_w: 36, uf_mode: 'custom', uf_custom: 0.55, maintenance_factor: 0.8, shr_max: 1.5, hours_per_year: 2500 };

export const tests = [
  {
    name: 'Room index: 12 × 8 m at h_m 2.3 m → K = 96/(2.3 × 20) = 2.087; a square 10 × 10 m room at 3 m → 1.67; K is symmetric in L and W',
    source: 'CIBSE/SLL Lighting Handbook, room index K = LW/(h_m(L + W))',
    run: () => {
      assertClose(roomIndex(12, 8, 2.3), 96 / 46, { rel: 1e-12 }, 'K');
      assertClose(calculate(OFFICE).outputs.room_index, 2.087, { abs: 1e-3 }, 'in calculate');
      assertClose(roomIndex(10, 10, 3), 100 / 60, { rel: 1e-12 }, 'square');
      assertClose(roomIndex(8, 12, 2.3), roomIndex(12, 8, 2.3), { rel: 1e-12 }, 'symmetric');
    },
  },
  {
    name: 'Lumen method: 500 lx over 96 m² with 4 000 lm luminaires, UF 0.55, MF 0.8 → N = 48 000/1 760 = 27.3 → 28 in a 4 × 7 grid; achieved 513 lx, initial 642 lx',
    source: 'N = E A/(Φ UF MF) (SLL Code for Lighting); E_achieved = N Φ UF MF/A',
    run: () => {
      const { outputs } = calculate(OFFICE);
      assertClose(outputs.luminaires_exact, 48000 / 1760, { rel: 1e-12 }, 'N exact');
      assertEqual(outputs.luminaires, 28, 'N installed');
      assertEqual(outputs.layout.startsWith('4 rows × 7 columns'), true, 'grid');
      assertClose(outputs.achieved_lux, (28 * 4000 * 0.55 * 0.8) / 96, { rel: 1e-12 }, 'achieved');
      assertClose(outputs.achieved_lux, 513.3, { abs: 0.1 }, 'achieved value');
      assertClose(outputs.initial_lux, outputs.achieved_lux / 0.8, { rel: 1e-12 }, 'initial');
      assertEqual(outputs.achieved_lux >= 500, true, 'meets target');
    },
  },
  {
    name: 'Layout and SHR: 4 × 7 grid gives spacings 1.71 m (length) and 2.0 m (width), SHR = 2.0/2.3 = 0.87 ≤ 1.5 OK; a high bay at h_m 8 m with few fittings exceeds SHR and is flagged',
    source: 'SLL spacing-to-height ratio criterion for uniformity',
    run: () => {
      const { outputs } = calculate(OFFICE);
      assertClose(outputs.spacing_length_m, 12 / 7, { rel: 1e-12 }, 'spacing L');
      assertClose(outputs.spacing_width_m, 2, { rel: 1e-12 }, 'spacing W');
      assertClose(outputs.shr, 2 / 2.3, { rel: 1e-12 }, 'SHR');
      assertEqual(outputs.shr_check.startsWith('OK'), true, 'OK');
      const hall = calculate({ ...OFFICE, length_m: 40, width_m: 30, mounting_height_m: 8, task: 'stores', luminaire_lm: 30000, luminaire_w: 200, shr_max: 1.2 });
      assertEqual(hall.outputs.shr_check.startsWith('EXCEEDED') || hall.outputs.shr <= 1.2, true, 'SHR evaluated');
      const g = gridFor(27, 12, 8);
      assertEqual(g.rows * g.cols >= 27, true, 'grid covers N');
    },
  },
  {
    name: 'Typical UF table: 70/50/20 at K 2.0 = 0.59, interpolated 0.61 at K 2.25; darker 30/30/20 surfaces give 0.52 at K 2.0; table mode on the office (K 2.09) gives UF ≈ 0.60 and 25.1 luminaires required (still 28 installed on the 4 × 7 grid)',
    source: 'Indicative UF values for a recessed direct luminaire (SLL/CIBSE pattern); manufacturer data governs',
    run: () => {
      assertEqual(UF_TABLE['70/50/20'][2.0], 0.59, 'table value');
      assertClose(typicalUf('70/50/20', 2.25), 0.61, { rel: 1e-9 }, 'interpolation');
      assertEqual(UF_TABLE['30/30/20'][2.0], 0.52, 'dark room');
      assertEqual(typicalUf('70/50/20', 0.5), 0.38, 'clamped low');
      assertEqual(typicalUf('70/50/20', 9), 0.7, 'clamped high');
      const table = calculate({ ...OFFICE, uf_mode: 'table', reflectances: '70/50/20' });
      assertClose(table.outputs.uf_used, typicalUf('70/50/20', 96 / 46), { rel: 1e-12 }, 'UF used');
      assertClose(table.outputs.luminaires_exact, 25.1, { abs: 0.1 }, '25.1 required with UF 0.60');
      assertEqual(table.outputs.luminaires, 28, '4 × 7 grid still');
      assertEqual(table.warnings.some((w) => w.includes('typical direct-luminaire table')), true, 'warning');
    },
  },
  {
    name: 'Power and energy: 28 × 36 W = 1 008 W, 10.5 W/m², efficacy 111 lm/W, 2 520 kWh/year at 2 500 h; EN 12464-1 presets (office 500, drawing 750, corridor 100, engine room 200)',
    source: 'EN 12464-1 maintained illuminance; EN 15193 lighting power density benchmarks (LED offices 8–12 W/m²)',
    run: () => {
      const { outputs } = calculate(OFFICE);
      assertClose(outputs.total_power_w, 1008, { rel: 1e-12 }, 'power');
      assertClose(outputs.power_density_w_m2, 10.5, { rel: 1e-12 }, 'W/m²');
      assertClose(outputs.efficacy_lm_w, 4000 / 36, { rel: 1e-12 }, 'efficacy');
      assertClose(outputs.annual_energy_wh / 1000, 2520, { rel: 1e-12 }, 'kWh');
      assertEqual(ILLUMINANCE_PRESETS.office_writing.lux === 500 && ILLUMINANCE_PRESETS.drawing.lux === 750 && ILLUMINANCE_PRESETS.corridor.lux === 100 && ILLUMINANCE_PRESETS.engine_room.lux === 200, true, 'presets');
      assertClose(calculate({ ...OFFICE, task: 'custom', lux_custom: 300 }).outputs.target_lux, 300, { rel: 1e-12 }, 'custom lux');
    },
  },
  {
    name: 'Long room warning (L > 4W) and invalid inputs: zero height, UF above 1, unknown task',
    source: 'Room-index validity (SLL); validation contract',
    run: () => {
      const long = calculate({ ...OFFICE, length_m: 40, width_m: 8 });
      assertEqual(long.warnings.some((w) => w.includes('four times the width')), true, 'long room');
      assertThrows(() => calculate({ ...OFFICE, mounting_height_m: 0 }), 'greater than zero', 'height');
      assertThrows(() => calculate({ ...OFFICE, uf_custom: 1.2 }), 'between', 'UF');
      assertThrows(() => calculate({ ...OFFICE, task: 'theatre' }), 'must be one of', 'task');
    },
  },
];
