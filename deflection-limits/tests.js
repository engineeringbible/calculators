/**
 * deflection-limits/tests.js — checks against IBC Table 1604.3, the UK National Annex to EN 1993-1-1, EN 1992-1-1 and
 * EN 1995-1-1 Table 7.2.
 * Run: node run-tests.js deflection-limits
 */
import { calculate, LIMITS } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const FT = 0.3048;
const IN = 0.0254;

export const tests = [
  {
    name: 'IBC Table 1604.3: floor L/360 and D+L/240; roof with plaster ceiling 360/360/240, non-plaster 240/240/180, no ceiling 180/180/120; walls 360/240/120; farm 180, greenhouse 120',
    source: 'IBC 2021 Table 1604.3 Deflection Limits',
    run: () => {
      const d = (m) => LIMITS.ibc[m].rows.map((r) => r[1]).join('/');
      assertEqual(d('floor'), '360/240', 'floor');
      assertEqual(d('roof_plaster'), '360/360/240', 'plaster ceiling');
      assertEqual(d('roof_nonplaster'), '240/240/180', 'non-plaster');
      assertEqual(d('roof_none'), '180/180/120', 'no ceiling');
      assertEqual([d('wall_plaster'), d('wall_brittle'), d('wall_flexible')].join(','), '360,240,120', 'walls');
      assertEqual([d('part_plaster'), d('part_brittle'), d('part_flexible')].join(','), '360,240,120', 'partitions');
      assertEqual(`${d('farm')},${d('greenhouse')}`, '180,120', 'farm, greenhouse');
    },
  },
  {
    name: 'Worked example: 14 ft floor joist, L/360 = 0.467 in and L/240 = 0.700 in; 0.35 in and 0.55 in use 75.0 % and 78.6 %, span/480',
    source: 'Hand calculation: 14 × 12 = 168 in; 168/360, 168/240',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.allow_var_m / IN, 168 / 360, { rel: 1e-12 }, 'L/360');
      assertClose(o.allow_total_m / IN, 168 / 240, { rel: 1e-12 }, 'L/240');
      assertClose(o.utilisation, 0.55 / 0.7, { rel: 1e-12 }, 'utilisation');
      assertClose(o.ratio_var, 480, { rel: 1e-12 }, 'span/480');
      assertEqual(o.verdict.startsWith('Passes'), true, 'passes');
    },
  },
  {
    name: 'IBC cantilever: a 6 ft roof cantilever with no ceiling uses l = 12 ft, so L/180 = 0.80 in; walls cannot be cantilevers',
    source: 'IBC Table 1604.3 footnote i: for cantilever members, l is twice the length of the cantilever',
    run: () => {
      const o = calculate({ member_ibc: 'roof_none', cantilever: 'yes', span_m: 6 * FT }).outputs;
      assertClose(o.length_m / FT, 12, { rel: 1e-12 }, 'l');
      assertClose(o.allow_var_m / IN, 144 / 180, { rel: 1e-12 }, 'L/180');
      assertThrows(() => calculate({ member_ibc: 'wall_brittle', cantilever: 'yes' }), 'roof and floor');
    },
  },
  {
    name: 'UK NA steel: 8 m beam with brittle finish span/360 = 22.2 mm, other beam span/200 = 40 mm, 2 m cantilever length/180 = 11.1 mm',
    source: 'NA to BS EN 1993-1-1, NA.2.23 (vertical deflections under variable actions)',
    run: () => {
      assertClose(calculate({ code: 'uk1993', member_uk1993: 'beam_brittle', span_m: 8 }).outputs.allow_var_m * 1000, 22.222, { abs: 0.001 }, '/360');
      assertClose(calculate({ code: 'uk1993', member_uk1993: 'beam_other', span_m: 8 }).outputs.allow_var_m * 1000, 40, { abs: 1e-9 }, '/200');
      assertClose(calculate({ code: 'uk1993', member_uk1993: 'beam_other', cantilever: 'yes', span_m: 2 }).outputs.allow_var_m * 1000, 11.111, { abs: 0.001 }, '/180');
    },
  },
  {
    name: 'EN 1992: 6 m slab span/250 = 24 mm and span/500 = 12 mm; EN 1995: 4 m beam w_inst l/300 = 13.3 mm (lenient) or l/500 = 8 mm (strict), w_fin l/150 = 26.7 mm',
    source: 'EN 1992-1-1 7.4.1(4), (5); EN 1995-1-1 Table 7.2',
    run: () => {
      const c = calculate({ code: 'en1992', span_m: 6 }).outputs;
      assertClose(c.allow_total_m * 1000, 24, { abs: 1e-9 }, '/250');
      assertClose(c.allow_var_m * 1000, 12, { abs: 1e-9 }, '/500');
      assertClose(calculate({ code: 'en1995', span_m: 4 }).outputs.allow_var_m * 1000, 13.333, { abs: 0.001 }, 'l/300');
      assertClose(calculate({ code: 'en1995', span_m: 4, range_end: 'strict' }).outputs.allow_var_m * 1000, 8, { abs: 1e-9 }, 'l/500');
      assertEqual(LIMITS.en1995.beam.rows[2][1].join('/'), '150/300', 'w_fin range');
    },
  },
  {
    name: 'A deflection over the limit fails; zero deflections are not checked; a negative deflection and an unknown member are refused',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ delta_var_m: 0.6 * IN }).outputs.verdict.startsWith('Fails'), true, 'fails');
      assertEqual(calculate({ delta_var_m: 0, delta_total_m: 0 }).outputs.utilisation, null, 'not checked');
      assertThrows(() => calculate({ delta_var_m: -0.01 }), 'must not be negative');
      assertThrows(() => calculate({ member_ibc: 'bridge' }), 'Member');
    },
  },
];
