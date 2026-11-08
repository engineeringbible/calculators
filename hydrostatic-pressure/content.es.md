# Calculadora de presión hidrostática

**Resumen:** Presión manométrica y absoluta a una profundidad en agua, agua de mar, combustible u otro líquido, su altura en metros de agua y la fuerza sobre una superficie.

## Introducción

La presión en un líquido en reposo crece de forma constante con la profundidad, porque cada capa soporta el peso de todo el líquido que tiene encima. Esa regla sencilla fija la carga sobre el fondo de un tanque, la presión de prueba de una tubería vertical, la lectura de un indicador de nivel, la presión sobre un buceador, la carga sobre una escotilla bajo la línea de flotación y la altura estática que debe vencer una bomba.

Esta calculadora da la presión manométrica a cualquier profundidad en agua dulce, agua de mar, combustible marino, aceite lubricante o un líquido propio, y la presión absoluta sumando la atmósfera o la presión de un tanque. También muestra la altura en metros de columna de agua, el aumento de presión por metro y la fuerza sobre una superficie horizontal, como el fondo de un tanque o una escotilla. Está pensada para ingenieros navales, civiles, mecánicos y de procesos, y para buceadores y estudiantes.

## Fórmulas

Presión manométrica y absoluta:

    p_gauge = ρ × g × h
    p_abs = p_surface + ρ × g × h

Altura en metros de columna de agua y fuerza sobre una superficie horizontal:

    H = p_gauge / (1000 × g)
    F = p_gauge × A

- ρ — densidad del líquido, kg/m³ (agua dulce 998.2, agua de mar 1025.87)
- g — 9.806 65 m/s²
- h — profundidad bajo la superficie libre, m
- p_surface — presión sobre la superficie, Pa (101.325 kPa a nivel del mar)
- A — área horizontal, m²

## Hipótesis y limitaciones

- El líquido está en reposo y tiene densidad uniforme. Un tanque con capas de distinta temperatura, o una mezcla, necesita una densidad media.
- Se usa la gravedad normal. La gravedad local difiere hasta un 0.3 % con la latitud y la altitud.
- La presión en la superficie es por defecto la atmósfera estándar a nivel del mar. Para un tanque presurizado, introduce su presión absoluta; en altitud, introduce la presión atmosférica local.
- La fuerza se calcula sobre una superficie horizontal, donde la presión es la misma en todos los puntos. En una pared vertical la presión aumenta con la profundidad, y la media actúa en el centroide de la pared.

## Ejemplo resuelto

¿Qué presión soporta una chapa del casco a 30 m bajo la superficie del mar?

1. Densidad del agua de mar a 15 °C: ρ = 1025.87 kg/m³.
2. Presión manométrica: p = 1025.87 × 9.806 65 × 30 = 301 810 Pa = 301.8 kPa, es decir, 3.02 bar.
3. Presión absoluta: 301.8 + 101.3 = 403.1 kPa, unas cuatro atmósferas.
4. La presión aumenta 10.06 kPa por cada metro de agua de mar.

En agua dulce, la misma profundidad da 293.7 kPa manométricos, un 2.7 % menos, y por eso los cálculos de calado y estabilidad deben usar la densidad de agua correcta.

## Preguntas frecuentes

**¿Qué diferencia hay entre presión manométrica y absoluta?**
La presión manométrica se mide sobre la atmósfera que rodea al punto, y es la que muestran la mayoría de los manómetros. La presión absoluta suma la atmósfera y se mide desde el vacío perfecto.

**¿Cuánto aumenta la presión por metro de agua?**
Unos 9.8 kPa por metro en agua dulce y 10.1 kPa en agua de mar. Es aproximadamente un bar, o una atmósfera, cada diez metros.

**¿Importa la forma del tanque?**
No. La presión a una profundidad dada depende solo de la profundidad y de la densidad, no de la forma ni de la anchura del tanque. Es la paradoja hidrostática.

**¿Qué fuerza actúa sobre el fondo de un tanque?**
La presión manométrica en el fondo por su área. Un fondo de 2 m × 3 m bajo 4 m de fuelóleo soporta unos 195 kN, el peso del aceite que tiene encima.

**¿Qué es un metro de columna de agua?**
Una unidad de presión igual a la presión en el fondo de 1 m de agua, 9.81 kPa. Las alturas de las bombas y las presiones bajas se expresan a menudo así.

**¿El agua se comprime en profundidad?**
Ligeramente, un 0.5 % cada 1000 m. Para las profundidades habituales en ingeniería, el resultado con densidad constante es preciso; en el océano profundo subestima un poco la presión.

## Calculadoras relacionadas

- [Ecuación de Bernoulli y venturi](../bernoulli/index.html): el mismo balance de presiones para un fluido en movimiento.
- [Volumen de tanques y llenado parcial](../tank-volume/index.html): cuánto líquido hay sobre el fondo.
- [Volumen de tubería y masa del contenido](../pipe-volume/index.html): el contenido de una tubería vertical.
- [Draft survey (control de calados)](../draft-survey/index.html): la densidad del agua en el desplazamiento del buque.
