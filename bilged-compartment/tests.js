/**
 * bilged-compartment/tests.js — lost buoyancy for box-shaped vessels: midship and end compartments, permeability, sinking.
 * Run: node run-tests.js bilged-compartment
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const MIDSHIP = { length_m: 75, beam_m: 10, depth_m: 10, draft_m: 6, kg_m: 4, comp_length_m: 15, comp_breadth_m: 10, comp_position_m: 0, permeability: 1 };

export const tests = [
  {
    name: 'Box 75 m × 10 m at 6 m draft, KG 4 m, 15 m midship compartment bilged: sinkage 15 × 6/60 = 1.5 m, KB 3.75 m, BM (60 × 10³/12)/4500 = 1.111 m, GM rises from 0.389 m to 0.861 m',
    source: 'Barrass & Derrett, "Bilging and permeability": lost buoyancy method for a box-shaped vessel',
    run: () => {
      const { outputs } = calculate(MIDSHIP);
      assertClose(outputs.sinkage_m, 1.5, { rel: 1e-12 }, 'sinkage');
      assertClose(outputs.mean_draft_m, 7.5, { rel: 1e-12 }, 'draft');
      assertClose(outputs.kb_after_m, 3.75, { rel: 1e-12 }, 'KB = new draft / 2 for a full-breadth compartment');
      assertClose(outputs.bm_after_m, (60 * 1000) / 12 / 4500, { rel: 1e-12 }, 'BM');
      assertClose(outputs.gm_before_m, 3 + 75000 / 12 / 4500 - 4, { rel: 1e-12 }, 'GM before');
      assertClose(outputs.gm_after_m, 3.75 + 60000 / 12 / 4500 - 4, { rel: 1e-12 }, 'GM after');
      assertClose(outputs.trim_m, 0, { abs: 1e-12 }, 'no trim');
    },
  },
  {
    name: 'Permeability 0.5 halves the flooded volume: sinkage 0.5 × 15 × 10 × 6 / (750 − 75) = 0.667 m',
    source: 'Lost volume μ l b d over the intact waterplane L B − μ l b',
    run: () => {
      const { outputs } = calculate({ ...MIDSHIP, permeability: 0.5 });
      assertClose(outputs.lost_volume_m3, 450, { rel: 1e-12 }, 'lost volume');
      assertClose(outputs.sinkage_m, 450 / 675, { rel: 1e-12 }, 'sinkage');
    },
  },
  {
    name: 'End compartment: 10 m at the bow of a 100 m × 10 m box at 5 m draft gives tan τ = 0.04115 and drafts 7.82 m forward, 3.70 m aft — the same as trimming the intact 90 m box until its buoyancy is under G',
    source: 'Lost buoyancy moment v(x − x_F)/I_L\'; independent check by the trimmed-box geometry (LCB shift = t L\'/(12 T_m))',
    run: () => {
      const { outputs } = calculate({ length_m: 100, beam_m: 10, depth_m: 10, draft_m: 5, kg_m: 3, comp_length_m: 10, comp_breadth_m: 10, comp_position_m: 45, permeability: 1 });
      const tm = 5000 / 900;
      const tanTau = (5 * 12 * tm) / (90 * 90);
      assertClose(outputs.trim_m / 100, tanTau, { rel: 1e-9 }, 'trim angle');
      assertClose(outputs.lcf_shift_m, -5, { rel: 1e-12 }, 'centre of flotation 5 m aft');
      assertClose(outputs.draft_fwd_m, tm + tanTau * 55, { rel: 1e-9 }, 'forward draft');
      assertClose(outputs.draft_aft_m, tm - tanTau * 45, { rel: 1e-9 }, 'after draft');
      assertClose(outputs.draft_fwd_m, 7.82, { abs: 0.005 }, 'forward value');
    },
  },
  {
    name: 'Part-breadth compartment: a 6 m wide centre compartment keeps more waterplane inertia: I = 75 × 10³/12 − 15 × 6³/12 = 5980 m⁴, BM = 1.329 m',
    source: 'Transverse inertia of the intact waterplane (centred lost area)',
    run: () => {
      const { outputs } = calculate({ ...MIDSHIP, comp_breadth_m: 6 });
      assertClose(outputs.bm_after_m, 5980 / 4500, { rel: 1e-12 }, 'BM');
    },
  },
  {
    name: 'Sinking: a 60 m compartment in a 100 m box at 6 m draft with 8 m depth floods over the deck and is reported',
    source: 'Final draft ≥ depth means loss of the vessel',
    run: () => {
      const { outputs } = calculate({ length_m: 100, beam_m: 16, depth_m: 8, draft_m: 6, kg_m: 5, comp_length_m: 60, comp_breadth_m: 16, comp_position_m: 0, permeability: 0.95 });
      assertEqual(outputs.min_freeboard_m <= 0, true, 'no freeboard');
      assertEqual(outputs.status.startsWith('SINKS'), true, 'status');
    },
  },
  {
    name: 'Invalid inputs fail fast: a compartment longer than the vessel, a position beyond the end, permeability above 1',
    source: 'Validation contract (README, "Conventions")',
    run: () => {
      assertThrows(() => calculate({ comp_length_m: 120 }), 'must be between', 'length');
      assertThrows(() => calculate({ comp_position_m: 49 }), 'must be between', 'position');
      assertThrows(() => calculate({ permeability: 1.2 }), 'must be between', 'permeability');
    },
  },
];
