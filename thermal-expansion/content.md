# Thermal expansion and restraint stress calculator

**Summary:** Length change of solids with temperature, the stress and force when expansion is restrained, and the volume change and pressure rise of a liquid trapped in a pipe or tank.

## Introduction

Everything grows when it warms: a 100 m steam line gains more than a decimetre between cold and hot, a deck plate in the sun pushes against its neighbours, and fuel in a tank gains volume while the sounding stays the same. If the expansion is prevented, the material develops stress instead, and the stress is surprisingly large: fully restrained steel builds about 2.4 MPa for every degree, so a 100 K rise alone exceeds the yield strength of ordinary structural steel. Liquids are worse: a completely filled, blocked-in water line rises by several bar per degree.

This calculator covers both cases: linear expansion of a solid member with free, partial or full restraint (thermal stress, anchor force, utilisation against yield), and volumetric expansion of a liquid with the pressure rise if it is confined. It is for piping and structural engineers, marine engineers dealing with heated fuel systems and blocked-in lines, and students meeting thermal stress for the first time.

## Formulas

Linear expansion of a solid:

    ΔL = α L ΔT                       free expansion
    ε_T = α ΔT                        thermal strain
    σ = E (α ΔT − δ / L)              stress when the member may move only δ (δ = 0 fully restrained; σ = 0 when δ ≥ |ΔL|)
    F = σ A                           force on the anchors
    E α                               stress per kelvin for full restraint

Sign: heating a restrained member gives compression (positive here); cooling gives tension (negative).

Volumetric expansion of a liquid:

    ΔV = β V ΔT                       unconfined (vented tank)
    Δp = K (β − 3 α_pipe) ΔT          blocked in, completely filled, rigid walls (3 α_pipe credits the container's own volume growth)
    V_relief = (β − 3 α_pipe) V ΔT    liquid that must escape to hold the pressure

- α — linear expansion coefficient (steel 12, stainless 304 17.3, aluminium 23.1, copper 16.5, PVC 70, HDPE 150 µm/m·K)
- β — volumetric expansion coefficient of the liquid (water 20 °C 0.21, sea water 0.25, diesel 0.83, HFO 0.68, lube oil 0.70 ×10⁻³/K)
- K — bulk modulus of the liquid (water 2.2, oils 1.5–1.6 GPa); E — Young's modulus; A — cross-section area

## Assumptions and limitations

- Mean coefficients over the range; α and β both change with temperature (β of water is zero at 4 °C and triples between 20 and 80 °C). For large ranges use the code or handbook value for the actual interval as a custom input.
- Material presets are typical values for the alloy family; the yield strength for the utilisation is a common grade, not your certificate.
- Rigid anchors and a straight, uniformly heated member. Real supports deflect and reduce the force; a slender member in compression buckles well before yield, so a compressive thermal stress near yield is a buckling problem.
- Trapped-liquid pressure assumes no vapour space and no wall stretch under pressure; both reduce the real rise, so the result is an upper bound that justifies a thermal relief valve rather than predicting the exact pressure.
- For bunker and cargo quantities use the Table 54B method (bunker-quantity calculator); the constant β here is for engineering estimates.

## Worked example

A 100 m carbon-steel pipeline (cross-section 100 cm²) is heated by 100 K.

1. Free expansion: 12 × 10⁻⁶ × 100 × 100 = 0.120 m = 120 mm.
2. Fully restrained between rigid anchors: σ = 200 × 10⁹ × 12 × 10⁻⁶ × 100 = 240 MPa — 102 % of S235 yield, so the line would yield or, more likely, buckle sideways. Anchor force 240 MPa × 0.01 m² = 2.4 MN.
3. With an expansion loop allowing 60 mm: σ = 200 × 10⁹ × (1.2 × 10⁻³ − 0.6 × 10⁻³) = 120 MPa, force 1.2 MN.
4. Allowing the full 120 mm (expansion joint or free sliding supports): no stress.

Blocked-in water line: 1 m³ of water at 20 °C in a closed steel pipe warmed by 10 K. ΔV would be 0.21 × 10⁻³ × 1 × 10 = 2.1 L if vented; confined, Δp = 2.2 × 10⁹ × (0.21 − 3 × 0.012) × 10⁻³ × 10 = 38 bar, i.e. 3.8 bar per kelvin. Relieving 1.74 L holds the pressure. A sun-warmed deck line can gain 30 K, more than enough to burst a flange gasket without a thermal relief valve.

## FAQ

**Why does the thermal stress not depend on the length?**
Because strain, not length, sets the stress: a short and a long bar both have the strain α ΔT when fully restrained. Length only matters for how much movement an expansion joint must absorb and for buckling.

**How do pipe designers avoid these stresses?**
Expansion loops, bellows, offsets and sliding or spring supports convert the restraint into allowed movement. ASME B31.3 Appendix D analyses the flexibility; this calculator shows how much movement removes the stress.

**My steel pipe is in compression at 240 MPa. Will it really yield?**
A straight restrained pipe would buckle laterally long before 240 MPa; the force on the anchors is capped by that buckling. Either way the installation fails without flexibility.

**Which expansion coefficient for stainless steel?**
Austenitic grades (304, 316) are about 16–17 µm/m·K, 40 % more than carbon steel, which matters at dissimilar-metal joints and for stainless pipes clamped to a steel ship structure.

**Why is the blocked-in pressure rise so high?**
Liquids are nearly incompressible: with K = 2.2 GPa, forcing a 0.17 % volume change on water needs 38 bar. Only a vapour space or a relief valve can absorb it.

**Does the pipe's own expansion help?**
Yes, that is the 3 α_pipe term: the volume of a steel pipe grows 36 ×10⁻⁶ per kelvin, about 17 % of the water expansion, which lowers the pressure rise correspondingly.

**How does this relate to fuel tank soundings?**
The volume of fuel in a tank changes with temperature while its mass does not; the bunker-quantity calculator converts observed volume to mass at 15 °C with the standard tables, which is the precise version of β V ΔT.

## Related calculators

- [Thin-wall pressure vessel](../pressure-vessel/index.html) — pressure stresses combined with thermal stresses.
- [Pipe flow and pressure drop](../pipe-flow/index.html) — the piping that needs expansion loops.
- [Bunker quantity and density correction](../bunker-quantity/index.html) — temperature correction of fuel volumes.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — tube bundle expansion between the fluid temperatures.
