# Calculadora de ladrillos: ladrillos y mortero para un muro

**Resumen:** Número de ladrillos para un muro según su superficie menos huecos, para ladrillo modular, estándar, métrico o a medida, de una o dos hojas, con mortero.

## Introducción

¿Cuántos ladrillos necesitas? Divide la superficie del muro entre la cara de un ladrillo más una junta de mortero. Un ladrillo modular de 7⅝ × 2¼ in, colocado con juntas de ⅜ in, ocupa 8 × 2⅝ in, así que un pie cuadrado de muro lleva 6.86 ladrillos. Un muro de 148 ft², una vez descontada una ventana, necesita 1 015 ladrillos, o 1 066 con un 5 % por cortes y roturas.

Esta calculadora cuenta los ladrillos de un muro para cualquier ladrillo habitual de EE. UU., el ladrillo métrico británico o un tamaño que introduzcas. Admite una o dos hojas, descuenta puertas y ventanas y añade el desperdicio. También da el volumen de mortero en las juntas y los sacos de mortero preparado. Está pensada para albañiles, constructores y propietarios que presupuestan un muro, un revestimiento de ladrillo o un proyecto de jardín.

## Fórmulas

Ladrillos:

    bricks per area = 1 / ((L + j) × (H + j))
    bricks = A_net × bricks per area × wythes × (1 + waste)

Mortero, con el método de la BIA Technical Note 10 (nota técnica de la Brick Industry Association):

    mortar per brick = ((L + j) × (H + j) − L × H) × W
    collar joint = A_net × j   (double wythe only)

- L, H, W: longitud, altura y ancho especificados del ladrillo
- j: espesor de la junta de mortero, ⅜ in en EE. UU. y 10 mm en la albañilería métrica
- A_net: superficie del muro menos puertas y ventanas
- wythes: una o dos hojas de ladrillo
- bricks: ladrillos; waste: desperdicio; mortar per brick: mortero por ladrillo; collar joint: junta intermedia entre hojas (solo con dos hojas)

| Ladrillo | Tamaño, in | Ladrillos por ft² con juntas de ⅜ in |
|---|---|---|
| Modular | 7⅝ × 2¼ × 3⅝ | 6.86 |
| Estándar | 8 × 2¼ × 3⅝ | 6.55 |
| Queen | 7⅝ × 2¾ × 2¾ | 5.76 |
| Norman | 11⅝ × 2¼ × 3⅝ | 4.57 |
| Utility | 11⅝ × 3⅝ × 3⅝ | 3.00 |

## Hipótesis y limitaciones

- El muro se coloca a soga o en aparejo apilado, con juntas uniformes. Los aparejos con hiladas a tizón usan más ladrillos; la BIA TN 10 da los factores de corrección.
- La BIA TN 10 da 675 ladrillos modulares por 100 ft² porque tres hiladas modulares ocupan exactamente 8 in. Con juntas de exactamente ⅜ in salen 686.
- El volumen de mortero es el volumen teórico de juntas llenas, sin desperdicio. Reproduce la cifra de la BIA de 8.1 ft³ por cada 1 000 ladrillos modulares.
- Los sacos usan el rendimiento de QUIKRETE de 37 ladrillos estándar por saco de 80 lb de mortero preparado, escalado al ladrillo elegido. Ese rendimiento incluye las caídas y el desperdicio normales.
- Los muros de ladrillo de carga o de gran altura necesitan el diseño de un ingeniero.

## Ejemplo resuelto

Un muro mide 20 ft de largo y 8 ft de alto, con una ventana de 12 ft². Es de ladrillo modular con juntas de ⅜ in y una sola hoja. ¿Cuántos ladrillos y cuánto mortero se necesitan con un 5 % de desperdicio?

1. Superficie neta: 20 × 8 − 12 = 148 ft².
2. Ladrillos por pie cuadrado: 144 / (8 × 2.625) = 6.857.
3. Ladrillos: 148 × 6.857 = 1 014.9, así que 1 015 ladrillos sin desperdicio.
4. Con un 5 % de desperdicio: 1 015 × 1.05 = 1 066 ladrillos.
5. Mortero por ladrillo: (8 × 2.625 − 7.625 × 2.25) × 3.625 = 13.93 in³, u 8.06 ft³ por cada 1 000 ladrillos.
6. Mortero para el muro: 1 014.9 × 13.93 in³ = 8.18 ft³.
7. Sacos: a 37 ladrillos estándar por saco, 27 sacos de 80 lb de mortero preparado.

El mortero teórico se acerca a los 8.1 ft³ por cada 1 000 ladrillos de la tabla 4 de la BIA TN 10.

## Preguntas frecuentes

**¿Cuántos ladrillos hay en un pie cuadrado?**
6.86 ladrillos modulares con juntas de ⅜ in, o 6.75 según la modulación de hiladas de la BIA. Los ladrillos estándar dan 6.55 por pie cuadrado.

**¿Cuántos ladrillos hay en un metro cuadrado?**
59.3 ladrillos británicos de 215 × 65 mm con juntas de 10 mm, que se suelen redondear a 60.

**¿Cuántos ladrillos lleva un muro de dos hojas?**
El doble que uno de una hoja. La junta intermedia rellena de mortero entre las hojas añade 3.13 ft³ de mortero por cada 100 ft² con ⅜ in de espesor.

**¿Cuánto mortero necesitan 1 000 ladrillos?**
Unos 8.1 ft³ de mortero de junta para ladrillo modular con juntas de ⅜ in, y 10.3 ft³ con juntas de ½ in. El consumo real es mayor por las caídas.

**¿Cuántos ladrillos se colocan con un saco de mortero?**
QUIKRETE indica hasta 37 ladrillos estándar por saco de 80 lb de Mortar Mix. Los albañiles suelen calcular ocho sacos de cemento de albañilería, mezclado con arena, por cada 1 000 ladrillos.

**¿Cuánto desperdicio debo prever en ladrillos?**
Alrededor de un 5 % en muros lisos. Prevé más con muchos huecos, esquinas y ladrillos cortados.

## Calculadoras relacionadas

- [Calculadora de bloques de hormigón](../concrete-block/index.html): bloques de hormigón, mortero y lechada.
- [Cobertura y cantidad de pintura](../paint-coverage/index.html): superficies de muro menos huecos para recubrimientos.
- [Calculadora de zapatas de hormigón](../concrete-footing/index.html): la zapata bajo un muro de ladrillo.
- [Calculadora de empuje de tierras en muros de contención (Rankine)](../retaining-wall/index.html): presión del terreno sobre un muro de contención de jardín.
