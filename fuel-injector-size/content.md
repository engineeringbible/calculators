# Fuel injector size calculator

**Summary:** Fuel injector size in lb/hr and cc/min from horsepower, BSFC, injector count and duty cycle, or the horsepower injectors support, with fuel pressure.

## Introduction

How big do fuel injectors need to be? Multiply the target horsepower by the brake specific fuel consumption to get the total fuel flow. Then divide by the number of injectors and by the maximum duty cycle. A 450 hp naturally aspirated V8 on gasoline needs eight injectors of about 35 lb/hr each, or about 370 cc/min.

This calculator sizes injectors in lb/hr and cc/min for gasoline or E85, naturally aspirated or boosted, and corrects for a fuel pressure different from the rating. It also works the other way, giving the horsepower a set of injectors supports. It is for engine builders and tuners planning an upgrade.

## Formulas

Injector size and horsepower supported:

    flow per injector = hp × BSFC / (n × DC)
    hp = flow × n × DC / BSFC

Fuel pressure and units:

    flow at p2 = flow at p1 × √(p2 / p1)
    cc/min = lb/hr × 453.6 / 60 / ρ

- hp — flywheel horsepower; BSFC — lb of fuel per hp per hour
- n — number of injectors; DC — maximum duty cycle, such as 0.80
- p — pressure across the injector, fuel pressure minus manifold pressure
- ρ — fuel density in g/cm³: 0.72 for gasoline, which gives 10.5 cc/min per lb/hr, and 0.78 for E85

Typical BSFC values, lb/(hp·h):

| Engine | Gasoline | E85 (× 1.5) |
|---|---|---|
| Naturally aspirated | 0.45 to 0.50 | 0.75 |
| Supercharged | 0.55 to 0.75 | 0.90 |
| Turbocharged | 0.55 to 0.75 | 0.975 |

## Assumptions and limitations

- BSFC depends on the engine, the tune and the air-fuel ratio. Boosted engines run richer to control knock, so they use more fuel per horsepower.
- E85 needs about 1.5 times the fuel mass of gasoline, because its stoichiometric air-fuel ratio is 9.8 instead of 14.7.
- Injector makers generally suggest a duty cycle of 85 % at most. The default of 80 % leaves a margin.
- Flow follows the pressure across the injector. With a 1:1 boost-referenced regulator that difference stays at the base pressure.
- Diesel and direct-injection engines are sized differently. Enter a BSFC only if you have one from the engine builder.

## Worked example

An engine builder plans a 450 hp naturally aspirated V8 on gasoline. It has eight injectors, and the maximum duty cycle is 80 %. The injectors are rated at 43.5 psi (3 bar) and will run at that pressure.

1. Total fuel flow: 450 × 0.50 = 225.0 lb/h.
2. Per injector: 225.0 / (8 × 0.80) = 35.2 lb/h.
3. In cc/min: 35.16 × 453.6 / 60 / 0.72 = 369.1 cc/min.

Choose the next size up that is available, to leave a margin for a richer tune. Eight 42 lb/hr injectors would support 537.6 hp at the same duty cycle.

## FAQ

**How do I calculate injector size?**
Multiply horsepower by BSFC, then divide by the number of injectors and the maximum duty cycle. The result is in lb/hr.

**How do I convert lb/hr to cc/min?**
Multiply by about 10.5 for gasoline. The exact factor is 453.6 / 60 divided by the fuel density in g/cm³.

**What BSFC should I use?**
About 0.50 for a naturally aspirated gasoline engine and 0.60 to 0.65 for a supercharged or turbo engine. For E85, multiply by 1.5.

**How much horsepower will my injectors support?**
Multiply the injector flow by the number of injectors and the duty cycle, then divide by BSFC. Eight 42 lb/hr injectors at 80 % support 537.6 hp at BSFC 0.50.

**Does raising fuel pressure increase injector flow?**
Yes, with the square root of the pressure. Going from 43.5 to 58 psi raises the flow by 15.5 %.

**How much bigger do injectors need to be for E85?**
About 50 % bigger by mass, because E85 needs 1.5 times as much fuel for the same air.

## Related calculators

- [Horsepower calculator](../horsepower/index.html) — the power to size for.
- [Engine displacement](../engine-displacement/index.html) — cubic inches and litres.
- [Compression ratio](../compression-ratio/index.html) — static compression for the build.
- [Quarter-mile ET and trap speed](../quarter-mile/index.html) — the performance the power gives.
