# Buoyancy calculator (Archimedes)

**Summary:** Buoyant force, net force and whether an object floats, the draft of a floating box or cylinder, and the load a pontoon or raft can carry.

## Introduction

A body in water is pushed up by a force equal to the weight of the water it displaces. That is Archimedes' principle: buoyant force = water density × gravity × displaced volume. A sealed 0.2 m³ drum held under sea water is pushed up with 1 025 × 9.81 × 0.2 = 2 010 N, enough to support 205 kg. If the body weighs less than that, it floats and sinks only until it displaces its own weight.

This calculator gives the buoyant force, the net force and whether an object floats in fresh or sea water. For boxes, upright cylinders and horizontal cylinders such as pontoon tubes and drums, it gives the draught and freeboard, and the load the floats can carry while keeping a chosen freeboard. It is for boaters, raft and jetty builders, divers and students.

## Formulas

Archimedes' principle:

    F_B = ρ g V
    floats when m < ρ V,     share under water = m / (ρ V)

Draught of n identical floats carrying a total mass m:

    box:                  T = m / (ρ n L B)
    upright cylinder:     T = m / (ρ n π D² / 4)
    horizontal cylinder:  ρ n L A(T) = m
    A(T) = r² acos((r − T) / r) − (r − T) √(2 r T − T²)

Payload to a freeboard f, for floats of height H:

    m_max = ρ n × (volume immersed to H − f)

- ρ — water density: 1 000 kg/m³ fresh, 1 025 kg/m³ sea; g = 9.81 m/s²
- V — volume of the body; r = D/2 — radius of a cylinder; A — submerged segment area

## Assumptions and limitations

- The floats are rigid and watertight, the water is still, and the load is shared equally so the floats sit level.
- Stability is not checked. A raft can have plenty of buoyancy and still capsize if it is narrow or the load is high.
- The ends of a horizontal cylinder are taken as flat. Rounded or pointed pontoon ends add a little volume.
- Keep a working margin beyond the freeboard limit for people moving about, waves and water on deck.

## Worked example

A small raft floats on two pontoon tubes, each 0.6 m in diameter and 6 m long, in fresh water. Tubes, deck and people together weigh 1 500 kg. How deep do the tubes sink, and how much can the raft carry with 0.15 m of freeboard?

1. Volume of the two tubes: 2 × π × 0.3² × 6 = 3.39 m³, so they can never carry more than 3 393 kg.
2. Each tube carries 750 kg, which needs 0.75 m³ of displaced water: 0.75 / 6 = 0.125 m² of submerged section.
3. Solving the segment area for 0.125 m² gives a draught of 0.273 m, leaving 0.327 m of freeboard.
4. With 0.15 m freeboard the tubes are immersed 0.45 m. The segment area is then 0.2275 m², so the tubes carry 2 × 0.2275 × 6 × 1 000 = 2 730 kg.
5. Extra payload: 2 730 − 1 500 = 1 230 kg.

## FAQ

**How do I calculate buoyant force?**
Multiply the water density by gravity and by the volume under water. One cubic metre fully submerged in fresh water gives 9.81 kN, enough to support 1 000 kg.

**How do I know if an object will float?**
Compare its mass with the mass of water it would displace fully submerged. A steel block sinks, but a steel hull floats because it encloses far more volume than its steel.

**How much weight can a 55 gallon drum hold up?**
A 55 US gallon drum holds 0.208 m³, so fully submerged it supports 208 kg in fresh water or 213 kg in sea water, less the drum's own mass.

**Do things float better in sea water?**
Yes. Sea water is about 2.5 % denser than fresh water, so the same float carries 2.5 % more, or floats a little higher with the same load.

**Does a submerged object get more buoyant deeper down?**
Not if it is rigid: the displaced volume, and so the force, stays the same. Bodies that compress, such as foam, air pockets or a diver's suit, lose buoyancy with depth.

**Why keep a freeboard on a raft or pontoon?**
A float loaded to the waterline has no reserve for waves, wake or people stepping to one side. The reserve buoyancy above the water is what keeps the deck dry and the raft upright.

## Related calculators

- [Block coefficient and hull form](../block-coefficient/index.html) — displacement of a ship's hull.
- [Hydrostatic pressure](../hydrostatic-pressure/index.html) — the pressure that makes buoyancy.
- [Hydrostatics basics](../hydrostatics/index.html) — TPC and fresh water allowance of ships.
- [Metal weight calculator](../metal-weight/index.html) — the mass of steel or aluminium floats.
