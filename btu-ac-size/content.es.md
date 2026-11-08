# Calculadora de BTU para aire acondicionado

**Resumen:** Tamaño del aire acondicionado en BTU, kW y toneladas para una habitación según su superficie, con los ajustes de ENERGY STAR por sol, personas y cocina.

## Introducción

¿Cuántos BTU necesita una habitación? Los aires acondicionados se clasifican en unidades térmicas británicas por hora (Btu/h), y el tamaño adecuado depende sobre todo de la superficie. ENERGY STAR, el programa de eficiencia energética de EE. UU., publica una tabla de dimensionado para aires acondicionados de habitación: 5 000 Btu/h para un dormitorio pequeño de 100 a 150 ft², 12 000 Btu/h para 450 a 550 ft², hasta 34 000 Btu/h para 2 500 ft². Después, la tabla se ajusta según el sol, los ocupantes y si es una cocina.

Esta calculadora aplica esa tabla y sus ajustes a tu habitación, y da el resultado en Btu/h, en kilovatios de refrigeración y en toneladas de refrigeración. Está pensada para cualquiera que elija un equipo de ventana, portátil o de pared, o una sola unidad interior de un mini-split, para una habitación.

## Fórmulas

Capacidad según la tabla de ENERGY STAR para la superficie A, y después los ajustes:

    Q = chart(A) × f_sun + 600 × (people − 2) + 4 000 × kitchen    Btu/h

| Superficie (ft²) | Superficie (m²) | Capacidad (Btu/h) |
|---|---|---|
| 100 a 150 | 9 a 14 | 5 000 |
| 150 a 250 | 14 a 23 | 6 000 |
| 250 a 300 | 23 a 28 | 7 000 |
| 300 a 350 | 28 a 33 | 8 000 |
| 350 a 400 | 33 a 37 | 9 000 |
| 400 a 450 | 37 a 42 | 10 000 |
| 450 a 550 | 42 a 51 | 12 000 |
| 550 a 700 | 51 a 65 | 14 000 |
| 700 a 1 000 | 65 a 93 | 18 000 |
| 1 000 a 1 200 | 93 a 111 | 21 000 |
| 1 200 a 1 400 | 111 a 130 | 23 000 |
| 1 400 a 1 500 | 130 a 139 | 24 000 |
| 1 500 a 2 000 | 139 a 186 | 30 000 |
| 2 000 a 2 500 | 186 a 232 | 34 000 |

Conversiones:

    1 Btu/h = 0.29307 W,   1 ton of refrigeration = 12 000 Btu/h = 3.517 kW

- f_sun — 0.9 para una habitación muy sombreada, 1.1 para una muy soleada, 1 en los demás casos
- people — ocupantes habituales; la tabla ya cuenta con dos
- kitchen — suma 4 000 Btu/h si el equipo da servicio a una cocina

## Hipótesis y limitaciones

- La tabla supone techos de unos 8 ft (2.4 m), un aislamiento y unas ventanas medios y un clima típico. Los techos altos, las ventanas grandes orientadas al oeste, un aislamiento deficiente o un clima muy caluroso necesitan más capacidad.
- Dimensiona una sola habitación. Una vivienda completa con climatización central necesita un cálculo de cargas habitación por habitación, como el ACCA Manual J, que tiene en cuenta muros, ventanas, orientación e infiltraciones.
- Más grande no es mejor: un equipo sobredimensionado enfría el aire deprisa y se apaga antes de eliminar la humedad, y deja la habitación fría y húmeda.
- La regla práctica de 20 Btu/h por ft² se muestra solo para comparar.

## Ejemplo resuelto

Un salón mide 14 por 20 ft, recibe un sol fuerte por la tarde y lo usan tres personas casi todas las noches. ¿Qué tamaño de aire acondicionado necesita?

1. Superficie: 14 × 20 = 280 ft², que cae en la fila de 250 a 300 ft²: 7 000 Btu/h.
2. Muy soleado: 7 000 × 1.1 = 7 700 Btu/h.
3. Una persona más allá de dos: 7 700 + 600 = 8 300 Btu/h.
4. En otras unidades: 8 300 × 0.29307 = 2.43 kW, o 8 300 / 12 000 = 0.69 toneladas.

Así que elige un equipo de unos 8 000 a 9 000 Btu/h, en lugar de los 7 000 Btu/h que sugiere solo la superficie.

## Preguntas frecuentes

**¿Cuántos BTU necesito por pie cuadrado?**
Unos 20 Btu/h por ft² para una habitación media, bajando a unos 14 en espacios grandes y abiertos. La tabla de arriba es más precisa que una sola cifra.

**¿Qué aire acondicionado necesita una habitación de 12 × 12 ft?**
144 ft² caen en la fila de 100 a 150 ft², así que 5 000 Btu/h, o 5 500 con mucho sol.

**¿Cuántos pies cuadrados enfría un aire acondicionado de 12 000 BTU?**
De 450 a 550 ft² (42 a 51 m²) en condiciones normales.

**¿Cuántos BTU tiene una tonelada de aire acondicionado?**
12 000 Btu/h, el calor que funde una tonelada corta de hielo en 24 horas. Un equipo de 1.5 toneladas tiene 18 000 Btu/h.

**¿Cómo paso de BTU a kW?**
Multiplica los Btu/h por 0.293 para obtener vatios. Un equipo de 12 000 Btu/h da 3.5 kW de refrigeración.

**¿Es mejor un aire acondicionado más grande?**
No. Un equipo sobredimensionado hace ciclos cortos, elimina menos humedad, se desgasta antes y cuesta más. Dimensiónalo para la habitación.

## Calculadoras relacionadas

- [Pérdidas de calor de un edificio](../heat-loss/index.html): la parte de calefacción, con valores U.
- [Renovaciones de aire por hora y CFM](../air-changes/index.html): la ventilación de la habitación.
- [Calculadora del punto de rocío](../dew-point/index.html): humedad y confort.
- [Costo de la electricidad](../electricity-cost/index.html): el costo de funcionamiento del equipo.
