/**
 * breaker-size/tests.js — checks against the NEC and IEC sizing rules worked by hand.
 * Run: node run-tests.js breaker-size
 */
import { calculate, NEC_RATINGS, IEC_RATINGS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'NEC: a 7.2 kW EV charger at 240 V draws 30 A; continuous, it needs 37.5 A, so a 40 A breaker loaded to 75 %',
    source: 'NFPA 70 (2023) 625.41 and 210.20(A): 125 % of the continuous load; 240.6(A) standard ratings',
    run: () => {
      const { outputs } = calculate({ standard: 'nec', mode: 'power', system: 'ac1', power_w: 7200, voltage_v: 240, power_factor: 1, continuous: 'yes' });
      assertClose(outputs.design_current_a, 30, { rel: 1e-12 }, 'Ib');
      assertClose(outputs.min_rating_a, 37.5, { rel: 1e-12 }, 'min');
      assertEqual(outputs.breaker_a, 40, 'breaker');
      assertClose(outputs.loading, 0.75, { rel: 1e-12 }, 'loading');
    },
  },
  {
    name: 'NEC: 16 A continuous needs a 20 A breaker (the 80 % rule) and allows 12 AWG copper; 40 A non-continuous takes a 40 A breaker',
    source: 'NFPA 70 (2023) 210.20(A); 240.4(D)(5): 12 AWG copper 20 A',
    run: () => {
      const a = calculate({ standard: 'nec', mode: 'current', current_a: 16, continuous: 'yes' }).outputs;
      assertEqual(a.breaker_a, 20, '16 A continuous');
      assertEqual(a.small_wire, '12 AWG', 'wire');
      assertEqual(calculate({ standard: 'nec', mode: 'current', current_a: 40, continuous: 'no' }).outputs.breaker_a, 40, '40 A non-continuous');
      assertEqual(calculate({ standard: 'nec', mode: 'current', current_a: 12, continuous: 'yes' }).outputs.small_wire, '14 AWG', '15 A breaker');
    },
  },
  {
    name: 'IEC: a 3.5 kW load at 230 V draws 15.2 A, so a 16 A MCB; 11 kW three-phase at 400 V and 0.9 draws 17.6 A, so 20 A, OK on a 24 A cable',
    source: 'IEC 60364-4-43, 433.1: Ib ≤ In ≤ Iz; IEC 60898-1 preferred ratings 16, 20 A',
    run: () => {
      const one = calculate({ standard: 'iec', system: 'ac1', power_w: 3500, voltage_v: 230, power_factor: 1 }).outputs;
      assertClose(one.design_current_a, 15.217, { abs: 0.001 }, 'Ib');
      assertEqual(one.breaker_a, 16, 'In');
      const three = calculate({ standard: 'iec', system: 'ac3', power_w: 11000, voltage_v: 400, power_factor: 0.9, wire_ampacity_a: 24 }).outputs;
      assertClose(three.design_current_a, 17.641, { abs: 0.001 }, 'Ib 3ph');
      assertEqual(three.breaker_a, 20, 'In 3ph');
      assertEqual(three.wire_check.startsWith('OK'), true, 'Iz');
    },
  },
  {
    name: 'Wire checks: 52 A on a 55 A wire takes 60 A, allowed only by NEC 240.4(B); 50 A continuous needs 70 A and fails on 55 A wire; IEC never rounds up past Iz',
    source: 'NFPA 70 (2023) 240.4(B) (next higher standard rating up to 800 A); IEC 60364-4-43 433.1',
    run: () => {
      assertEqual(calculate({ standard: 'nec', mode: 'current', current_a: 52, continuous: 'no', wire_ampacity_a: 55 }).outputs.wire_check.includes('240.4(B)'), true, 'next size up');
      const fail = calculate({ standard: 'nec', mode: 'current', current_a: 50, continuous: 'yes', wire_ampacity_a: 55 });
      assertEqual(fail.outputs.breaker_a, 70, '70 A');
      assertEqual(fail.outputs.wire_check.startsWith('FAIL'), true, 'fail');
      assertEqual(calculate({ standard: 'iec', mode: 'current', current_a: 30, wire_ampacity_a: 30 }).outputs.wire_check.startsWith('FAIL'), true, 'IEC 32 A on 30 A cable');
    },
  },
  {
    name: 'Rating lists are increasing; beyond the largest rating the outputs are empty with a warning; bad inputs are rejected',
    source: 'NEC 240.6(A); IEC 60898-1 and IEC 60059; validation contract',
    run: () => {
      for (const list of [NEC_RATINGS, IEC_RATINGS]) list.forEach((r, i) => i && assertEqual(r > list[i - 1], true, `order ${r}`));
      const huge = calculate({ standard: 'iec', mode: 'current', current_a: 7000 });
      assertEqual(huge.outputs.breaker_a, null, 'no rating');
      assertEqual(huge.warnings.length > 0, true, 'warning');
      assertThrows(() => calculate({ mode: 'current', current_a: 0 }), 'Load current must be greater than zero');
      assertThrows(() => calculate({ standard: 'bs' }), 'Rules');
    },
  },
];
