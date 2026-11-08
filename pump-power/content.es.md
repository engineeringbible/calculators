# Calculadora de potencia de una bomba

**Resumen:** Potencia hidráulica, en el eje y eléctrica de una bomba a partir del caudal y la altura o la presión, con el motor normalizado siguiente y el costo de energía.

## Introducción

Una bomba eleva un caudal de líquido contra una altura. La potencia que termina en el líquido, la potencia hidráulica, es densidad × gravedad × caudal × altura. La bomba desperdicia parte de la potencia que recibe en el eje, y el motor desperdicia parte de la electricidad, así que la potencia tomada de la red es bastante mayor. Bombear 50 m³/h de agua contra 30 m aporta 4.08 kW al agua, pero consume unos 6.5 kW de electricidad.

Esta calculadora da la potencia hidráulica, la potencia en el eje y la potencia eléctrica absorbida de una bomba a partir del caudal y de la altura o del aumento de presión, el tamaño de motor normalizado siguiente con un margen, y la energía y el costo anuales. Está pensada para ingenieros y técnicos que seleccionan bombas y motores y que revisan costos de funcionamiento.

## Fórmulas

Potencia en cada etapa:

    P_h = ρ g Q H = Q Δp
    P_shaft = P_h / η_pump
    P_in = P_shaft / η_motor

Unidades de EE. UU. (brake horsepower, potencia al freno):

    BHP = Q[gpm] × H[ft] × SG / (3 960 × η_pump)

- ρ — densidad del líquido; g = 9.81 m/s²; Q — caudal; H — altura total
- Δp — aumento de presión, con H = Δp / (ρ g)
- η_pump, η_motor — rendimientos de la bomba y del motor en el punto de trabajo

## Hipótesis y limitaciones

- La altura es la altura dinámica total: altura estática, pérdidas por fricción y por accesorios, y cualquier diferencia de presión entre los depósitos. La calculadora de altura dinámica total la calcula.
- El rendimiento de la bomba debe leerse en su curva en el punto de trabajo. Las bombas pequeñas llegan al 40 a 60 %, las grandes al 75 a 85 %. Trabajar lejos del punto de máximo rendimiento desperdicia energía y desgasta la bomba.
- Los líquidos viscosos reducen el rendimiento y la altura de la bomba. Corrígelos con el método de viscosidad del Hydraulic Institute antes de usar esta página.
- El tamaño del motor usa las potencias asignadas IEC en kW. Los motores NEMA de Norteamérica se especifican en hp: 1, 1.5, 2, 3, 5, 7.5, 10, 15, 20 hp, etcétera.

## Ejemplo resuelto

Una bomba centrífuga impulsa 50 m³/h de agua (998 kg/m³) contra una altura total de 30 m. Su rendimiento es del 70 % y el del motor del 90 %. ¿Qué potencia se necesita?

1. Caudal: 50 / 3 600 = 0.01389 m³/s.
2. Potencia hidráulica: 998 × 9.81 × 0.01389 × 30 = 4.08 kW.
3. Potencia en el eje: 4.08 / 0.70 = 5.83 kW.
4. Potencia eléctrica absorbida: 5.83 / 0.90 = 6.47 kW.
5. Motor con un margen del 10 %: 5.83 × 1.1 = 6.41 kW, así que un motor de 7.5 kW.

Funcionando 4 000 horas al año, la bomba consume unos 26 MWh de electricidad.

## Preguntas frecuentes

**¿Cómo calculo la potencia de una bomba?**
Multiplica densidad, gravedad, caudal y altura para obtener la potencia hidráulica, y divide entre el rendimiento de la bomba para obtener la potencia en el eje. Para agua, kW = m³/h × m / 367 / rendimiento.

**¿Qué es la brake horsepower (BHP)?**
La potencia que necesita la bomba en su eje. En unidades de EE. UU. es gpm × pies × densidad relativa / (3 960 × rendimiento).

**¿Qué tamaño de motor necesita mi bomba?**
Como mínimo la potencia en el eje en el punto de funcionamiento más desfavorable, más un margen del 10 al 20 %. Después elige la potencia de motor normalizada siguiente.

**¿Cómo convierto presión en altura?**
Divide la presión entre densidad × gravedad. Para agua, 1 bar son 10.2 m y 1 psi son 2.31 ft.

**¿Cuál es un rendimiento típico de una bomba?**
Del 40 al 60 % en bombas domésticas pequeñas y circuladores, del 70 al 85 % en bombas grandes de proceso y de abastecimiento de agua en su punto de máximo rendimiento.

**¿Cómo reduzco el consumo de energía de una bomba?**
Trabaja cerca del punto de máximo rendimiento, reduce las pérdidas en las tuberías y usa un variador de velocidad cuando el caudal varíe: la potencia baja con el cubo de la velocidad.

## Calculadoras relacionadas

- [Altura dinámica total](../total-dynamic-head/index.html): la altura que debe dar la bomba.
- [Leyes de afinidad de bombas](../pump-affinity/index.html): caudal, altura y potencia a otra velocidad.
- [NPSH de bombas](../pump-npsh/index.html): la comprobación de cavitación.
- [Costo de la electricidad](../electricity-cost/index.html): el costo de la energía.
