# Heat exchanger effectiveness–NTU calculator

**Summary:** Effectiveness, NTU, duty and both outlet temperatures of a heat exchanger from UA and the inlet conditions: counter, parallel, shell-and-tube, cross-flow.

## Introduction

The effectiveness–NTU method predicts how much heat an existing exchanger transfers when you know only the inlet temperatures. The effectiveness ε is the actual duty divided by the largest duty the two streams could exchange, C_min (T_h,in − T_c,in). It depends only on the number of transfer units, NTU = UA / C_min, the capacity ratio C_r and the flow arrangement. An oil cooler with UA = 197 W/K, oil at 100 °C and cooling water at 30 °C transfers 8.52 kW in counterflow, an effectiveness of 57 %.

This calculator gives C_min, C_r, NTU, the effectiveness, the duty and both outlet temperatures for counterflow, parallel flow, shell-and-tube, three cross-flow arrangements and condensing or boiling streams. It is for engineers rating an exchanger at new flow rates or temperatures, and for students working the relations of Incropera Table 11.3.

## Formulas

Heat capacity rates, NTU and the duty:

    C_h = ṁ_h c_p,h,   C_c = ṁ_c c_p,c,   C_r = C_min / C_max
    NTU = U A / C_min
    q = ε C_min (T_h,in − T_c,in)
    T_h,out = T_h,in − q / C_h,   T_c,out = T_c,in + q / C_c

Effectiveness (Incropera, Table 11.3):

    Parallel:      ε = [1 − exp(−NTU (1 + C_r))] / (1 + C_r)
    Counterflow:   ε = [1 − exp(−NTU (1 − C_r))] / [1 − C_r exp(−NTU (1 − C_r))],   ε = NTU / (1 + NTU) at C_r = 1
    One shell:     ε₁ = 2 {1 + C_r + √(1 + C_r²) [1 + exp(−NTU₁ √(1 + C_r²))] / [1 − exp(−NTU₁ √(1 + C_r²))]}⁻¹
    n shells:      ε = [((1 − ε₁ C_r)/(1 − ε₁))ⁿ − 1] / [((1 − ε₁ C_r)/(1 − ε₁))ⁿ − C_r],   NTU₁ = NTU / n
    Cross, both unmixed:   ε ≈ 1 − exp{(1/C_r) NTU^0.22 [exp(−C_r NTU^0.78) − 1]}
    Cross, C_max mixed:    ε = (1/C_r) {1 − exp[−C_r (1 − exp(−NTU))]}
    Cross, C_min mixed:    ε = 1 − exp{−(1/C_r) [1 − exp(−C_r NTU)]}
    Any, C_r = 0:          ε = 1 − exp(−NTU)

- ṁ — mass flow; c_p — specific heat; U — overall heat transfer coefficient; A — area
- C_min, C_max — the smaller and larger of C_h and C_c
- n — number of shell passes, each with 2, 4 or more tube passes

## Assumptions and limitations

- The exchanger runs steadily, loses no heat to the surroundings, and has constant specific heats and a uniform U. Large property changes call for splitting it into zones.
- The cross-flow relation with both fluids unmixed is an approximation. It is within 4 % of the exact series from NTU 0.25 to 5 and is exact as C_r approaches zero.
- A condensing or boiling stream stays at its inlet temperature, so C_r = 0. Superheat and subcooling zones are not included.
- U must already include fouling, wall resistance and fin efficiency. Enter a service value rather than a clean one when sizing for the long term.
- For the mixed cross-flow cases, choose which fluid is mixed. The calculator then picks the C_max mixed or C_min mixed relation from the flow rates.

## Worked example

Incropera Example 11.1 is a counterflow oil cooler. Oil flows at 0.1 kg/s with c_p = 2 131 J/(kg·K) and enters at 100 °C. Water flows at 0.2 kg/s with c_p = 4 178 J/(kg·K) and enters at 30 °C. U = 38.1 W/(m²·K) on an area of 5.176 m². What are the duty and the outlet temperatures?

1. Capacity rates: C_h = 0.1 × 2 131 = 213.1 W/K and C_c = 0.2 × 4 178 = 835.6 W/K, so the oil is C_min.
2. C_r = 213.1 / 835.6 = 0.255.
3. UA = 38.1 × 5.176 = 197.2 W/K, so NTU = 197.2 / 213.1 = 0.925.
4. Counterflow: ε = (1 − e^−0.689) / (1 − 0.255 e^−0.689) = 0.571.
5. q = 0.571 × 213.1 × (100 − 30) = 8.52 kW.
6. Oil out: 100 − 8 521 / 213.1 = 60.0 °C. Water out: 30 + 8 521 / 835.6 = 40.2 °C.

These are the temperatures the example started from, so the LMTD method gives the same exchanger. With the same UA, one shell pass would transfer 8.34 kW and parallel flow 8.17 kW.

## FAQ

**When should I use ε-NTU instead of LMTD?**
Use ε-NTU to rate an exchanger when only the inlet temperatures are known. LMTD needs all four temperatures, so it suits sizing an exchanger for a set duty.

**What does NTU mean physically?**
It compares the exchanger's conductance UA with the smaller capacity rate. A large NTU means a large exchanger for the flow, and the effectiveness approaches its upper limit.

**How much area does a higher effectiveness need?**
The area rises steeply near the top. A counterflow exchanger with C_r = 0.5 needs NTU 2.2 for 80 %, 3.4 for 90 % and 4.7 for 95 %.

**Why can parallel flow never reach 100 %?**
Both streams leave at nearly the same temperature, which caps the effectiveness at 1/(1 + C_r). For equal capacity rates that is 50 %.

**What is C_r = 0?**
A stream that condenses or boils keeps a constant temperature, so its capacity rate is infinite. Then every arrangement gives ε = 1 − e^−NTU.

**What does mixed and unmixed mean in cross-flow?**
A mixed fluid can move across the flow passage and evens out its temperature, like air over a bare tube bank. An unmixed fluid is held in separate channels, like air between plate fins.

## Related calculators

- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — the sizing method from four temperatures.
- [Heat transfer calculator](../heat-transfer/index.html) — conduction, convection and U-values.
- [Specific heat calculator](../specific-heat/index.html) — the heat to warm a fluid.
- [Pipe insulation](../pipe-insulation/index.html) — heat loss from the pipes in between.
