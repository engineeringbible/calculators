/**
 * loading-condition/tests.js — moment sums, hydrostatic interpolation, trim, list and density.
 * Run: node run-tests.js loading-condition
 */
import { calculate, interpolateHydrostatics } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const DEG = Math.PI / 180;
const HYDRO = '5;9000;8.9;71.8;69.2;165;25.6\n6;11600;8.55;71.5;68.6;175;26.2\n7;14250;8.4;71.2;68;185;26.8';
const SIMPLE = 'Lightship; 5000; 8; 60; 0; 0\nCargo; 6000; 6; 75; 0; 0\nFuel; 600; 1; 40; 0; 300';

export const tests = [
  {
    name: 'Moment sums: 5000 t at 8 m, 6000 t at 6 m and 600 t at 1 m give Δ 11 600 t and KG 6.6034 m; LCG 66.724 m; deadweight 6600 t; FSM 300 t·m adds 0.0259 m',
    source: 'Sum of moments about the keel and the aft perpendicular (Barrass & Derrett, loading condition tables)',
    run: () => {
      const { outputs } = calculate({ items: SIMPLE, hydrostatics: HYDRO });
      assertClose(outputs.displacement_t, 11600, { rel: 1e-12 }, 'displacement');
      assertClose(outputs.kg_solid_m, (5000 * 8 + 6000 * 6 + 600 * 1) / 11600, { rel: 1e-12 }, 'KG');
      assertClose(outputs.lcg_m, (5000 * 60 + 6000 * 75 + 600 * 40) / 11600, { rel: 1e-12 }, 'LCG');
      assertClose(outputs.deadweight_t, 6600, { rel: 1e-12 }, 'deadweight');
      assertClose(outputs.fsc_m, 300 / 11600, { rel: 1e-12 }, 'free-surface correction');
    },
  },
  {
    name: 'Hydrostatics: at exactly 11 600 t the table row is returned (draft 6.0 m, KM 8.55 m); halfway between rows every column is the mean',
    source: 'Linear interpolation by displacement in the hydrostatic table',
    run: () => {
      const rows = HYDRO.split('\n').map((l, k) => ({ values: l.split(';').map(Number), line: k + 1 }));
      const at = interpolateHydrostatics(rows, 11600);
      assertClose(at.draft, 6, { rel: 1e-12 }, 'draft');
      assertClose(at.km, 8.55, { rel: 1e-12 }, 'KM');
      const mid = interpolateHydrostatics(rows, (11600 + 14250) / 2);
      assertClose(mid.draft, 6.5, { rel: 1e-12 }, 'mid draft');
      assertClose(mid.mctc, 180, { rel: 1e-12 }, 'mid MCTC');
    },
  },
  {
    name: 'Trim and drafts: Δ(LCB − LCG)/(100 MCTC) with LCB 71.5 m, MCTC 175 t·m/cm; the drafts differ by the trim and the draft at the LCF is the table draft',
    source: 'Trim by the moment to change trim about the LCF (Barrass & Derrett)',
    run: () => {
      const { outputs } = calculate({ items: SIMPLE, hydrostatics: HYDRO, lbp_m: 140 });
      const trim = (11600 * (71.5 - outputs.lcg_m)) / (100 * 175);
      assertClose(outputs.trim_m, trim, { rel: 1e-12 }, 'trim');
      assertClose(outputs.draft_aft_m - outputs.draft_fwd_m, trim, { rel: 1e-9 }, 'drafts differ by the trim');
      const atLcf = outputs.draft_aft_m + (outputs.draft_fwd_m - outputs.draft_aft_m) * (68.6 / 140);
      assertClose(atLcf, 6, { rel: 1e-9 }, 'draft at the LCF');
    },
  },
  {
    name: 'List: moving 100 t of the cargo 10 m to starboard lists the ship by atan(1000/(Δ · GM)); the GM is KM − KG − FSC',
    source: 'Small-angle list tan φ = w·d / (Δ·GM)',
    run: () => {
      const items = `${SIMPLE}\nDeck cargo; 100; 6; 75; 10; 0`;
      const { outputs } = calculate({ items, hydrostatics: HYDRO });
      const gm = outputs.km_m - outputs.kg_solid_m - outputs.fsc_m;
      assertClose(outputs.gm_fluid_m, gm, { rel: 1e-12 }, 'GM');
      assertClose(outputs.list_deg, Math.atan(1000 / outputs.displacement_t / gm) / DEG, { rel: 1e-9 }, 'list');
    },
  },
  {
    name: 'Density: in fresh water (1.000 t/m³) the same 11 600 t corresponds to 11 890 t of sea water in the table, so the ship floats deeper; MCTC and TPC scale with the density',
    source: 'Displacement = volume × density; table particulars in sea water 1.025 t/m³',
    run: () => {
      const salt = calculate({ items: SIMPLE, hydrostatics: HYDRO }).outputs;
      const fresh = calculate({ items: SIMPLE, hydrostatics: HYDRO, density_t_m3: 1.0 }).outputs;
      assertEqual(fresh.draft_mean_m > salt.draft_mean_m, true, 'deeper in fresh water');
      const equivalent = 11600 * 1.025;
      assertClose(fresh.draft_mean_m, 6 + (equivalent - 11600) / (14250 - 11600), { rel: 1e-9 }, 'draft at the equivalent displacement');
    },
  },
  {
    name: 'Invalid inputs fail fast: a displacement outside the table, a zero weight, a table with falling displacements, a malformed line',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ items: 'Lightship; 30000; 8; 60', hydrostatics: HYDRO }), 'outside the hydrostatic table', 'out of range');
      assertThrows(() => calculate({ items: 'Lightship; 0; 8; 60', hydrostatics: HYDRO }), 'greater than zero', 'zero weight');
      assertThrows(() => calculate({ items: SIMPLE, hydrostatics: '6;11600;8.55;71.5;68.6;175;26.2\n5;9000;8.9;71.8;69.2;165;25.6' }), 'must increase', 'order');
      assertThrows(() => calculate({ items: 'Lightship; heavy; 8; 60', hydrostatics: HYDRO }), 'Items line 1', 'malformed');
    },
  },
];
