# Pipe flow and pressure drop calculator

**Summary:** Velocity, Reynolds number, Darcy friction factor (Colebrook, Swamee–Jain) and pressure drop for a straight pipe with fittings.

## Introduction

Every pump, cooler and fuel line sizing question starts here: how fast does the fluid move, is the flow laminar or turbulent, what friction factor applies, and how much pressure is lost over the run. This calculator takes a flow rate or velocity, the pipe diameter, length and material, and the fluid, and returns the Reynolds number, the Darcy friction factor from the Colebrook–White equation (with the explicit Swamee–Jain value alongside for comparison), the friction loss, the minor losses from fittings expressed as a ΣK, and the static head from an elevation change.

Marine engineers use it for sea-water cooling lines, fuel transfer and ballast piping; building services and process engineers for water and air ducts; students for the classic Moody-chart exercises, with the chart replaced by a converged solution.

## Formulas

Continuity:

    V = Q / A,   A = π D² / 4

- Q — volume flow rate, m³/s
- V — mean velocity, m/s
- D — pipe inside diameter, m

Reynolds number:

    Re = V D / ν

- ν — kinematic viscosity, m²/s (= μ / ρ)

Friction factor (Darcy):

    Laminar, Re < 2 300:        f = 64 / Re
    Turbulent, Colebrook–White: 1/√f = −2 log₁₀( ε/(3.7 D) + 2.51/(Re √f) )   (solved by iteration)
    Swamee–Jain explicit:       f = 0.25 / [ log₁₀( ε/(3.7 D) + 5.74/Re^0.9 ) ]²

- ε — absolute roughness of the pipe wall, m

Losses:

    h_f  = f (L/D) V² / (2g)             friction head, m of fluid
    Δp_f = f (L/D) ρ V² / 2              friction pressure drop, Pa
    Δp_K = ΣK ρ V² / 2                   minor losses, Pa
    Δp_z = ρ g Δz                        static pressure from elevation, Pa
    Δp_total = Δp_f + Δp_K + Δp_z
    H_total  = Δp_total / (ρ g)
    H_loss   = (Δp_f + Δp_K) / (ρ g)     friction and fittings only (the suction-line loss of an NPSH check)

- L — pipe length, m; ρ — density, kg/m³; ΣK — sum of minor-loss coefficients; Δz — rise of the outlet above the inlet, m; g = 9.80665 m/s²

Roughness presets (Moody 1944 / White Table 6.1): drawn tubing and PVC 0.0015 mm, stainless steel 0.015 mm, commercial steel 0.045 mm, galvanized iron 0.15 mm, cast iron 0.26 mm, concrete 1.0 mm, riveted steel 3 mm.

## Assumptions and limitations

- Steady, fully developed, incompressible flow in a circular pipe running full. For gases the result holds while the pressure drop stays below about 10 % of the absolute pressure.
- The friction factor is the Darcy factor (four times the Fanning factor). Check which one a chart or vendor table uses before comparing.
- In the transitional band 2 300 < Re < 4 000 no formula is reliable; the calculator uses the turbulent (Colebrook) value as the conservative choice and warns.
- Minor losses are lumped as ΣK × dynamic pressure. K values from handbooks vary by ±30 % and depend on Reynolds number and fitting geometry; equivalent-length methods give similar accuracy.
- Roughness presets are for new, clean pipe. Aged or scaled pipe can have several times the roughness, and corrosion products reduce the diameter, which matters more than roughness because losses scale with D⁻⁵ at fixed flow.
- Fluid presets for fuels and lubricating oil are typical values at the stated temperature, not standard properties; viscosity of HFO changes by a factor of two for a 10 °C change, so enter the actual value for anything that matters.
- Non-circular ducts: use the hydraulic diameter D_h = 4A/P in place of D; accuracy is then about ±15 % in turbulent flow and poor in laminar flow.

## Worked example

Sea-water cooling line: 100 m³/h through a DN100 (100 mm inside) commercial steel pipe, 100 m long, with ΣK = 5 for bends and valves, discharging 10 m above the inlet. Sea water at 15 °C: ρ = 1025.9 kg/m³, ν = 1.188 × 10⁻⁶ m²/s.

1. Area: π × 0.1² / 4 = 7.854 × 10⁻³ m². Velocity: (100/3600) / 7.854 × 10⁻³ = 3.54 m/s (high for a liquid line; the calculator warns).
2. Reynolds: 3.54 × 0.1 / 1.188 × 10⁻⁶ = 2.98 × 10⁵, turbulent.
3. Relative roughness: 0.045 / 100 = 4.5 × 10⁻⁴. Colebrook: f = 0.0179; Swamee–Jain gives 0.0180.
4. Friction: Δp_f = 0.0179 × (100/0.1) × 1025.9 × 3.54² / 2 = 115.1 kPa (11.4 m of sea water).
5. Minor losses: 5 × 1025.9 × 3.54² / 2 = 32.1 kPa.
6. Static: 1025.9 × 9.80665 × 10 = 100.6 kPa.
7. Total: 248 kPa ≈ 24.6 m of sea water, the head the pump must supply at this flow (plus any pressure required at the outlet).

Doubling the diameter to DN200 cuts the velocity to 0.88 m/s and the friction loss to about 4 kPa.

## FAQ

**Darcy or Fanning friction factor?**
Darcy here. f_Darcy = 4 f_Fanning. Laminar flow is f = 64/Re in Darcy form and 16/Re in Fanning form; that is the quickest way to tell which one a source uses.

**Why iterate Colebrook when Swamee–Jain exists?**
Swamee–Jain is within about 1 % of Colebrook over its validity range, which is plenty for most design. The calculator shows both so you can see the difference; the converged Colebrook value is used for the results.

**What velocity should I design for?**
Common practice: sea-water lines 1.5–3 m/s (copper-nickel limited to about 3 m/s by erosion), fresh water 1–2.5 m/s, fuel suction lines below 1 m/s, pump discharge up to 3 m/s, air ducts 5–10 m/s.

**How do I get ΣK?**
Add the handbook K for each fitting: 90° long-radius elbow 0.3, standard elbow 0.9, tee through 0.6, tee branch 1.8, gate valve open 0.2, globe valve open 10, swing check 2, sharp entrance 0.5, exit 1.0. Crane TP-410 is the standard reference.

**The regime says transitional. What do I use?**
Avoid designing there if you can: a small change in temperature or flow moves the friction factor by 30 % or more. The calculator shows the turbulent value because it is the higher, safer one.

**Does pipe age matter?**
A lot. Scaled or fouled steel can have a roughness of 1–3 mm and a smaller bore; losses can double or triple over the pipe's life. Use the cast-iron or concrete presets for old lines, or a custom roughness.

**Can I use this for air or gas?**
Yes, with the air preset or custom properties, as long as the pressure drop is a small fraction of the absolute pressure. Ventilation ducts qualify; compressed-air mains over long distances may not.

## Related calculators

- [Pump and fan affinity laws](../pump-affinity/index.html) — adjust the pump to deliver the head found here.
- [Heat exchanger LMTD](../heat-exchanger-lmtd/index.html) — tube-side pressure drop goes with the area calculation.
- [Tank volume and partial fill](../tank-volume/index.html) — the volumes that these lines move.
- [Engineering unit converter](../unit-converter/index.html) — bar, psi, m³/h, gpm, cSt.
