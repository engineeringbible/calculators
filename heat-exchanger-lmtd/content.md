# Heat exchanger LMTD calculator

**Summary:** LMTD for counter, parallel and 1-2 shell-and-tube flow, duty from either stream, F correction, fouling and required area from U.

## Introduction

The log-mean temperature difference method answers the sizing question for any two-fluid heat exchanger: given the four terminal temperatures, how much heat is exchanged and how much surface is needed for a given overall heat transfer coefficient. This calculator computes the LMTD for counterflow and parallel flow, the Bowman correction factor F for a one-shell-pass shell-and-tube unit with an even number of tube passes, the duty from either stream's mass flow and specific heat (or taken directly), the service U after fouling, and the required area. It also reports effectiveness, NTU and capacity ratio, which follow from the temperatures alone and link to the ε-NTU method.

Marine engineers use it for lube-oil and jacket-water coolers, fuel heaters and central coolers; process and HVAC engineers for any shell-and-tube or plate exchanger pre-sizing; students for the standard heat transfer course problems.

## Formulas

Heat duty (energy balance on either stream):

    Q = ṁ_h c_p,h (T_h,in − T_h,out) = ṁ_c c_p,c (T_c,out − T_c,in)

- ṁ — mass flow, kg/s; c_p — specific heat, J/(kg·K); T — terminal temperatures, °C

Log-mean temperature difference:

    LMTD = (ΔT₁ − ΔT₂) / ln(ΔT₁/ΔT₂)       (LMTD = ΔT₁ when ΔT₁ = ΔT₂)
    Counterflow: ΔT₁ = T_h,in − T_c,out,  ΔT₂ = T_h,out − T_c,in
    Parallel:    ΔT₁ = T_h,in − T_c,in,   ΔT₂ = T_h,out − T_c,out

Correction factor for one shell pass, 2/4/6… tube passes (Bowman, Mueller and Nagle 1940), applied to the counterflow LMTD:

    R = (T_h,in − T_h,out) / (T_c,out − T_c,in),   P = (T_c,out − T_c,in) / (T_h,in − T_c,in)
    F = √(R²+1) ln[(1−P)/(1−RP)] / { (R−1) ln[ (2 − P(R+1−√(R²+1))) / (2 − P(R+1+√(R²+1))) ] }
    R = 1:  F = P√2 / { (1−P) ln[ (2 − P(2−√2)) / (2 − P(2+√2)) ] }

Area and fouling:

    1/U_service = 1/U_clean + R_f
    A = Q / (U_service × F × LMTD)

- U — overall heat transfer coefficient, W/(m²·K); R_f — total fouling resistance, m²·K/W

Effectiveness, NTU and capacity ratio (from the temperatures alone):

    ε = max(ΔT_h, ΔT_c) / (T_h,in − T_c,in)
    NTU = U A / C_min = max(ΔT_h, ΔT_c) / (F × LMTD)
    C_r = min(ΔT_h, ΔT_c) / max(ΔT_h, ΔT_c)

## Assumptions and limitations

- Steady state, no heat loss to the surroundings, constant specific heats and constant U along the exchanger. For large temperature ranges or condensing/boiling, split the exchanger into zones.
- The LMTD method needs all four temperatures. When only inlets are known (rating an existing exchanger), use the ε-NTU method; the ε, NTU and C_r outputs here are the bridge.
- The F factor is the Bowman analytical result for one shell pass with any even number of tube passes. Two or more shell passes in series, cross-flow and plate exchangers have different F curves; for plate exchangers F is close to 1 in pure counterflow arrangement.
- F below about 0.75 means the design sits on the steep part of the curve and small temperature changes cause large area changes; add shell passes or use counterflow.
- Fouling resistances are the TEMA design values; actual fouling depends on velocity, temperature and cleaning schedule. Fouling on each side should be referred to the same area basis as U.
- U values in the help text are order-of-magnitude ranges for pre-sizing; a real design computes U from the film coefficients, wall resistance and fin efficiency.

## Worked example

Incropera, Example 11.1. A counterflow concentric-tube cooler takes lubricating oil from 100 °C to 60 °C at 0.1 kg/s (c_p = 2 131 J/(kg·K)); cooling water at 0.2 kg/s enters at 30 °C. U = 38.1 W/(m²·K) based on the 25 mm inner tube.

1. Duty: 0.1 × 2 131 × (100 − 60) = 8 524 W.
2. Water outlet: 30 + 8 524 / (0.2 × 4 178) = 40.2 °C.
3. Terminal differences, counterflow: ΔT₁ = 100 − 40.2 = 59.8 K, ΔT₂ = 60 − 30 = 30 K.
4. LMTD: (59.8 − 30) / ln(59.8/30) = 43.2 K.
5. Area: 8 524 / (38.1 × 43.2) = 5.18 m²; as a 25 mm tube that is 5.18 / (π × 0.025) = 65.9 m, Incropera's answer.
6. Effectiveness: oil has the smaller capacity rate; ε = 40 / 70 = 0.571; NTU = 40 / 43.2 = 0.93; C_r = 10.2 / 40 = 0.255.

In parallel flow the same temperatures give LMTD = 39.75 K and about 9 % more area. In a 1-2 shell-and-tube with the water heated to 60 °C instead (R = 1, P = 0.5), F = 0.80 and the effective difference drops from 40 K to 32 K.

## FAQ

**Counterflow or parallel flow — which needs less area?**
Counterflow, always, for the same four temperatures. It is also the only simple arrangement that can heat the cold fluid above the hot outlet temperature (a temperature cross).

**When do I need the F correction?**
Whenever the flow is not purely counter or parallel: multi-pass shell-and-tube, cross-flow, and most compact exchangers. F multiplies the counterflow LMTD and is always ≤ 1.

**My F comes out undefined or the calculator says the cross is not achievable.**
A single shell pass cannot deliver that combination of temperatures no matter how large the area. Use two shell passes in series (or a counterflow plate exchanger), or relax the cold outlet temperature.

**What U value should I use?**
Pre-sizing ranges: water-to-water 800–1 500, oil-to-water 100–350, gas-to-liquid 20–60, condensing steam to water 1 500–4 000 W/(m²·K). Plate exchangers reach 3 000–7 000 for water-to-water. Confirm with the vendor's thermal design.

**How do fouling factors change the result?**
They add a resistance in series with 1/U. With U = 1 000 and R_f = 0.0005 m²·K/W, the service U is 667 and the area 50 % larger. TEMA per-side values: treated cooling water 0.00018, sea water 0.00009, fuel oil 0.0009, lube oil 0.00018 m²·K/W.

**Why does the calculator compute effectiveness when I gave four temperatures?**
Because the same four temperatures define ε, NTU and C_r, and seeing them tells you how hard the exchanger is working: ε above 0.8 or NTU above 3 means diminishing returns on extra area.

**Can I use this for a plate heat exchanger?**
Yes, in counterflow with F = 1 for single-pass arrangements. Use the manufacturer's U, which is much higher than for shell-and-tube.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — tube-side and shell-side nozzle losses.
- [Pump and fan affinity laws](../pump-affinity/index.html) — cooling-water flow changes that move the duty.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — tube bundle expansion between the two fluid temperatures.
- [Engineering unit converter](../unit-converter/index.html) — Btu/(h·ft²·°F), °F, kJ/(kg·K).
