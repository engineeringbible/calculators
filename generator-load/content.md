# Generator load, kVA and fuel calculator

**Summary:** Load factor, kVA, current and N−1 redundancy of parallel diesel generators, the recommended number of sets for a load band, and fuel, cost and CO₂ from SFOC.

## Introduction

How many generators should run? Too few and a trip blacks out the ship or overloads the survivor; too many and each runs at a low load where it fouls, wet-stacks and burns more fuel per kilowatt-hour. This calculator takes the running sets, their rating and the electrical load and reports the load factor on the engine (kW) and on the alternator (kVA), the line current, whether the plant survives the loss of one set, how many sets keep each within a recommended load band, and the fuel, cost and CO₂ over the operating hours using the specific fuel consumption corrected for part load.

It is for chief engineers and electro-technical officers managing the power plant, superintendents reviewing generator running hours and fuel, and students learning power-plant load management.

## Formulas

Ratings and load:

    P_set = S_rated × pf_rated                 rated kW of one set
    P_installed = n × P_set
    S_load = P_load / pf_load,    I = S_load / (√3 V)
    load % (kW)  = P_load / P_installed,    load % (kVA) = S_load / (n S_rated)

Redundancy and set count:

    N−1 load % = P_load / ((n − 1) P_set)
    n_recommended = ceil( P_load / (band_max × P_set) )

Fuel, cost and emissions:

    SFOC(load) = SFOC₁₀₀ × f(load)      f: 1.00 at 100 %, 1.02 at 75 %, 1.10 at 50 %, 1.27 at 25 %, linear between
    fuel/h = P_load × SFOC(load)
    fuel over the period = fuel/h × hours,    cost = fuel × price,    CO₂ = fuel × C_F

- S_rated — kVA rating of each set; pf_rated — alternator rated power factor (0.8); C_F — IMO carbon factor of the fuel

## Assumptions and limitations

- Identical sets sharing active load equally; reactive sharing, droop differences and mixed set sizes are not modelled.
- The load band (default 30–85 %) is operating policy: below about 30 % medium-speed diesels suffer fouling and wet stacking, above 85–90 % there is no margin for motor starts and bow-thruster transients. ISO 8528-1 prime rating permits 110 % for one hour in twelve.
- The N−1 check is a steady-state kW comparison; real plants rely on preferential tripping of non-essential consumers and automatic start of the standby set, and the transient behaviour needs its own study.
- SFOC is per electrical kWh at 100 % load, scaled with a typical medium-speed part-load curve; engine project guides quote brake kWh (divide by the alternator efficiency, about 0.96) and real shop-test curves should replace the typical one.
- SFOC refers to the reference fuel of 42 700 kJ/kg; a lower-calorific fuel burns proportionally more tonnes.
- CO₂ uses the IMO MEPC.364(79) carbon factors; the result feeds the CII estimator for the auxiliary share.

## Worked example

Two 1 000 kVA, 0.8 pf, 440 V sets run in parallel with an electrical load of 1 200 kW at power factor 0.85. SFOC at 100 % load 210 g/kWh (electrical), MGO at 700 $/t, 24 h.

1. Installed: 2 × 800 = 1 600 kW. Load factor 1 200 / 1 600 = 75 % on the engines; the alternators see 1 200 / 0.85 = 1 412 kVA, 70.6 % of 2 000 kVA. Line current 1 412 000 / (√3 × 440) = 1 852 A. Within the 30–85 % band.
2. N−1: if one set trips, the survivor faces 1 200 / 800 = 150 % — far beyond the 110 % one-hour allowance. The preferential trip must shed at least 320 kW immediately, or a third set should be on line when such a loss is unacceptable.
3. Recommended count for the band: ceil(1 200 / (0.85 × 800)) = 2 sets at 75 %, which is what is running; the redundancy question, not the load band, decides whether a third set runs.
4. Fuel: at 75 % the SFOC is 210 × 1.02 = 214 g/kWh → 257 kg/h, 6.17 t/day, 4 318 $/day, 19.8 t CO₂/day, for 28.8 MWh.

Running three sets at 50 % instead would burn 231 g/kWh, 8 % more fuel, but survive any single trip at 75 %.

## FAQ

**Why are there two load percentages?**
The engine is limited by kW, the alternator by kVA. At low power factor the alternator reaches 100 % while the engine still has margin; at high power factor the engine governs.

**What is wet stacking?**
At low load a diesel runs cool, combustion is incomplete, unburnt fuel and soot accumulate in the exhaust and turbocharger, and SFOC rises steeply. Most makers advise against sustained operation below 25–30 % load.

**Should I always keep N−1 redundancy?**
During manoeuvring, in restricted waters and in heavy weather, yes: class and SOLAS require that essential services survive the loss of one generator. At sea in open water many operators accept a single set with the standby on auto-start, trading redundancy for fuel.

**How accurate is the typical SFOC curve?**
Within a few per cent for modern medium-speed gensets at 50–100 % load; worse below. Shop-test curves for the specific engine are always better, and ageing adds 2–5 %.

**Can I size a new plant with this?**
It gives the first-order answer (how many sets of what size keep the load in band with N−1). A real load analysis (electrical load balance for each operating mode) and the transient study for the largest motor start are needed for the design.

**How does this connect to CII?**
The daily CO₂ from the auxiliaries is part of the ship's annual total; feed it, with the main-engine figure, into the CII estimator.

**What about shaft generators or batteries?**
A shaft generator replaces one or more diesel sets at sea; enter the remaining diesel load. Battery hybrid systems that peak-shave are outside this calculator.

## Related calculators

- [Three-phase power and motor current](../three-phase-power/index.html) — the motor loads that make up the total.
- [Fuel consumption and voyage cost](../fuel-voyage-cost/index.html) — main-engine fuel for the same voyage.
- [CII rating estimator](../cii-rating/index.html) — annual CO₂ including the auxiliary share.
- [Battery capacity and runtime](../battery-runtime/index.html) — emergency and hybrid storage.
