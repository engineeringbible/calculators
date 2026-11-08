/**
 * hardness-conversion/tests.js — checks against the rows of ASTM E140 Tables 1 and 2 and ISO 18265 Table A.1.
 * Run: node run-tests.js hardness-conversion
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'E140 Table 1 rows: 60 HRC = 697 HV, 654 HBW; 50 HRC = 513 HV, 481 HBW; 40 HRC = 392 HV, 371 HBW; 30 HRC = 302 HV, 286 HBW',
    source: 'ASTM E140 Table 1 (non-austenitic steels, Rockwell C range)',
    run: () => {
      [[60, 697, 654], [50, 513, 481], [40, 392, 371], [30, 302, 286]].forEach(([c, v, b]) => {
        const o = calculate({ scale: 'hrc', value: c }).outputs;
        assertClose(o.hv, v, { abs: 1e-9 }, `HV at ${c} HRC`);
        assertClose(o.hbw, b, { abs: 1e-9 }, `HBW at ${c} HRC`);
      });
    },
  },
  {
    name: 'E140 Table 2 rows: 100 HRB = 240 HV, 90 HRB = 185 HV, 80 HRB = 150 HV, 60 HRB = 107 HV (HB = HV in this range)',
    source: 'ASTM E140 Table 2 (non-austenitic steels, Rockwell B range)',
    run: () => {
      [[100, 240], [90, 185], [80, 150], [60, 107]].forEach(([b, v]) => {
        const o = calculate({ scale: 'hrb', value: b }).outputs;
        assertClose(o.hv, v, { abs: 1e-9 }, `HV at ${b} HRB`);
        assertClose(o.hbw, v, { abs: 1e-9 }, `HB at ${b} HRB`);
      });
    },
  },
  {
    name: 'Inverse and interpolation: 446 HV gives 45.0 HRC; 400 HBW gives 43.0 HRC; 45.5 HRC lies half-way between 446 and 458 HV',
    source: 'ASTM E140 Table 1, linear interpolation between rows (by hand)',
    run: () => {
      assertClose(calculate({ scale: 'hv', value: 446 }).outputs.hrc, 45, { abs: 1e-9 }, 'HV → HRC');
      assertClose(calculate({ scale: 'hbw', value: 400 }).outputs.hrc, 43, { abs: 1e-9 }, 'HBW → HRC');
      assertClose(calculate({ scale: 'hrc', value: 45.5 }).outputs.hv, 452, { abs: 1e-9 }, 'interpolated');
    },
  },
  {
    name: 'ISO 18265 tensile strength: 446 HV (45 HRC) ≈ 1 441 MPa; 165 HV (85 HRB) = 530 MPa; 800 MPa ↔ 250 HV',
    source: 'ISO 18265 Table A.1 rows (440 HV 1 420 MPa, 450 HV 1 455 MPa, 165 HV 530 MPa, 250 HV 800 MPa)',
    run: () => {
      assertClose(calculate({ scale: 'hrc', value: 45 }).outputs.tensile_pa / 1e6, 1441, { abs: 1e-6 }, '45 HRC');
      assertClose(calculate({ scale: 'hrb', value: 85 }).outputs.tensile_pa / 1e6, 530, { abs: 1e-6 }, '85 HRB');
      assertClose(calculate({ scale: 'rm', rm_pa: 800e6 }).outputs.hv, 250, { abs: 1e-9 }, 'Rm → HV');
    },
  },
  {
    name: 'Spot-check against a second table: ISO 18265 tensile within 3 % of the SAE/ASTM tensile column (1 480 MPa at 45 HRC, 950 MPa at 30 HRC)',
    source: 'Miki Pulley technical data, Rockwell C hardness conversion table (approximate tensile strength column)',
    run: () => {
      assertClose(calculate({ scale: 'hrc', value: 45 }).outputs.tensile_pa / 1e6, 1480, { rel: 0.03 }, '45 HRC');
      assertClose(calculate({ scale: 'hrc', value: 30 }).outputs.tensile_pa / 1e6, 950, { rel: 0.03 }, '30 HRC');
    },
  },
  {
    name: 'Out of the tables: HRC 18, HRB 105, HV 950 and 3 000 MPa are refused; 68 HRC has no Brinell or tensile value',
    source: 'Validation contract (no extrapolation beyond ASTM E140 and ISO 18265)',
    run: () => {
      assertThrows(() => calculate({ scale: 'hrc', value: 18 }), 'outside the conversion table');
      assertThrows(() => calculate({ scale: 'hrb', value: 105 }), 'outside the conversion table');
      assertThrows(() => calculate({ scale: 'hv', value: 950 }), 'outside the conversion table');
      assertThrows(() => calculate({ scale: 'rm', rm_pa: 3000e6 }), 'Tensile strength');
      const o = calculate({ scale: 'hrc', value: 68 }).outputs;
      assertEqual(o.hbw, null, 'HBW');
      assertEqual(o.tensile_pa, null, 'Rm');
    },
  },
];
