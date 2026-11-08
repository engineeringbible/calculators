# Calculadora de pendiente de tejado: cabios, superficie y tejas

**Resumen:** Pendiente del tejado en x/12, grados y porcentaje, longitud de los cabios, altura de cumbrera, superficie de cubierta y paquetes de tejas asfálticas.

## Introducción

¿Qué es la pendiente de un tejado? En la práctica de EE. UU. (pitch) es la elevación del tejado en pulgadas por cada 12 in de recorrido horizontal. Un tejado 6/12 sube 6 in por pie, lo que equivale a 26.6° o a una pendiente del 50 %. Multiplica cualquier longitud en planta por el multiplicador de pendiente, √(1 + (pitch/12)²), para obtener la longitud a lo largo del faldón. Para 6/12 ese multiplicador es 1.118, así que una casa de 24 × 40 ft con vuelos de 1 ft tiene 1 221 ft² de cubierta.

Esta calculadora convierte entre pendiente x/12, ángulo y porcentaje, y resuelve un tejado a dos aguas a partir de su planta: longitud del cabio, altura de la cumbrera, superficie de cubierta, squares de cubierta y paquetes de tejas. Está pensada para techadores, carpinteros de armar y propietarios que presupuestan un tejado nuevo. Para pendientes generales, rampas y desniveles, usa la calculadora de pendiente.

## Fórmulas

Pendiente, ángulo y multiplicador:

    s = pitch / 12 = tan θ
    k = √(1 + s²)

Tejado a dos aguas:

    rafter = (span / 2 + eave overhang) × k
    ridge height = (span / 2) × s
    area = (span + 2 × eave) × (length + 2 × rake) × k
    squares = area × (1 + waste) / 100 ft²
    bundles = squares × 3, rounded up

- pitch: elevación en pulgadas por cada 12 in de recorrido; θ: ángulo del tejado; s: pendiente como fracción
- span: ancho del edificio de muro a muro; length: longitud a lo largo de la cumbrera
- eave, rake: vuelos horizontales en los aleros y en los hastiales
- k: multiplicador de pendiente, longitud inclinada por unidad de recorrido horizontal
- rafter: cabio; ridge height: altura de la cumbrera; area: superficie de cubierta; waste: desperdicio; bundles: paquetes, redondeados hacia arriba

| Pendiente | Ángulo | Multiplicador |
|---|---|---|
| 4/12 | 18.4° | 1.054 |
| 6/12 | 26.6° | 1.118 |
| 8/12 | 33.7° | 1.202 |
| 12/12 | 45.0° | 1.414 |

## Hipótesis y limitaciones

- El tejado es un dos aguas simple con dos faldones iguales sobre un rectángulo. Las limatesas, las limahoyas y las buhardillas requieren sumar cada faldón por separado.
- La longitud del cabio va del eje de la cumbrera al final del vuelo. Descuenta la mitad del espesor de la tabla de cumbrera al cortarlo.
- Un square son 100 ft² de cubierta. La mayoría de las tejas de tres lengüetas y laminadas vienen en tres paquetes por square, pero comprueba tu producto.
- El margen por desperdicio cubre las hileras de arranque, las piezas de cumbrera y los cortes. Un dos aguas sencillo necesita alrededor de un 10 %; los tejados con muchos encuentros necesitan más.
- Las tejas asfálticas necesitan una pendiente de al menos 2/12. Desde 2/12 hasta 4/12, el IRC (International Residential Code de EE. UU.) exige dos capas de membrana bajo teja.

## Ejemplo resuelto

Una casa mide 24 ft de ancho y 40 ft de largo, con un tejado a dos aguas 6/12 y vuelos de 1 ft en los aleros y en los hastiales. Calcula la longitud del cabio, la superficie de cubierta y las tejas con un 10 % de desperdicio.

1. Multiplicador: √(1 + 0.5²) = 1.118.
2. Cabio: (24 / 2 + 1) × 1.118 = 14.53 ft.
3. Altura de la cumbrera sobre la solera del muro: 12 × 0.5 = 6 ft.
4. Superficie en planta con vuelos: 26 × 42 = 1 092 ft².
5. Superficie de cubierta: 1 092 × 1.118 = 1 221 ft².
6. Squares con desperdicio: 1 221 × 1.10 / 100 = 13.43.
7. Paquetes: 13.43 × 3 = 40.3, así que compra 41 paquetes.

El ángulo del tejado es 26.6°. Los cabios se suelen comprar en pasos de 2 ft, así que una tabla de 16 ft cubre el cabio de 14.53 ft con margen para los cortes.

## Preguntas frecuentes

**¿Cómo convierto la pendiente de un tejado a grados?**
Calcula el arcotangente de la pendiente dividida entre 12. Un tejado 4/12 tiene 18.4°, 6/12 tiene 26.6°, 8/12 tiene 33.7° y 12/12 tiene 45°.

**¿Qué es el multiplicador de pendiente?**
La longitud a lo largo del tejado por cada unidad de recorrido horizontal, √(1 + (pitch/12)²). Multiplica por él la superficie en planta para obtener la superficie de cubierta.

**¿Cuántos paquetes de tejas hay en un square?**
La mayoría de las tejas estándar vienen en tres paquetes por square de 100 ft². Algunos productos más pesados llevan más paquetes por square, así que comprueba el envoltorio.

**¿Cuántos squares tiene un tejado de 2 000 ft²?**
20 squares, o 22 con un 10 % de desperdicio, que son 66 paquetes a tres por square.

**¿Cuál es la pendiente mínima para tejas asfálticas?**
2/12 según IRC R905.2.2. Las pendientes desde 2/12 hasta 4/12 necesitan una capa doble de membrana bajo teja.

**¿Cómo mido la pendiente de un tejado existente?**
Apoya un nivel de 12 in de largo contra el tejado, en horizontal, y mide la distancia vertical desde su extremo hasta el tejado. Esa distancia en pulgadas es la pendiente.

## Calculadoras relacionadas

- [Calculadora de pendiente](../slope/index.html): pendiente en porcentaje, grados, proporción y x/12 para cualquier pendiente.
- [Calculadora de escaleras](../stair-stringer/index.html): contrahuella y huella de una escalera.
- [Calculadora de carga de nieve](../snow-load/index.html): la nieve sobre el tejado, que depende de su pendiente.
- [Calculadora de carga de viento](../wind-load/index.html): presión del viento sobre el tejado y los muros.
