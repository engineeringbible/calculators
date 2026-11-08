# Calculadora de losa de hormigón

**Resumen:** Metros cúbicos o yardas cúbicas de hormigón para una losa, patio, entrada o base de caseta, con desperdicio, sacos de 80, 60 o 40 lb, peso y costo.

## Introducción

¿Cuánto hormigón (concreto) necesita una losa? Multiplica la longitud, el ancho y el espesor, y añade un poco por desperdicio. La dificultad está en las unidades: las losas se miden en pies y pulgadas, el hormigón premezclado se vende por yarda cúbica y los sacos se venden por peso. Un patio de 10 × 10 ft y 4 in de espesor necesita 1.23 yardas cúbicas, o 62 sacos de 80 lb una vez añadido el desperdicio.

Esta calculadora hace la conversión para cualquier losa rectangular: patios, aceras, entradas de vehículos, bases de casetas y de jacuzzis, suelos de garaje. Da el volumen en yardas cúbicas, pies cúbicos o metros cúbicos, el número de sacos de hormigón preparado de cada tamaño, el peso y el costo si introduces tus precios locales.

## Fórmulas

Volumen de la losa y volumen a pedir:

    V = L × W × t × n
    V_order = V × (1 + waste)

Conversiones de unidades y sacos:

    cubic yards = cubic feet / 27
    bags = V_order / bag yield, rounded up

- L, W: longitud y ancho; t: espesor, con las pulgadas divididas entre 12 para obtener pies
- n: número de losas iguales
- waste: margen por derrames y terreno irregular, del 5 al 10 % en losas
- bag yield: rendimiento del saco, 0.60 ft³ para 80 lb, 0.45 ft³ para 60 lb, 0.375 ft³ para 50 lb, 0.30 ft³ para 40 lb, 11.7 L para 25 kg
- cubic yards, cubic feet: yardas cúbicas y pies cúbicos; bags: sacos, redondeados hacia arriba

## Hipótesis y limitaciones

- La losa es un rectángulo de espesor uniforme. Divide una losa en L en dos rectángulos. No se incluyen los bordes engrosados ni la base de grava.
- Los espesores residenciales habituales son 4 in (100 mm) para patios y aceras, y 5 a 6 in (125 a 150 mm) para entradas de vehículos y suelos de garaje. Una losa que soporta un edificio o vehículos pesados necesita el diseño de un ingeniero.
- Los rendimientos de los sacos son los impresos en los sacos de hormigón preparado de EE. UU. Los sacos métricos usan el mismo rendimiento por kilogramo, así que comprueba la etiqueta de tu marca.
- El peso usa 2 400 kg/m³, unas 150 lb/ft³, para hormigón normal.

## Ejemplo resuelto

Un patio mide 10 ft por 10 ft y tiene 4 in de espesor. ¿Cuánto hormigón hace falta con un 10 % de desperdicio, y cuántos sacos de 80 lb?

1. Espesor en pies: 4 / 12 = 0.333 ft.
2. Volumen: 10 × 10 × 0.333 = 33.3 ft³, que son 33.3 / 27 = 1.23 yd³.
3. Con un 10 % de desperdicio: 33.3 × 1.10 = 36.7 ft³, o 1.36 yd³.
4. Sacos de 80 lb: 36.7 / 0.60 = 61.1, así que compra 62 sacos.

La losa pesa unas 4 990 lb, o 2.3 toneladas. Con 1.36 yd³, una entrega pequeña de hormigón premezclado puede ser más sencilla que mezclar 62 sacos a mano.

## Preguntas frecuentes

**¿Cuántos sacos de hormigón necesito para una losa de 10 × 10?**
Con 4 in de espesor, 56 sacos de 80 lb sin desperdicio y 62 con un 10 % de desperdicio. Con 6 in de espesor, 84 sacos sin desperdicio.

**¿Qué espesor debe tener una losa de hormigón?**
4 in para patios, aceras y bases de casetas; 5 a 6 in para entradas de vehículos y suelos de garaje que soportan coches. Las cargas más pesadas necesitan una losa más gruesa con armadura.

**¿Cuántas yardas cúbicas tiene una losa de 20 × 20?**
Con 4 in de espesor, 133 ft³ o 4.94 yd³; pide de 5.25 a 5.5 yd³ con el desperdicio.

**¿Uso sacos u hormigón premezclado?**
Los sacos convienen para trabajos pequeños, por debajo de una yarda cúbica aproximadamente. Por encima, el hormigón premezclado en camión suele costar menos, ahorra horas de mezclado y da una losa más uniforme.

**¿Cuánto desperdicio debo prever?**
Un 5 % para losas bien encofradas sobre una base nivelada y compactada, y un 10 % para terreno irregular o un primer vertido. Es más barato que sobre un poco que quedarse corto a mitad del vertido.

**¿Cuánto pesa una losa de hormigón?**
Unas 50 lb por pie cuadrado con 4 in de espesor, o 2.4 toneladas por metro cúbico.

## Calculadoras relacionadas

- [Calculadora de sacos de hormigón](../concrete-bags/index.html): sacos de cada tamaño para cualquier volumen.
- [Calculadora de zapatas de hormigón](../concrete-footing/index.html): zapatas corridas y aisladas.
- [Calculadora de columnas de hormigón y hoyos para postes](../concrete-column/index.html): columnas redondas, pilares y postes de valla.
- [Volumen de hormigón y peso de armadura](../concrete-volume/index.html): muros y columnas con materiales de la mezcla y armadura.
