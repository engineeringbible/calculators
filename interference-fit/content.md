# Interference fit calculator

**Summary:** Contact pressure, torque and axial force capacity, bore stresses and shrink-fit temperature of a hub on a solid or hollow shaft.

## Introduction

A hub fitted to a shaft with interference, by pressing or by heating the hub, grips the shaft through the contact pressure and transmits torque by friction. Couplings, gears, propeller hubs and bearing rings are mounted this way. This calculator uses the thick-walled cylinder solution to find the contact pressure from the interference, the torque and axial force the fit can carry, the stresses at the bore of the hub, and the temperature to which the hub must be heated to slide on.

It is for mechanical and marine engineers designing or checking shrink fits, maintenance engineers planning a fitting, and students of machine design.

## Formulas

    Contact pressure:   p = δ / (d [ (1/E_o)((D_o² + d²)/(D_o² − d²) + ν_o) + (1/E_i)((d² + d_i²)/(d² − d_i²) − ν_i) ])
    Equal materials:    p = E δ (D_o² − d²)(d² − d_i²) / (2 d³ (D_o² − d_i²))
    Torque:             T = μ p π d² L / 2
    Axial force:        F = μ p π d L
    Hub at the bore:    σ_t = p (D_o² + d²)/(D_o² − d²),   σ_r = −p
    Heating:            ΔT = (δ + clearance) / (α d)

- δ — diametral interference; d — fit diameter; D_o — hub outer diameter; d_i — shaft bore; L — fit length; μ — friction coefficient.

## Assumptions and limitations

- Elastic thick-walled cylinders with uniform contact pressure along the fit.
- Surface smoothing reduces the effective interference; DIN 7190-1 gives the allowance.
- Pressure peaks at the hub ends, centrifugal loosening and operating temperature differences are not included.
- Friction coefficients differ between shrink fits and press fits, and between assembly and service.

## Worked example

A steel hub of 200 mm outer diameter is shrunk on a solid steel shaft of 100 mm with 0.08 mm of diametral interference over 120 mm; μ = 0.14.

1. Contact pressure: 210 000 × 0.08 × (200² − 100²) / (2 × 100 × 200²) = 63.0 MPa.
2. Torque capacity: 0.14 × 63.0 × π × 100² × 120 / 2 = 16.6 kN·m; axial capacity 333 kN.
3. Hub hoop stress at the bore 105 MPa and von Mises stress 147 MPa, against 355 MPa yield.
4. To slide on with 0.05 mm clearance the hub is heated by 0.13 / (12 × 10⁻⁶ × 100) = 108 °C, to 128 °C.

## FAQ

**Is the interference diametral or radial?**
Diametral: the shaft diameter minus the hub bore. Some texts use the radial interference, half of it.

**Why is the hub stress higher than the contact pressure?**
The hub is stretched round its circumference. Its hoop stress at the bore is the contact pressure times (D_o² + d²)/(D_o² − d²), which grows quickly for thin hubs.

**What friction coefficient should I use?**
It depends on the materials, surface finish, lubrication and whether the fit was pressed or shrunk. DIN 7190-1 tabulates values for the common material pairs and joining methods; the 0.14 of the example is only a placeholder.

**Can I cool the shaft instead of heating the hub?**
Yes; the required temperature difference is the same in principle. Cooling with liquid nitrogen avoids heating a hardened hub but limits the temperature difference available.

**Why does a hollow shaft reduce the pressure?**
A hollow shaft is more flexible and gives way to the hub, so the same interference produces less pressure and less torque capacity.

## Related calculators

- [Shaft torque, power and diameter](../shaft-torque/index.html) — the torque the fit must carry.
- [Thermal expansion and restraint stress](../thermal-expansion/index.html) — expansion of the heated hub.
- [Bolt torque and preload](../bolt-torque/index.html) — a bolted alternative for clamping.
- [Rolling bearing L10 life (ISO 281)](../bearing-life/index.html) — bearing rings mounted with interference.
