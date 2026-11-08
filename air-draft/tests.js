/**
 * air-draft/tests.js — clearance arithmetic, trim interpolation and the tide window.
 * Run: node run-tests.js air-draft
 */
import { calculate, draftAt } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'Clearance at a 2.5 m tide: 45 m above HAT with HAT 5.6 m above chart datum gives 48.1 m over the water; a 56 m mast at 150 m from the AP of a 280 m ship trimmed 11.5/12.5 m sits at 11.96 m draft, air draft 44.04 m, gross clearance 4.06 m',
    source: 'Datum arithmetic (IHO S-4 B-302: clearances above HAT, tides above chart datum)',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.clearance_above_water_m, 48.1, { abs: 1e-9 }, 'clearance');
      assertClose(outputs.draft_at_point_m, 12.5 - 150 / 280, { rel: 1e-12 }, 'draft at the mast');
      assertClose(outputs.air_draft_m, 56 - (12.5 - 150 / 280), { rel: 1e-12 }, 'air draft');
      assertClose(outputs.gross_clearance_m, 4.064, { abs: 1e-3 }, 'gross');
      assertClose(outputs.net_margin_m, 4.064 - 0.5, { abs: 1e-3 }, 'net after the 0.5 m allowance');
      assertEqual(outputs.margin_status.startsWith('Clear'), true, 'clear');
    },
  },
  {
    name: 'Trim: the draft at the aft perpendicular is the aft draft, at the forward perpendicular the forward draft, and halfway the mean draft',
    source: 'Linear draft between the perpendiculars (rigid hull)',
    run: () => {
      assertClose(draftAt(0, 200, 8, 10), 10, { rel: 1e-12 }, 'AP');
      assertClose(draftAt(200, 200, 8, 10), 8, { rel: 1e-12 }, 'FP');
      assertClose(draftAt(100, 200, 8, 10), 9, { rel: 1e-12 }, 'midships');
    },
  },
  {
    name: 'Tide window: at the reported highest permissible tide the net margin equals the required margin exactly; the largest permissible air draft does the same at the present tide',
    source: 'Inverse of the clearance equation',
    run: () => {
      const base = calculate({}).outputs;
      const atLimit = calculate({ tide_height_m: base.max_tide_m }).outputs;
      assertClose(atLimit.net_margin_m, 2, { abs: 1e-9 }, 'margin at the limit tide');
      assertClose(base.max_air_draft_m, base.clearance_above_water_m - 0.5 - 2, { rel: 1e-12 }, 'largest air draft');
    },
  },
  {
    name: 'Squat credit of 0.5 m raises the gross clearance by 0.5 m and triggers a warning; without the credit no squat is applied',
    source: 'Squat lowers the hull (Barrass); credit is a deliberate choice',
    run: () => {
      const none = calculate({});
      const credit = calculate({ squat_credit: 'yes', squat_m: 0.5 });
      assertClose(credit.outputs.gross_clearance_m - none.outputs.gross_clearance_m, 0.5, { rel: 1e-9 }, 'credit');
      assertEqual(credit.warnings.some((w) => w.startsWith('Credit taken for squat')), true, 'warning');
      assertEqual(none.warnings.some((w) => w.startsWith('Credit taken')), false, 'no warning without credit');
    },
  },
  {
    name: 'Failing passages: at a 6 m tide only 0.06 m net margin remains (below the 2 m required); at 8 m the mast would hit the structure',
    source: 'Clearance equation with a rising tide',
    run: () => {
      const tight = calculate({ tide_height_m: 6 }).outputs;
      assertClose(tight.net_margin_m, 45 + 5.6 - 6 - (56 - (12.5 - 150 / 280)) - 0.5, { rel: 1e-12 }, 'margin');
      assertEqual(tight.margin_status.includes('below the required'), true, 'below the required margin');
      const hit = calculate({ tide_height_m: 8 }).outputs;
      assertEqual(hit.margin_status.startsWith('DO NOT PASS'), true, 'contact');
    },
  },
  {
    name: 'Invalid inputs fail fast: a highest point beyond the length, a draft above the highest point, a negative allowance',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ point_from_ap_m: 300 }), 'must be between', 'position');
      assertThrows(() => calculate({ highest_point_m: 10 }), 'not below it', 'draft above the point');
      assertThrows(() => calculate({ motion_allowance_m: -1 }), 'must not be negative', 'allowance');
    },
  },
];
