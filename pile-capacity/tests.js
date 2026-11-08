/**
 * pile-capacity/tests.js — checks against API RP 2GEO, O'Neill & Reese (1999) and hand integration.
 * Run: node run-tests.js pile-capacity
 */
import { calculate, pileCapacity, parseLayers, API_SAND, densityFromN } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

export const tests = [
  {
    name: 'API α: ψ = 0.25 gives α = 1.0 (cap), ψ = 1 gives 0.5, ψ = 4 gives 0.354; a uniform clay with s_u = σ\'v has f = 0.5 s_u',
    source: 'API RP 2GEO (2011) 8.1: α = 0.5 ψ^−0.5 for ψ ≤ 1, 0.5 ψ^−0.25 for ψ > 1, α ≤ 1',
    run: () => {
      // one clay layer with s_u = 10 kPa and γ' = 10 kN/m³ below 1 m depth: ψ = 1/z
      const layers = parseLayers('1; clay; 10; 10\n20; clay; 10; 10', 'si');
      const r = pileCapacity(layers, { install: 'driven', shape: 'square', D: 0.25, L: 4 });
      // layer 2 from 1 to 4 m: σ'v = 10 z ≥ s_u so ψ = 1/z ≤ 1, α = 0.5 √z capped at 1 beyond z = 4: f = 5 √z
      assertClose(r.parts[1].perMetre, 5 * (2 / 3) * (4 ** 1.5 - 1), { rel: 1e-5 }, 'ψ ≤ 1 branch');
      // layer 1 from 0 to 1 m: ψ = 1/z ≥ 1, α = 0.5 z^0.25: f = 5 z^0.25, ∫ = 5/1.25 = 4
      assertClose(r.parts[0].perMetre, 4, { rel: 1e-4 }, 'ψ > 1 branch (midpoint rule near z = 0)');
      assertClose(0.5 * 4 ** -0.25, 0.35355, { abs: 1e-5 }, 'ψ = 4');
    },
  },
  {
    name: 'API Table 1: dense sand β 0.46, f_lim 96 kPa, N_q 40, q_lim 10 MPa; N60 35 is dense, 20 medium dense, 60 very dense; loose sand is refused for driven piles',
    source: 'API RP 2GEO (2011) Table 1; Terzaghi, Peck and Mesri (1996) relative density by SPT N',
    run: () => {
      assertEqual(JSON.stringify(API_SAND['sand:dense']), JSON.stringify({ beta: 0.46, flim: 96, nq: 40, qlim: 10000 }), 'dense sand');
      assertEqual(API_SAND['silt:medium dense'].nq, 12, 'sand-silt');
      assertEqual(densityFromN(35), 'dense', 'N 35');
      assertEqual(densityFromN(20), 'medium dense', 'N 20');
      assertEqual(densityFromN(60), 'very dense', 'N 60');
      assertThrows(() => calculate({ layers: '30; sand; 8; 10' }), 'no design values');
      // the friction limit governs deep in sand: very dense, γ' 10, f = 0.56 σ'v reaches 115 kPa at 20.5 m
      const r = pileCapacity(parseLayers('40; sand; very dense; 10', 'si'), { install: 'driven', shape: 'circle', D: 1, L: 30 });
      const zc = 115 / 5.6;
      assertClose(r.parts[0].perMetre, 0.56 * 10 * zc * zc / 2 + 115 * (30 - zc), { rel: 1e-5 }, 'f_lim');
      assertClose(r.qb, 12000, { abs: 1e-9 }, 'q_lim');
    },
  },
  {
    name: 'Worked example, driven 610 mm pipe pile, 20 m: shaft 100.97 + 332.67 + 414.0 = 847.6 kN/m × π × 0.61 = 1 624 kN; tip 40 × 180 = 7 200 kPa × 0.2922 m² = 2 104 kN',
    source: 'Hand integration of the API α and β formulas over each layer (closed-form integrals of z^0.25 and z^0.5 terms)',
    run: () => {
      const o = calculate({}).outputs;
      const perim = Math.PI * 0.61;
      const expected = 100.969 + (40 / 9) * 64 * (1 - 0.6 ** 1.25) + (40 / 9) * (80 / 1.5) * (1.5 ** 1.5 - 1) + 0.46 * 150 * 6;
      assertClose(o.qs_n / 1000, expected * perim, { rel: 2e-5 }, 'Q_s');
      assertClose(o.q_tip_pa / 1000, 7200, { abs: 1e-6 }, 'q tip');
      assertClose(o.qb_n / 1000, 7200 * Math.PI * 0.61 ** 2 / 4, { rel: 1e-12 }, 'Q_b');
      assertClose(o.qall_n, o.qult_n / 2.5, { rel: 1e-12 }, 'FS');
    },
  },
  {
    name: 'Bored pile in clay (s_u 60 kPa, D 1 m, L 15 m): f = 0.55 × 60 = 33 kPa over 1.5–14 m = 1 296 kN; N_c = 9, base 540 kPa × 0.785 = 424 kN',
    source: 'O\'Neill & Reese (1999) FHWA-IF-99-025: α = 0.55, top 1.5 m and bottom D excluded, N_c = 6 (1 + 0.2 L/D) ≤ 9',
    run: () => {
      const o = calculate({ install: 'bored', diameter_m: 1, length_m: 15, layers: '20; clay; 60; 8' });
      assertClose(o.outputs.qs_n / 1000, 33 * 12.5 * Math.PI, { rel: 1e-4 }, 'Q_s');
      assertClose(o.outputs.qb_n / 1000, 540 * Math.PI / 4, { rel: 1e-12 }, 'Q_b');
      assertEqual(o.warnings.length > 0, true, 's_u below 96 kPa');
      // a short shaft L/D = 1 has N_c = 6 × 1.2 = 7.2
      assertClose(calculate({ install: 'bored', diameter_m: 1.5, length_m: 1.5, layers: '20; clay; 100; 8' }).outputs.q_tip_pa / 1000, 720, { rel: 1e-12 }, 'N_c 7.2');
    },
  },
  {
    name: 'Bored pile in sand (N60 30, γ\' 10, D 1 m, L 10 m): β = 1.5 − 0.245 √z ≤ 1.2, f = β σ\'v integrated by hand; base 57.5 × 30 = 1 725 kPa; N60 10 scales β by 10/15',
    source: 'O\'Neill & Reese (1999): β method for cohesionless soil and q_b = 0.6 N60 tsf (57.5 N60 kPa) ≤ 30 tsf',
    run: () => {
      const a = (0.3 / 0.245) ** 2;
      const hand = 12 * a * a / 2 + (15 / 2) * (100 - a * a) - 2.45 * (2 / 5) * (10 ** 2.5 - a ** 2.5);
      const r = pileCapacity(parseLayers('20; sand; 30; 10', 'si'), { install: 'bored', shape: 'circle', D: 1, L: 10 });
      assertClose(r.parts[0].perMetre, hand, { rel: 1e-5 }, 'shaft');
      assertClose(r.qb, 1725, { abs: 1e-9 }, 'base');
      const r10 = pileCapacity(parseLayers('20; sand; 10; 10', 'si'), { install: 'bored', shape: 'circle', D: 1, L: 10 });
      assertClose(r10.parts[0].perMetre, hand * 10 / 15, { rel: 1e-5 }, 'N60 < 15');
    },
  },
  {
    name: 'US units give the same capacity as SI; layers ending above the tip, bad lines, stiff clay for bored piles and a word for N60 in bored sand are refused',
    source: 'Unit definitions (ft 0.3048 m, psf 0.04788 kPa, pcf 0.1571 kN/m³); validation contract',
    run: () => {
      const si = calculate({ layers: '30; clay; 50; 8', length_m: 15 }).outputs.qult_n;
      const us = calculate({ units: 'us', layers: `${30 / 0.3048}; clay; ${50 / 0.04788025898}; ${8 / 0.157087463}`, length_m: 15 }).outputs.qult_n;
      assertClose(us, si, { rel: 1e-6 }, 'units');
      assertThrows(() => calculate({ length_m: 30 }), 'above the pile tip');
      assertThrows(() => calculate({ layers: '6; rock; 40; 8' }), 'line 1');
      assertThrows(() => calculate({ install: 'bored', layers: '30; clay; 300; 9' }), 'intermediate geomaterial');
      assertThrows(() => calculate({ install: 'bored', layers: '30; sand; dense; 10' }), 'N60');
    },
  },
];
