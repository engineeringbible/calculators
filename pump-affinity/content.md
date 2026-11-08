# Pump and fan affinity laws calculator

**Summary:** Flow, head or pressure and power at a new speed or impeller diameter from one known operating point, with efficiency and specific speed.

## Introduction

When a pump or fan runs at a different speed, or its impeller is trimmed, its whole performance curve moves in a predictable way. The affinity laws describe that shift: flow changes in proportion to speed, head with the square, power with the cube. The same laws, with pressure in place of head, are the fan laws. They are the basis of every variable-speed-drive energy saving estimate and of impeller trimming to match a pump to its system.

Engineers use this calculator to size a VFD setting, to estimate the power saved by slowing a cooling-water pump, to check what an impeller trim will do, and to compare pumps through their specific speed. Students use it for the similarity-law exercises in turbomachinery courses.

## Formulas

Speed change for the same machine (N₁ → N₂):

    Q₂ = Q₁ (N₂/N₁)
    H₂ = H₁ (N₂/N₁)²        (fans: Δp₂ = Δp₁ (N₂/N₁)²)
    P₂ = P₁ (N₂/N₁)³

Impeller diameter change, trimming in the same casing (D₁ → D₂):

    Q₂ = Q₁ (D₂/D₁),   H₂ = H₁ (D₂/D₁)²,   P₂ = P₁ (D₂/D₁)³

Geometrically similar machines (complete scaling of the design):

    Q₂ = Q₁ (D₂/D₁)³,  H₂ = H₁ (D₂/D₁)²,   P₂ = P₁ (D₂/D₁)⁵

Combined speed and diameter changes multiply the ratios.

Known-point quantities:

    P_hyd = ρ g Q H           pump hydraulic power, W
    P_hyd = Q Δp              fan air power, W
    η = P_hyd / P_shaft       overall efficiency
    n_q = N √Q / H^0.75       specific speed (N in rpm, Q in m³/s, H in m)

- Q — volume flow, m³/s; H — head, m of liquid; Δp — total pressure rise, Pa; P — shaft power, W
- N — rotational speed, rpm; D — impeller outside diameter, m; ρ — fluid density, kg/m³; g = 9.80665 m/s²

## Assumptions and limitations

- The laws assume the efficiency stays the same at the scaled point. That is a good approximation for speed changes of ±25 % and trims down to about 80–85 % of the full diameter; beyond that, efficiency falls and real curves deviate.
- A speed change moves the operating point along a system curve of the form H ∝ Q² only if the system has no static head. With static head (lifting to a tank, pressurised header) the new duty point must be found from the intersection of the shifted pump curve and the system curve; the laws alone overstate the flow reduction.
- Impeller trimming is not geometric scaling: the casing stays the same, so Q ∝ D rather than D³. Manufacturers often use Q ∝ D and H ∝ D² with a small correction; the actual trimmed curve should come from the pump maker.
- NPSH required rises roughly with the square of speed; check cavitation margin after a speed increase.
- The fan laws assume incompressible flow, fine below about 10 kPa pressure rise. Density changes with temperature shift the pressure and power in proportion to ρ at constant speed.
- Positive-displacement pumps do not follow these laws: their flow is proportional to speed but their pressure is set by the system.

## Worked example

A sea-water cooling pump delivers 200 m³/h at 50 m head with 35 kW shaft power at 1 450 rpm, impeller 250 mm. What happens at 1 750 rpm?

1. Speed ratio: 1 750 / 1 450 = 1.207.
2. Flow: 200 × 1.207 = 241.4 m³/h.
3. Head: 50 × 1.207² = 72.8 m.
4. Power: 35 × 1.207³ = 61.5 kW.
5. Known-point check: hydraulic power = 1 000 × 9.80665 × (200/3600) × 50 = 27.2 kW; efficiency 27.2 / 35 = 77.8 %. Specific speed n_q = 1 450 × √0.0556 / 50^0.75 = 18.2, a radial-flow impeller.

Running the other way, slowing the same pump to 1 160 rpm (ratio 0.8) cuts the flow to 160 m³/h and the power to 35 × 0.512 = 17.9 kW, the saving that a variable-speed drive would deliver on a friction-only system.

## FAQ

**Why is power saving from slowing a pump so large?**
Power follows the cube of speed. A 20 % speed reduction removes almost half the power (0.8³ = 0.51), while flow falls only 20 %. This is why throttling with a valve is so wasteful compared with a speed drive.

**Do the laws apply to my system or only to the pump?**
Only to the pump or fan. The flow you actually get is where the new pump curve meets the system curve. For a pure friction system the two coincide and the laws give the duty point directly; with static head they do not.

**How far can I trim an impeller?**
Most makers allow trims down to about 75–80 % of the maximum diameter. Below that the hydraulic passages no longer match, efficiency drops several points, and the simple Q ∝ D rule becomes unreliable.

**What is specific speed for?**
n_q classifies the impeller shape: roughly 10–30 radial, 30–80 mixed flow, above 80 axial. It tells you whether a given duty suits a centrifugal pump at all and what efficiency to expect.

**Does the fan law work for compressors?**
Not in this simple form. Once the pressure ratio is significant the gas density changes through the machine and compressor similarity rules (corrected speed and flow) are needed.

**Which density do I enter?**
The density of the fluid actually pumped at operating temperature. It only affects the hydraulic power and efficiency outputs; the ratios themselves are independent of density.

**Can I use flow in gpm and head in feet?**
Yes, choose the units on each field. The calculation runs in SI and converts back for display.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — the system resistance the pump must overcome.
- [Shaft torque, power and diameter](../shaft-torque/index.html) — torque behind the new power at the new speed.
- [Three-phase power and motor current](../three-phase-power/index.html) — motor current at the new load.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — cooling duty when the cooling-water flow changes.
