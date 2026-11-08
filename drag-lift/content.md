# Drag and lift force calculator

**Summary:** Aerodynamic drag or lift force from ½ρv²CA, the power to overcome drag, and air density from altitude and temperature, with typical Cd values.

## Introduction

Aerodynamic drag is the force the air exerts against a moving body. To calculate it, multiply the dynamic pressure, ½ ρ v², by the drag coefficient and the frontal area. Lift uses the same formula with the lift coefficient and the wing area. A car with a drag coefficient of 0.30 and 24 ft² of frontal area meets 90 lbf of drag at 70 mph, and needs about 17 hp just to push through the air.

This calculator gives the drag or lift force, the dynamic pressure and the power to overcome the drag. It finds the air density from the altitude and temperature, or takes it directly. It offers typical drag coefficients for cars, cyclists, flat plates and spheres. It is for car and bike enthusiasts, students, and drone and model builders.

## Formulas

Dynamic pressure, force and power:

    q = ½ ρ v²
    F = q × C × A
    P = F × v

Air density from altitude and temperature:

    p = 101 325 × (1 − 2.25577 × 10⁻⁵ z)^5.2559    Pa
    ρ = p / (287.04 × T)

Typical drag coefficients on frontal area:

| Body | Cd | Source |
|---|---|---|
| Passenger car | 0.30 | Çengel and Cimbala |
| Cyclist, upright, about 0.5 m² | 1.1 | Munson et al. |
| Cyclist, racing crouch, about 0.36 m² | 0.88 | Munson et al. |
| Flat square plate or disc facing the flow | 1.17 | Hoerner |
| Sphere, laminar boundary layer | 0.47 | Hoerner |

- ρ — air density; v — air speed relative to the body
- C — drag coefficient Cd or lift coefficient CL
- A — frontal area for drag, wing area for lift
- z — altitude in m; T — air temperature in K

## Assumptions and limitations

- The coefficient is held constant. In reality it changes with the Reynolds number, the yaw angle and, above about Mach 0.3, compressibility.
- The speed is the speed through the air. Add a head wind to the road speed, or subtract a tail wind.
- The power covers only the drag. Rolling resistance and drivetrain losses come on top.
- Dry air is assumed. Humidity lowers the density slightly: saturated air at 30 °C is 1.6 % lighter than dry air.

## Worked example

A car has a drag coefficient of 0.30 and a frontal area of 24 ft². How much drag does it meet at 70 mph at sea level on a 59 °F day, and what power does that take?

1. Air density: 101 325 Pa / (287.04 × 288.15 K) = 1.225 kg/m³.
2. Speed: 70 mph = 31.29 m/s.
3. Dynamic pressure: ½ × 1.225 × 31.29² = 599.8 Pa, or 12.53 psf.
4. Drag: 12.53 × 0.30 × 24 = 90.2 lbf.
5. Power: 401.2 N × 31.29 m/s = 12.55 kW, or 16.84 hp.

At 80 mph the drag rises by (80 / 70)² to 118 lbf, and the power by (80 / 70)³ to 25 hp.

## FAQ

**How do I calculate drag force?**
Multiply ½ × air density × speed squared by the drag coefficient and the frontal area. In US units, the dynamic pressure in psf is about 0.00256 × mph² at sea level.

**What is a typical drag coefficient for a car?**
About 0.30 for a passenger car. Values differ with the body shape, so use the maker's published figure when there is one.

**How much power does aerodynamic drag take?**
Drag force times speed. Because the force grows with speed squared, the power grows with speed cubed.

**What is CdA?**
The drag coefficient times the frontal area. It is the single number that sets the drag at a given speed and air density.

**How does altitude affect drag?**
Thinner air means less drag at the same speed. At 5 280 ft on a 30 °C day the density is 0.959 kg/m³, and the drag is 22 % lower than at sea level on a standard day.

**How do I calculate lift?**
Use the same formula with the lift coefficient and the wing area. In level flight the lift equals the weight.

## Related calculators

- [Thrust-to-weight and wing loading](../thrust-weight/index.html) — stall speed from the wing loading and CLmax.
- [True airspeed](../true-airspeed/index.html) — the speed through the air at altitude.
- [Quarter-mile ET and trap speed](../quarter-mile/index.html) — performance where drag limits the trap speed.
- [Wind load](../wind-load/index.html) — wind pressure on buildings and signs.
