/**
 * compressed-air/tests.js — checks against the published leakage table (DOE tip sheet / "Discharge of air through an
 * orifice"), the CAGI leak cost figures, the MEASUR receiver formula, the BCAS/Atlas Copco pipe formula and hand
 * calculations of compressor work.
 * Run: node run-tests.js compressed-air
 */
import { calculate, orificeMassFlow } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const IN = 0.0254;
const PSI = 6894.757293168;
const CFM = 0.028316846592 / 60;
const STD = { p_atm_pa: 101325, t_air_c: 20 };
const leak = (d, psig, more = {}) => calculate({ ...STD, task: 'leak', hole_d_m: d * IN, p_line_pa: psig * PSI, cd_leak: 1, ...more }).outputs;

export const tests = [
  {
    name: 'Leakage table at coefficient 1: 100 psig 1/16 in 6.49, 1/4 in 104, 3/8 in 234 cfm; 15 psig 1/4 in 26.9 cfm; 50 psig 1/64 in 0.229 cfm',
    source: 'US DOE Compressed Air Tip Sheet #3 leakage table; "Discharge of air through an orifice" table (Burton Companies)',
    run: () => {
      assertClose(leak(1 / 16, 100).leak_flow_m3s / CFM, 6.49, { rel: 0.003 }, '1/16 in at 100 psig');
      assertClose(leak(1 / 4, 100).leak_flow_m3s / CFM, 104, { rel: 0.003 }, '1/4 in at 100 psig');
      assertClose(leak(3 / 8, 100).leak_flow_m3s / CFM, 234, { rel: 0.003 }, '3/8 in at 100 psig');
      assertClose(leak(1 / 4, 15).leak_flow_m3s / CFM, 26.9, { rel: 0.003 }, '1/4 in at 15 psig');
      assertClose(leak(1 / 64, 50).leak_flow_m3s / CFM, 0.229, { rel: 0.005 }, '1/64 in at 50 psig');
      assertClose(leak(1 / 4, 100, { cd_leak: 0.61 }).leak_flow_m3s / CFM, 0.61 * 104.03, { rel: 0.001 }, 'sharp-edged × 0.61');
    },
  },
  {
    name: 'Leak cost at 0.10 per kWh, constant operation: 1/16 in 1 046, 1/8 in 4 190, 1/4 in 16 764 a year (18.4 kW per 100 cfm)',
    source: 'CAGI / Compressed Air Challenge Fact Sheet #7, "The cost of leaks" (rev. May 2026)',
    run: () => {
      const more = { spec_power: 18.4, hours: 8760, price_kwh: 0.1 };
      assertClose(leak(1 / 16, 100, more).leak_cost, 1046, { rel: 0.003 }, '1/16 in');
      assertClose(leak(1 / 8, 100, more).leak_cost, 4190, { rel: 0.003 }, '1/8 in');
      assertClose(leak(1 / 4, 100, more).leak_cost, 16764, { rel: 0.003 }, '1/4 in');
      assertClose(leak(1 / 4, 100, { ...more, n_leaks: 10 }).leak_cost, 10 * leak(1 / 4, 100, more).leak_cost, { rel: 1e-12 }, 'ten leaks');
    },
  },
  {
    name: 'Subsonic leak at 5 psig follows the isentropic nozzle equation and is below the choked value',
    source: 'F. M. White, Fluid Mechanics, Ch. 9 (isentropic flow through a nozzle); hand calculation',
    run: () => {
      const o = leak(1 / 8, 5);
      const p0 = 5 * PSI + 101325;
      const r = 101325 / p0;
      const area = (Math.PI / 4) * (IN / 8) ** 2;
      const m = area * p0 * Math.sqrt((2 * 1.4 / (0.4 * 287.05 * 293.15)) * (r ** (2 / 1.4) - r ** (2.4 / 1.4)));
      assertClose(o.leak_mass_kg_s, m, { rel: 1e-9 }, 'subsonic mass flow');
      assertEqual(o.leak_regime.startsWith('Subsonic'), true, 'regime');
      const choked = area * p0 * Math.sqrt(1.4 / (287.05 * 293.15)) * (2 / 2.4) ** 3;
      assertEqual(orificeMassFlow(1, area, p0, 293.15, 101325) < choked, true, 'below choked');
    },
  },
  {
    name: 'Receiver: 100 cfm for 1 min, 100 to 90 psig at 14.7 psia needs 147 ft³ = 1 099 US gal; with a 40 cfm metered supply 660 gal',
    source: 'US DOE / ORNL MEASUR Receiver Tank Calculator, dedicated and metered storage methods; hand calculation',
    run: () => {
      const base = { task: 'receiver', flow_m3s: 100 * CFM, event_s: 60, p_line_pa: 100 * PSI, p_min_pa: 90 * PSI, p_atm_pa: 14.696 * PSI };
      const a = calculate(base).outputs;
      assertClose(a.receiver_m3 / 0.028316846592, 146.96, { abs: 0.01 }, 'ft³');
      assertClose(a.receiver_m3 / 0.003785411784, 1099.3, { abs: 0.1 }, 'gal');
      const b = calculate({ ...base, supply_m3s: 40 * CFM }).outputs;
      assertClose(b.receiver_m3 / 0.003785411784, 659.6, { abs: 0.1 }, 'metered');
    },
  },
  {
    name: 'Air main: 100 L/s free air, 59 m of 53 mm bore at 7 bar g gives 0.040 bar by the BCAS/Atlas Copco formula; Darcy within 10 %',
    source: 'BCAS simplified equation PD = 1.6 × 10⁸ L Q^1.85 / (P d⁵) (pocketEngineer worked example data); Atlas Copco d⁵ = 450 qc^1.85 l/(Δp p)',
    run: () => {
      const o = calculate({ task: 'pipe', flow_m3s: 0.1, pipe_l_m: 59, pipe_d_m: 0.053, p_line_pa: 7e5, p_atm_pa: 101325, t_air_c: 20 }).outputs;
      assertClose(o.dp_empirical_pa / 1e5, 1.6e8 * 59 * 0.1 ** 1.85 / (53 ** 5 * 8.01325), { rel: 0.003 }, 'BCAS vs Atlas constant');
      assertClose(o.dp_empirical_pa / 1e5, 0.0397, { abs: 0.0001 }, 'Δp bar');
      assertClose(o.dp_darcy_pa / o.dp_empirical_pa, 1, { abs: 0.1 }, 'Darcy agrees');
    },
  },
  {
    name: 'Compressor work for 100 cfm free air to 100 psig: isothermal 9.83 kW, one-stage adiabatic 13.37 kW, two stages 11.42 kW',
    source: 'Çengel & Boles, Thermodynamics, Ch. 7: W = p1V1 ln r and n γ/(γ−1) p1V1 (r^((γ−1)/nγ) − 1); hand calculation',
    run: () => {
      const base = { task: 'power', flow_m3s: 100 * CFM, p_line_pa: 100 * PSI, p_atm_pa: 101325, t_air_c: 20, eta_isen: 0.75, eta_motor: 0.93 };
      const a = calculate({ ...base, stages: 1 }).outputs;
      const p1v1 = 101325 * 100 * CFM;
      const r = (100 * PSI + 101325) / 101325;
      assertClose(a.w_iso_w, p1v1 * Math.log(r), { rel: 1e-12 }, 'isothermal');
      assertClose(a.w_ad_w / 1000, 13.37, { abs: 0.01 }, 'adiabatic');
      assertClose(a.shaft_w, a.w_ad_w / 0.75, { rel: 1e-12 }, 'shaft');
      assertClose(a.t_discharge_c, 293.15 * r ** (0.4 / 1.4) - 273.15, { rel: 1e-12 }, 'discharge temperature');
      const b = calculate({ ...base, stages: 2 }).outputs;
      assertClose(b.w_ad_w / 1000, 11.42, { abs: 0.01 }, 'two stages');
      assertEqual(b.w_ad_w > a.w_iso_w, true, 'still above isothermal');
    },
  },
  {
    name: 'Invalid input: a minimum pressure above the line pressure, a supply above the demand and a choked pipe are rejected',
    source: 'Validation contract',
    run: () => {
      assertThrows(() => calculate({ task: 'receiver', p_min_pa: 120 * PSI }), 'Lowest acceptable pressure');
      assertThrows(() => calculate({ task: 'receiver', supply_m3s: 200 * CFM }), 'Supply during the event');
      assertThrows(() => calculate({ task: 'pipe', flow_m3s: 1, pipe_d_m: 0.005, pipe_l_m: 100 }), 'far too small');
      assertThrows(() => calculate({ task: 'leak', hole_d_m: 0 }), 'Leak hole diameter');
    },
  },
];
