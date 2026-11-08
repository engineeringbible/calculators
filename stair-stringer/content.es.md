# Calculadora de escaleras: contrahuellas, huellas y zanca

**Resumen:** Número de contrahuellas y huellas, altura de contrahuella, desarrollo, longitud de la zanca y ángulo a partir de la altura total, según IRC o IBC.

## Introducción

¿Cómo se calcula una escalera? Divide la altura total entre la contrahuella más alta que admites y redondea hacia arriba para obtener el número de contrahuellas. Divide la altura entre ese número para obtener la altura igual de cada contrahuella. Una altura de 108 in con contrahuellas de 7.5 in como máximo necesita 15 contrahuellas de 7.2 in y 14 huellas. Con huellas de 10 in, la escalera tiene un desarrollo de 140 in y la zanca mide 176.8 in.

Esta calculadora traza un tramo recto a partir de la altura total, la contrahuella máxima y la profundidad de huella. Da las contrahuellas y las huellas, el desarrollo total, la longitud de la zanca, el ángulo y la cifra de comodidad 2R + T. Después comprueba el resultado con el International Residential Code (IRC) para viviendas o con el International Building Code (IBC) para otros edificios, los códigos modelo de EE. UU. Está pensada para carpinteros, constructores, proyectistas y propietarios que planean la escalera de una terraza, un sótano o un porche.

## Fórmulas

Contrahuellas, huellas y desarrollo:

    n = H / R_max, rounded up
    R = H / n
    treads = n − 1
    run = treads × T

Zanca, ángulo y comodidad:

    stringer = √(H² + run²)
    θ = atan(R / T)
    comfort = 2R + T

- H: altura total, de suelo terminado a suelo terminado
- R_max: la contrahuella más alta que admites; R: la altura real e igual de cada contrahuella
- T: profundidad de huella, de borde a borde de peldaño
- n: número de contrahuellas (redondeado hacia arriba); la contrahuella superior llega a la planta de arriba, así que hay una huella menos
- treads: número de huellas; run: desarrollo; stringer: zanca; θ: ángulo; comfort: comodidad

Límites normativos comprobados:

| Elemento | IRC R311.7 (viviendas) | IBC §1011 (otros edificios) |
|---|---|---|
| Altura de contrahuella | 7¾ in como máximo | de 4 a 7 in |
| Profundidad de huella | 10 in como mínimo | 11 in como mínimo |
| Altura libre | 6 ft 8 in | 80 in |
| Altura de un tramo | 151 in | 12 ft |

## Hipótesis y limitaciones

- La escalera es un tramo recto. Aquí no se diseñan peldaños compensados, escaleras de caracol ni descansillos.
- Todas las contrahuellas son iguales. El IRC permite que difieran como máximo ⅜ in, así que mide la altura entre las superficies de suelo terminado.
- La longitud de la zanca va por la línea de los bordes de peldaño. Corta la tabla más larga para permitir el corte de apoyo abajo y el colgador arriba.
- Las comprobaciones cubren contrahuellas, huellas, altura libre y altura de un tramo. El ancho, los pasamanos, las barandillas y los bordes de peldaño también tienen reglas normativas, y las modificaciones locales pueden cambiarlas.

## Ejemplo resuelto

La escalera de un sótano sube 108 in de suelo a suelo. El constructor quiere contrahuellas de 7.5 in como máximo y huellas de 10 in. Traza la escalera y compruébala con el IRC.

1. Contrahuellas: 108 / 7.5 = 14.4, así que 15 contrahuellas.
2. Altura de contrahuella: 108 / 15 = 7.2 in, por debajo del máximo del IRC de 7¾ in.
3. Huellas: 15 − 1 = 14 huellas de 10 in, que cumplen el mínimo de 10 in.
4. Desarrollo total: 14 × 10 = 140 in, o 11 ft 8 in.
5. Longitud de la zanca: √(108² + 140²) = 176.8 in, o 14.7 ft.
6. Comodidad: 2 × 7.2 + 10 = 24.4 in, dentro del rango de 24 a 25 in.

El ángulo de la escalera es 35.8°. Con 14 contrahuellas, cada una mediría 7.71 in y 2R + T sería 25.4 in, más empinada de lo cómodo.

## Preguntas frecuentes

**¿Cuál es la altura máxima de contrahuella?**
7¾ in en viviendas según el IRC y 7 in en otros edificios según el IBC. El IBC también fija una contrahuella mínima de 4 in.

**¿Cuál es la profundidad mínima de huella?**
10 in en viviendas según el IRC y 11 in según el IBC, medidas en horizontal de borde a borde de peldaño.

**¿Cuántos peldaños necesito para una altura de 8 ft?**
96 in divididas entre 7¾ in dan 12.4, así que 13 contrahuellas de 7.38 in y 12 huellas según el IRC.

**¿Qué es la regla 2R + T?**
Dos contrahuellas más una huella deben equivaler a un paso cómodo, de 24 a 25 in. Se remonta a François Blondel, en 1675.

**¿Qué longitud debe tener la zanca de una escalera?**
Al menos la longitud a lo largo de la línea de los bordes de peldaño, √(rise² + run²), más un extra para los cortes de arriba y de abajo.

**¿Cuánta altura libre necesita una escalera?**
6 ft 8 in libres sobre la línea de los bordes de peldaño según el IRC, y 80 in según el IBC.

**¿Qué ángulo debe tener una escalera?**
Las normas lo fijan mediante los límites de contrahuella y huella. La escalera más empinada del IRC, 7¾ in sobre 10 in, tiene 37.8°; el límite del IBC de 7 in sobre 11 in da 32.5°.

## Calculadoras relacionadas

- [Calculadora de pendiente de tejado](../roof-pitch/index.html): elevación y recorrido de un tejado, trazados del mismo modo.
- [Calculadora de pendiente](../slope/index.html): rampas, pendiente en porcentaje y ángulo.
- [Calculadora de losa de hormigón](../concrete-slab/index.html): la losa de apoyo al pie de la escalera.
- [Calculadora de bloques de hormigón](../concrete-block/index.html): muros de bloques que sostienen una escalera o un descansillo.
