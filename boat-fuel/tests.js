/**
 * boat-fuel/tests.js — checks against Q = P × SFC / ρ, the propeller law and the range and cost arithmetic.
 * Run: node run-tests.js boat-fuel
 */
import { calculate } from './calc.js';
import { assertClose, assertEqual, assertThrows } from '../shared/test-runner.js';

const HP = 745.69987158227;

export const tests = [
  {
    name: '200 hp diesel at 70 % power: 104.4 kW × 225 g/kWh = 23.49 kg/h = 27.96 L/h = 7.39 US gal/h',
    source: 'Fuel flow = P × SFC / ρ (Heywood §2.9); SFC 225 g/kWh within the Volvo Penta D4 data (220–232 g/kWh); hand calculation',
    run: () => {
      const o = calculate({ fuel: 'diesel', power_w: 200 * HP, load_basis: 'power', load_frac: 0.7 }).outputs;
      assertClose(o.power_used_w, 104397.98, { abs: 0.1 }, 'power');
      assertClose(o.fuel_kg_s * 3600, 23.4895, { abs: 1e-3 }, 'kg/h');
      assertClose(o.fuel_l_h, 27.9637, { abs: 1e-3 }, 'L/h');
      assertClose(o.fuel_gph, 7.3872, { abs: 1e-3 }, 'gal/h');
    },
  },
  {
    name: 'Range: 400 L with 20 % reserve at 27.96 L/h lasts 11.44 h, 228.9 nmi at 20 kn; 1.80 per litre costs 50.33 per hour',
    source: 'Endurance = usable fuel / flow, range = endurance × speed; hand calculation',
    run: () => {
      const o = calculate({}).outputs;
      assertClose(o.usable_m3, 0.32, { rel: 1e-12 }, 'usable');
      assertClose(o.endurance_s / 3600, 11.4434, { abs: 1e-3 }, 'endurance');
      assertClose(o.range_nmi, 228.868, { abs: 0.01 }, 'range');
      assertClose(o.cost_h, 50.335, { abs: 0.01 }, 'cost per hour');
      assertClose(o.l_per_nmi * o.nmi_per_gal, 3.785411784, { rel: 1e-12 }, 'L/nmi × nmi/gal = L/gal');
    },
  },
  {
    name: 'Propeller law: 80 % of rated rpm is 0.8³ = 51.2 % of rated power',
    source: 'MAN, Basic Principles of Ship Propulsion: P = c n³',
    run: () => {
      const a = calculate({ load_basis: 'rpm', rpm_frac: 0.8 }).outputs;
      const b = calculate({ load_basis: 'power', load_frac: 0.512 }).outputs;
      assertClose(a.fuel_l_h, b.fuel_l_h, { rel: 1e-12 }, 'same flow');
    },
  },
  {
    name: 'Petrol: 150 hp at full power, 300 g/kWh and 0.745 kg/L burns 45.04 L/h (11.90 US gal/h); a 40 nmi trip at 35 kn uses 51.5 L',
    source: 'Fuel flow = P × SFC / ρ; hand calculation',
    run: () => {
      const o = calculate({ fuel: 'petrol', power_w: 150 * HP, load_frac: 1, speed_kn: 35, trip_nmi: 40 }).outputs;
      assertClose(o.fuel_l_h, 45.0423, { abs: 1e-3 }, 'L/h');
      assertClose(o.fuel_gph, 11.8989, { abs: 1e-3 }, 'gal/h');
      assertClose(o.trip_fuel_m3 * 1000, 51.477, { abs: 0.01 }, 'trip');
    },
  },
  {
    name: 'Measured flow of 25 L/h at 8 kn: 3.125 L/nmi; with a 200 L tank and no reserve, 8 h and 64 nmi',
    source: 'Hand calculation',
    run: () => {
      const o = calculate({ basis: 'flow', flow_l_h: 25, speed_kn: 8, tank_m3: 0.2, reserve_frac: 0 }).outputs;
      assertEqual(o.power_used_w, null, 'no power');
      assertClose(o.l_per_nmi, 3.125, { rel: 1e-12 }, 'L/nmi');
      assertClose(o.endurance_s, 8 * 3600, { rel: 1e-12 }, 'endurance');
      assertClose(o.range_nmi, 64, { rel: 1e-12 }, 'range');
    },
  },
  {
    name: 'Light load warns; zero speed gives no range; zero power and an SFC out of range are rejected',
    source: 'Validation contract',
    run: () => {
      assertEqual(calculate({ load_frac: 0.2 }).warnings.length > 0, true, 'light load');
      assertEqual(calculate({ speed_kn: 0 }).outputs.range_nmi, null, 'no range');
      assertThrows(() => calculate({ power_w: 0 }), 'Rated engine power must be greater than zero');
      assertThrows(() => calculate({ fuel: 'custom', sfc_g_kwh: 100 }), 'Specific fuel consumption');
    },
  },
];
