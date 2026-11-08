/**
 * speeds-feeds/tests.js — checks against the Machinery's Handbook and Harvey Tool formulas and the table values.
 * Run: node run-tests.js speeds-feeds
 */
import { calculate, tableSpeed } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const FPM = 0.00508;

export const tests = [
  {
    name: 'Milling: 1/2 in 4-flute end mill at 200 sfm runs 3.82 × 200 / 0.5 = 1 528 rpm; 0.003 in/tooth gives 18.33 ipm; 0.25 × 0.25 in cut removes 1.146 in³/min',
    source: 'Harvey Tool: RPM = 3.82 SFM / D, IPM = RPM × IPT × T; MRR = a_p a_e v_f (hand calculation)',
    run: () => {
      const o = calculate({ speed_source: 'custom', vc_m_s: 200 * FPM, diameter_m: 0.5 * IN, teeth: 4, fz_m: 0.003 * IN, ap_m: 0.25 * IN, ae_m: 0.25 * IN }).outputs;
      assertClose(o.rpm, 1527.887, { abs: 0.001 }, 'rpm');
      assertClose(o.feed_ipm, 18.3346, { abs: 0.0001 }, 'ipm');
      assertClose(o.mrr_in3_min, 1.14592, { abs: 0.00001 }, 'MRR');
      assertClose(o.feed_mm_min, 18.3346 * 25.4, { rel: 1e-5 }, 'mm/min');
    },
  },
  {
    name: 'Turning: 2 in bar of 1018 at 110 fpm (HSS table value) runs 210.1 rpm; 0.010 in/rev and 0.100 in depth remove 12 × 110 × 0.010 × 0.100 = 1.32 in³/min',
    source: 'Machinery\'s Handbook 31st ed.: N = 12 V / (π D), Q = 12 V f d; Table 1 (1018, 125–175 HB, HSS 110 fpm)',
    run: () => {
      const o = calculate({ operation: 'turning', material: 'low_c', tool: 'hss', diameter_m: 2 * IN, f_rev_m: 0.01 * IN, ap_m: 0.1 * IN }).outputs;
      assertClose(o.rpm, (12 * 110) / (Math.PI * 2), { rel: 1e-9 }, 'rpm');
      assertClose(o.mrr_in3_min, 1.32, { rel: 1e-9 }, 'MRR');
      assertClose(o.feed_ipm, 2.1008, { abs: 0.0001 }, 'ipm');
    },
  },
  {
    name: 'Metric drilling: 10 mm drill at 25 m/min runs 795.8 rpm; 0.15 mm/rev feeds 119.4 mm/min and removes 9.375 cm³/min',
    source: 'n = 1000 v_c / (π D); v_f = f n; MRR = (π D²/4) v_f (hand calculation)',
    run: () => {
      const o = calculate({ operation: 'drilling', speed_source: 'custom', vc_m_s: 25 / 60, diameter_m: 0.01, f_rev_m: 0.00015 }).outputs;
      assertClose(o.rpm, 795.775, { abs: 0.001 }, 'rpm');
      assertClose(o.feed_mm_min, 119.366, { abs: 0.001 }, 'mm/min');
      assertClose(o.mrr_cm3_min, 9.37500, { abs: 0.00001 }, 'MRR');
    },
  },
  {
    name: 'Table: 304 HSS 75 fpm, aluminium HSS 500 fpm, carbide 1018 = middle of 100–300 = 200 sfm; a spindle limit of 1 000 rpm lowers the cutting speed to 130.9 sfm',
    source: 'Machinery\'s Handbook 31st ed. Tables 3 and 8; Harvey Tool carbide end mill table',
    run: () => {
      assertClose(tableSpeed('ss304', 'hss') / FPM, 75, { rel: 1e-12 }, '304');
      assertClose(tableSpeed('al', 'hss') / FPM, 500, { rel: 1e-12 }, 'Al');
      assertClose(tableSpeed('low_c', 'carbide') / FPM, 200, { rel: 1e-12 }, '1018 carbide');
      const r = calculate({ max_rpm: 1000 });
      assertClose(r.outputs.vc_used_m_s / FPM, 130.8997, { abs: 0.0001 }, 'capped speed');
      assertEqual(r.warnings.length, 1, 'cap warning');
    },
  },
  {
    name: 'Light radial engagement warns about chip thinning; a cut wider than the cutter, a turning depth beyond the radius and zero diameter are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ ae_m: 0.1 * IN }).warnings.length, 1, 'thinning warning');
      assertThrows(() => calculate({ ae_m: 0.6 * IN }), 'cannot exceed the cutter diameter');
      assertThrows(() => calculate({ operation: 'turning', diameter_m: 0.02, ap_m: 0.011 }), 'work radius');
      assertThrows(() => calculate({ diameter_m: 0 }), 'Diameter D');
    },
  },
];
