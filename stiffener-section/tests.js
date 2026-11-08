/**
 * stiffener-section/tests.js — composite section properties of a stiffener with attached plating.
 * Run: node run-tests.js stiffener-section
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Tee 300 × 10 + 100 × 15 on a 600 × 12 plate: A = 117 cm², z̄ = 1 008 450/11 700 = 86.19 mm, I = 16 781 cm⁴, Z = 1947 cm³ at the plate and 697 cm³ at the flange',
    source: 'Parallel-axis theorem (Roark, Appendix A); hand calculation',
    run: () => {
      const { outputs } = calculate({});
      const zbar = (7200 * 6 + 3000 * 162 + 1500 * 319.5) / 11700;
      const inertia = 86400 + 22500000 + 28125 + 7200 * (6 - zbar) ** 2 + 3000 * (162 - zbar) ** 2 + 1500 * (319.5 - zbar) ** 2;
      assertClose(outputs.area_cm2, 117, { rel: 1e-12 }, 'area');
      assertClose(outputs.neutral_axis_mm, zbar, { rel: 1e-12 }, 'neutral axis');
      assertClose(outputs.inertia_cm4, inertia / 1e4, { rel: 1e-12 }, 'inertia');
      assertClose(outputs.z_plate_cm3, inertia / zbar / 1e3, { rel: 1e-12 }, 'Z plate');
      assertClose(outputs.z_flange_cm3, inertia / (327 - zbar) / 1e3, { rel: 1e-12 }, 'Z flange');
    },
  },
  {
    name: 'A 150 × 12 flat bar alone has I = t h³/12 = 337.5 cm⁴ and Z = 45 cm³',
    source: 'Rectangle about its centroid (Roark, Appendix A)',
    run: () => {
      const { outputs } = calculate({ profile: 'flat', web_height_mm: 150, web_thickness_mm: 12 });
      assertClose(outputs.profile_inertia_cm4, 337.5, { rel: 1e-12 }, 'I');
      assertClose(outputs.profile_z_cm3, 45, { rel: 1e-12 }, 'Z');
    },
  },
  {
    name: 'Equal plate and flat bar areas (100 × 10 each): neutral axis at 32.5 mm and I = 235.42 cm⁴',
    source: 'Hand calculation: (5 + 60)/2 and 8333 + 833 333 + 2 × 1000 × 27.5² mm⁴',
    run: () => {
      const { outputs } = calculate({ plate_breadth_mm: 100, plate_thickness_mm: 10, profile: 'flat', web_height_mm: 100, web_thickness_mm: 10 });
      assertClose(outputs.neutral_axis_mm, 32.5, { rel: 1e-12 }, 'neutral axis');
      assertClose(outputs.inertia_cm4, (100 * 1000 / 12 + (10 * 100 ** 3) / 12 + 2 * 1000 * 27.5 ** 2) / 1e4, { rel: 1e-12 }, 'inertia');
    },
  },
  {
    name: 'The same tee entered from a profile table (45 cm², centroid 202.5 mm, own I) gives the same section properties',
    source: 'Consistency of the tabulated-profile input',
    run: () => {
      const built = calculate({}).outputs;
      const table = calculate({ profile: 'table', table_area_cm2: 45, table_centroid_mm: 202.5, table_inertia_cm4: built.profile_inertia_cm4, table_height_mm: 315 }).outputs;
      assertClose(table.inertia_cm4, built.inertia_cm4, { rel: 1e-12 }, 'inertia');
      assertClose(table.z_flange_cm3, built.z_flange_cm3, { rel: 1e-12 }, 'Z flange');
    },
  },
  {
    name: 'The parts table adds up: total inertia = Σ own inertia + Σ A (z − z̄)²',
    source: 'Parallel-axis theorem',
    run: () => {
      const { outputs } = calculate({});
      const total = outputs.parts_table.rows[outputs.parts_table.rows.length - 1];
      assertClose(total[3] + total[4], outputs.inertia_cm4, { rel: 1e-12 }, 'sum');
      assertEqual(outputs.parts_table.rows.length, 4, 'plate, web, flange and total');
    },
  },
  {
    name: 'Invalid inputs are rejected: a table centroid above the profile height, zero plate thickness',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ profile: 'table', table_centroid_mm: 300 }), 'within the profile height');
      assertThrows(() => calculate({ plate_thickness_mm: 0 }), 'greater than zero');
    },
  },
];
