# Paint coverage and quantity calculator

**Summary:** Theoretical and practical spreading rate from volume solids and dry film thickness, litres and cost for an area with loss factors.

## Introduction

Every coating datasheet quotes a theoretical spreading rate, and every painter knows the job needs more than that. The theoretical figure follows from two numbers, the volume solids of the paint and the dry film thickness specified, and assumes a smooth surface with no overspray; the practical figure adds the losses of real application, which range from a few per cent with a brush to half the paint in a windy spray job on lattice steel. This calculator gives both rates, the wet film thickness the applicator should see on the comb gauge, and the litres, containers, mass and cost for an area and number of coats, with a correction for thinning and for the dead volume of a blast profile.

It is for superintendents and yard estimators ordering paint for a drydock, coating inspectors checking consumption against the specification, and anyone comparing products by cost per square metre.

## Formulas

    TSR = VS × 10 / DFT              theoretical spreading rate, m²/L (VS in %, DFT in µm)
    PSR = TSR × (1 − loss)           practical spreading rate
    WFT = DFT / VS                   wet film thickness to apply
    VS_thinned = VS / (1 + thinner)  volume solids after adding thinner (by volume)

    litres (theoretical) = area × (n × DFT + profile allowance) / (10 × VS)
    litres (practical)   = theoretical / (1 − loss)
    containers = ceil(litres / pack size),  mass = litres × density,  cost = litres × price

Loss factors (rules of thumb): brush/roller 5–15 %, airless spray on flat steel 20–30 %, complex steelwork 30–50 %, windy outdoor spraying 40–60 %. Profile allowance: 25–40 µm on the first coat for a 50–75 µm blast profile.

## Assumptions and limitations

- The theoretical rate assumes a smooth, non-absorbent surface and the datasheet solids; it is never achieved.
- Loss presets are industry rules of thumb; measured consumption from a comparable job is better, and the 80/20 acceptance rule of ISO 19840 alone pushes the applied average 10–20 % above the specified DFT.
- One product and DFT per calculation; a system of primer, intermediate and topcoat is three runs.
- Stripe coats, touch-up and repairs are extra area; porous substrates and inorganic zinc primers do not follow the simple volume balance.
- Thinning lowers the solids and raises the wet film; the dry film and therefore the dry mass on the structure stay the same.

## Worked example

Underwater hull, 10 000 m², two coats of a 60 % volume-solids anticorrosive at 150 µm each, airless spray in the dock with an estimated 30 % loss, 20 L containers at 8 per litre, density 1.4 kg/L.

1. Theoretical spreading rate 60 × 10 / 150 = 4.0 m²/L; practical 4.0 × 0.7 = 2.8 m²/L.
2. Wet film to apply 150 / 0.60 = 250 µm per coat.
3. Theoretical quantity 10 000 × 300 / 600 = 5 000 L; practical 5 000 / 0.7 = 7 143 L → 358 containers, 10 t of paint, 57 143 in cost, 5.7 per m².
4. Freshly blasted steel with a 60 µm profile: allow 30 µm on the first coat → 7 857 L (+10 %).
5. Thinning 10 %: solids 54.5 %, wet film 275 µm, 7 857 L for the same dry film.

## FAQ

**Why does the datasheet spreading rate differ from mine?**
It is theoretical: smooth surface, no overspray, exact solids. Divide it by about 1.4 for a good airless job on flat steel, more for complex shapes.

**What is volume solids?**
The fraction of the wet paint that remains as dry film after the solvents evaporate; a 60 % solids paint at 250 µm wet gives 150 µm dry.

**Why add paint for the blast profile?**
The first coat has to fill the valleys of the profile before any thickness builds above the peaks; ISO 19840 measures over the peaks, so the paint in the valleys is "lost" to the gauge.

**How do I handle two different products?**
Run the calculator for each (primer, intermediate, topcoat) with its own solids, DFT and coats, and add the results.

**Does thinning save paint?**
No. It lowers the solids in proportion, so the same dry film needs the same litres of unthinned paint plus the thinner; it only changes application properties and the wet film reading.

**What about stripe coats?**
Add their area (edges, welds, bolts) as an extra coat of the primer at the stripe DFT, typically 2–5 % of the total area.

**How accurate is the cost?**
As accurate as the loss factor. A 10-point change in loss changes the quantity by about 15 %.

## Related calculators

- [Cathodic protection anodes](../cathodic-protection/index.html) — the coating breakdown that drives anode demand.
- [Hydrostatics basics](../hydrostatics/index.html) — the wetted surface to coat.
- [Tank volume and partial fill](../tank-volume/index.html) — tank surface areas.
- [Engineering unit converter](../unit-converter/index.html) — mils, ft²/gal and gallons.
