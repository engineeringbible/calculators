/**
 * charter-party-claim/tests.js — good-weather method, "about" allowances, offsets and current correction.
 * Run: node run-tests.js charter-party-claim
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const LA_2007 = { warranted_speed_kn: 12.5, speed_allowance_kn: 0.5, warranted_consumption_t_day: 30, consumption_allowance_pct: 0, gw_distance_nmi: 288, gw_time_h: 28.8, gw_fuel_t: 29, total_distance_nmi: 288, hire_per_day: 10000, bunker_price: 500 };

export const tests = [
  {
    name: 'Kasi basic example: warranted 15 kn on 30 t/day, good-weather performance 14 kn on 31 t/day over 15 000 nmi give 71.43 h lost and 133.93 t over-consumed',
    source: 'A. Kasi, Performance claims under NYPE 1946 and 1993: establishing and extrapolating (4-5 Gray\'s Inn Square), worked example',
    run: () => {
      const { outputs } = calculate({ warranted_speed_kn: 15, speed_allowance_kn: 0, consumption_allowance_pct: 0, gw_distance_nmi: 336, gw_time_h: 24, gw_fuel_t: 31, total_distance_nmi: 15000 });
      assertClose(outputs.time_lost_h, 71.43, { abs: 0.005 }, 'time lost');
      assertClose(outputs.over_consumption_t, 133.93, { abs: 0.005 }, 'over-consumption');
      assertClose(outputs.over_consumption_t, 31 * (15000 / 14 / 24) - 30 * (1000 / 24), { rel: 1e-12 }, 'basic formula');
    },
  },
  {
    name: 'London Arbitration 20/07: about 12.5 kn, 288 nmi at 10 kn burning 29 t against 30 t without margin: 4.8 h lost, 1 t saved and credited',
    source: 'A. Kasi, The "about" margin in speed-consumption warranty (4-5 Gray\'s Inn Square), example of London Arbitration 20/07',
    run: () => {
      const { outputs } = calculate(LA_2007);
      assertClose(outputs.time_lost_h, 4.8, { rel: 1e-12 }, 'time lost');
      assertClose(outputs.over_consumption_t, -1, { rel: 1e-12 }, 'fuel saved');
      assertClose(outputs.total_claim, (4.8 / 24) * 10000 - 500, { rel: 1e-12 }, 'net claim');
    },
  },
  {
    name: 'The Gaz Energy (No 2): with a 5 % margin the saving is measured from 28.5 t/day, so 29 t is no saving and the claim is the time head alone',
    source: 'Hyundai Merchant Marine v Trafigura (The Gaz Energy No 2) [2012] EWHC 1686 (Comm), as summarised in the West P&I defence guide',
    run: () => {
      const { outputs } = calculate({ ...LA_2007, consumption_allowance_pct: 5 });
      assertEqual(outputs.over_consumption_t, 0, 'no credit');
      assertClose(outputs.total_claim, 2000, { rel: 1e-12 }, 'claim');
    },
  },
  {
    name: 'Default passage: 13.33 kn on 32 t/day against 13.5 kn on 31.5 t/day over 5000 nmi: 4.630 h lost, 13.889 t over-consumed, claim 11 226.85',
    source: 'Basic formula: 375 h − 370.37 h; 32 × 375/24 − 31.5 × 370.37/24',
    run: () => {
      const { outputs } = calculate({});
      assertClose(outputs.time_lost_h, 375 - 5000 / 13.5, { rel: 1e-12 }, 'time lost');
      assertClose(outputs.over_consumption_t, 500 - (31.5 * 5000) / 13.5 / 24, { rel: 1e-12 }, 'over-consumption');
      assertClose(outputs.total_claim, 11226.85, { abs: 0.01 }, 'claim');
      assertClose(outputs.passage_table.rows[0][4], (120 * 5000) / 1200, { rel: 1e-12 }, 'extrapolated fuel = fuel per mile × distance');
    },
  },
  {
    name: 'A favourable current of 0.3 kn lowers the good-weather speed to 13.033 kn and raises the time lost to 13.26 h',
    source: 'Current correction of the speed over the ground (London Arbitration 15/05; West P&I defence guide)',
    run: () => {
      const { outputs } = calculate({ gw_current_kn: 0.3 });
      assertClose(outputs.gw_speed_kn, 1200 / 90 - 0.3, { rel: 1e-12 }, 'speed through the water');
      assertClose(outputs.time_lost_h, 5000 / (1200 / 90 - 0.3) - 5000 / 13.5, { rel: 1e-12 }, 'time lost');
      assertClose(outputs.time_lost_h, 13.26, { abs: 0.005 }, 'value');
    },
  },
  {
    name: 'A ship inside the "about" range has no claim either way; gains are credited only with the offset, and a net gain never becomes a claim against the charterers',
    source: 'The Ioanna [1985] 2 Lloyd\'s Rep 164; The Al Bida [1987] 1 Lloyd\'s Rep 124',
    run: () => {
      const inside = calculate({ gw_distance_nmi: 1260, gw_time_h: 90, gw_fuel_t: 115 }).outputs;
      assertEqual(inside.time_lost_h, 0, 'no time head');
      assertEqual(inside.over_consumption_t, 0, 'no fuel head');
      const economical = { gw_distance_nmi: 1300, gw_time_h: 90, gw_fuel_t: 100 };
      const credited = calculate(economical);
      assertEqual(credited.outputs.over_consumption_t < 0, true, 'fuel saved is credited');
      assertEqual(credited.outputs.total_claim, 0, 'no negative claim');
      assertEqual(credited.warnings.some((w) => w.includes('no claim')), true, 'warning');
      assertEqual(calculate({ ...economical, offset: 'none' }).outputs.over_consumption_t, 0, 'not credited');
    },
  },
  {
    name: 'Invalid inputs are rejected: an allowance as large as the warranted speed, a current larger than the speed, negative fuel',
    source: 'Input validation',
    run: () => {
      assertThrows(() => calculate({ speed_allowance_kn: 14 }), 'smaller than the warranted speed');
      assertThrows(() => calculate({ gw_current_kn: 14 }), 'greater than zero');
      assertThrows(() => calculate({ gw_fuel_t: -1 }), 'must not be negative');
    },
  },
];
