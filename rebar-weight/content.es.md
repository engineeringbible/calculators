# Calculadora de peso y cantidad de varillas de acero corrugado

**Resumen:** Peso por pie o metro de las barras de armadura #3–#18 de EE. UU. y métricas, y número, longitud y peso de las barras de una malla a cualquier separación.

## Introducción

Las barras de armadura (varillas de acero corrugado) se piden por peso, pero se colocan por número y separación. Una barra #4, de media pulgada de diámetro, pesa 0.668 lb por pie; una barra métrica de 12 mm pesa 0.888 kg por metro. Una losa de 20 × 20 ft con barras #4 a 12 in en cada dirección necesita 40 barras, 780 ft de barra y unas 520 lb de acero antes de solapes.

Esta calculadora da el peso por longitud de las barras de EE. UU. #3 a #18 y de las barras métricas de 6 a 50 mm, y cuenta las barras, la longitud total y el peso, ya sea a partir de un número de piezas o de una malla de losa o muro a una separación dada. También da el área de acero por pie o metro de ancho, la cifra que el proyectista compara con la armadura necesaria.

## Fórmulas

Masa por metro de una barra métrica (la regla d²/162):

    m' = 7 850 × π d² / 4 = 0.006165 d²    kg/m, d in mm

Barras de una malla, en cada dirección:

    N = floor( (S − 2c) / s ) + 1,   each of length L − 2c
    total length = Σ N × (L − 2c) × layers × (1 + allowance)

Área de acero por ancho:

    A_s = A_bar / s        in² per ft or mm² per m

- S: la luz sobre la que se reparten las barras; L: la longitud que recorren
- s: separación; c: recubrimiento en los bordes
- N: número de barras; layers: capas; allowance: margen por solapes y desperdicio; A_bar: área de una barra
- Barras de EE. UU.: área y peso unitario según la tabla 1 de ASTM A615 (#4: 0.20 in², 0.668 lb/ft)

## Hipótesis y limitaciones

- Los pesos unitarios de EE. UU. son los valores nominales de ASTM A615. Las barras métricas usan 7 850 kg/m³ sobre el diámetro nominal.
- Las barras de la malla recorren toda la longitud menos el recubrimiento en cada extremo. Los ganchos, los doblados, los solapes y los separadores van en el porcentaje de margen. Un solape suele ser de 40 a 60 diámetros de barra.
- El diámetro y la separación de las barras salen del diseño estructural y de la norma (ACI 318, EN 1992-1-1). Esta página estima cantidades para hacer el pedido.
- El recuento de barras redondea hacia abajo los espacios y añade una barra, así que las barras de borde quedan a la distancia del recubrimiento. Algunos delineantes añaden una barra más cuando el último espacio es corto.

## Ejemplo resuelto

Una losa de 20 × 20 ft tiene una sola malla de barras #4 a 12 in en cada dirección, con 3 in de recubrimiento en los bordes. ¿Cuánto acero hace falta?

1. Barras a lo largo de 20 ft: (240 − 2 × 3) / 12 = 19.5, así que floor 19 + 1 = 20 barras.
2. Cada barra mide 240 − 6 = 234 in, o 19.5 ft. La otra dirección es igual.
3. Total: 40 barras, 40 × 19.5 = 780 ft.
4. Peso: 780 × 0.668 = 521.0 lb.

Con un 10 % de margen por solapes y desperdicio, pide unas 575 lb, que son 43 barras de 20 ft.

## Preguntas frecuentes

**¿Cuánto pesa la varilla #4?**
0.668 lb por pie, así que una barra de 20 ft pesa 13.4 lb. La #3 pesa 0.376 y la #5 1.043 lb por pie.

**¿Cuánto pesa por metro una varilla de 12 mm?**
0.888 kg/m. Una barra de 12 m pesa 10.7 kg.

**¿Qué significa el número de la varilla?**
El número de barra de EE. UU. es el diámetro en octavos de pulgada hasta la #8: la #4 es 4/8 = 0.5 in. Las barras mayores son equivalentes redondeados.

**¿Cómo calculo el número de barras de una losa?**
Resta dos veces el recubrimiento al ancho, divide entre la separación, redondea hacia abajo y suma una. Haz lo mismo en la otra dirección.

**¿Qué es la regla d²/162?**
El peso de una barra métrica en kg/m es aproximadamente su diámetro en mm al cuadrado dividido entre 162: 16² / 162 = 1.58 kg/m.

**¿Cuánta armadura lleva una yarda cúbica de hormigón?**
Depende del elemento: las losas sobre terreno suelen llevar de 50 a 100 lb por yarda cúbica, y las losas estructurales y las vigas de 150 a 300 lb. Lo fija el diseño.

## Calculadoras relacionadas

- [Peso del acero y de otros metales](../metal-weight/index.html): pesos de chapas, barras y perfiles.
- [Calculadora de losa de hormigón](../concrete-slab/index.html): el hormigón de la losa.
- [Volumen de hormigón y peso de armadura](../concrete-volume/index.html): materiales de la mezcla y cuantías de acero.
- [Calculadora de zapatas de hormigón](../concrete-footing/index.html): cantidades para zapatas.
