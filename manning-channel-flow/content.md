# Open-channel flow (Manning) calculator

**Summary:** Manning flow in rectangular, trapezoidal, triangular and circular channels: velocity, discharge or normal depth, Froude number, critical depth, shear stress.

## Introduction

Drainage ditches, culverts, storm drains running partly full, irrigation canals, scuppers and deck drains all flow with a free surface, driven by gravity along the bed slope rather than by a pump. Manning's equation has been the working tool for such channels since 1889: velocity from the hydraulic radius, the slope and one roughness coefficient. This calculator applies it to rectangular, trapezoidal, triangular and partially full circular sections, in both directions (discharge for a depth, or the normal depth for a discharge), and adds the Froude number and regime, the critical depth, the specific energy and the mean shear stress on the boundary.

It is for civil and drainage engineers, port and yard designers, marine engineers sizing deck drainage and bilge channels, and students meeting uniform open-channel flow.

## Formulas

Section geometry (depth y):

    Rectangular:  A = b y,            P = b + 2y,                 T = b
    Trapezoidal:  A = (b + z y) y,    P = b + 2y √(1 + z²),       T = b + 2 z y
    Triangular:   A = z y²,           P = 2y √(1 + z²),           T = 2 z y
    Circular:     θ = 2 acos(1 − 2y/D),  A = D² (θ − sin θ)/8,  P = D θ/2,  T = D sin(θ/2)
    R = A / P

Manning (SI):

    V = (1/n) R^(2/3) S^(1/2),    Q = A V

Normal depth: the y for which A V = Q (bisection). Circular pipes carry their maximum free-surface discharge at about 94 % depth; above that the capacity falls back to the full-pipe value.

Critical flow and energy:

    Fr = V / √(g A/T)       (< 1 subcritical, > 1 supercritical)
    critical depth y_c:  Q² T / (g A³) = 1   (rectangle: y_c = (q²/g)^(1/3), q = Q/b)
    E = y + V² / (2g)
    τ₀ = ρ g R S

Manning n (Chow, normal values): PVC 0.009; coated steel 0.012; finished concrete 0.013; rough concrete 0.017; corrugated metal 0.024; clean earth 0.022; weedy earth 0.030; gravel 0.025; riprap 0.035; natural clean stream 0.030; weedy stream 0.050.

## Assumptions and limitations

- Steady uniform flow: bed slope = energy slope. Near structures, bends, changes of section or a downstream control the depth differs (backwater or drawdown) and a gradually varied flow computation is needed.
- Manning's equation is empirical for fully rough turbulent flow; it is not reliable for very smooth linings at low velocity or for very shallow sheet flow.
- The roughness coefficient dominates the uncertainty: Chow's ranges span about ±20 % around the normal value for a given description, and natural channels change with season and stage.
- Prismatic channel; water at 1 000 kg/m³; no sediment transport or air entrainment.
- The mean shear stress is an average over the wetted perimeter; local bed values can be 1.5 times higher.

## Worked example

Rectangular concrete drainage channel, 3.0 m wide, bed slope 0.1 % (1 m per km), flowing 1.0 m deep; finished concrete, n = 0.013.

1. Geometry: A = 3.0 m², P = 3 + 2 = 5.0 m, R = 0.60 m, T = 3.0 m.
2. Velocity: (1/0.013) × 0.60^(2/3) × 0.001^(1/2) = 76.9 × 0.711 × 0.0316 = 1.73 m/s. Discharge 5.19 m³/s.
3. Froude number: 1.73 / √(9.81 × 1.0) = 0.55 — subcritical, so the depth is set from downstream.
4. Critical depth for 5.19 m³/s: q = 1.73 m²/s, y_c = (1.73² / 9.81)^(1/3) = 0.67 m. The channel would run supercritical only on a slope above about 0.3 % (the critical slope at this discharge).
5. Specific energy 1.15 m; mean shear stress 1 000 × 9.81 × 0.6 × 0.001 = 5.9 Pa — safe for concrete, marginal for a grass lining.

Inverting: for a design discharge of 5.19 m³/s the normal depth is 1.00 m, so a 1.3 m deep channel gives 0.3 m freeboard.

## FAQ

**Which Manning n should I use?**
The table value for the lining, adjusted for condition: new smooth concrete 0.012–0.013, aged or rough 0.015–0.017; earth channels 0.022 clean to 0.030 with vegetation. When in doubt, check the result at both ends of the range.

**Why does a pipe carry more when 94 % full than when completely full?**
Above 94 % depth the wetted perimeter grows faster than the area as the crown closes in, so the hydraulic radius and velocity drop. Design practice sizes storm drains for 80–90 % full to avoid surging.

**What does the Froude number tell me?**
Below 1 the flow is tranquil and controlled from downstream; above 1 it is rapid, controlled from upstream, and will form a hydraulic jump where it has to slow down. Near 1 the surface is unstable; avoid designing there.

**What is the critical depth for?**
It is the depth at which the specific energy for the discharge is minimum and the Froude number is 1; it fixes the depth at free overfalls and weirs and separates the two regimes.

**Is Manning valid for a smooth plastic pipe?**
Approximately, with n ≈ 0.009–0.010; for very smooth pipes the Colebrook-based pipe-flow calculator with a hydraulic diameter is more rigorous.

**Can I use this for a ship's deck drainage?**
Yes for scuppers and gutters running partly full; for the freeing-port and scupper sizing rules themselves, follow the Load Line regulations.

**How do I include freeboard?**
Compute the normal depth for the design discharge and add a freeboard (typically 0.3 m or 20 % of the depth) for waves, surges and uncertainty in n.

## Related calculators

- [Pipe flow and pressure drop](../pipe-flow/index.html) — pressurised (full) pipes.
- [Tank volume and partial fill](../tank-volume/index.html) — the same circular-segment geometry for tanks.
- [Concrete volume and rebar weight](../concrete-volume/index.html) — the channel lining itself.
- [Tidal height (rule of twelfths)](../tidal-height/index.html) — tidal boundary conditions for outfalls.
