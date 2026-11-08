# Calculadora de volumen de hormigón y peso de armadura

**Resumen:** Volumen y masa de hormigón para losas, muros, zapatas y columnas con desperdicio, cemento, arena y grava por dosificación, y longitud y masa de armadura.

## Introducción

Antes de un hormigonado necesitas tres cifras: cuánto hormigón (concreto) pedir, cuánto cemento, arena y árido si amasas en obra, y cuánta armadura comprar. Esta calculadora las da para los elementos habituales (losas y losas de cimentación, muros, zapatas y vigas, columnas rectangulares y circulares), multiplicadas por el número de elementos iguales, con un margen por desperdicio en el hormigón, el desglose clásico de materiales por dosificación nominal y la armadura a partir de una malla de barras a una separación o de un conjunto de barras longitudinales con estribos. También da la cuantía de acero en kg/m³ frente a los rangos típicos, como comprobación de sentido común de la disposición.

Está pensada para jefes de obra y técnicos de mediciones que hacen mediciones, para obras marítimas y portuarias donde se hormigonan pedestales, cimentaciones y elementos de muelle, y para estudiantes que aprenden a hacer estimaciones.

## Fórmulas

Volúmenes:

    Slab / footing:  V = L × W × t,    Wall:  V = L × H × t
    Rectangular column:  V = b × d × H,    Round column:  V = π D² H / 4
    V_net = V × count,    V_order = V_net (1 + waste),    m = ρ_concrete V_net

Dosificación nominal 1 : a : b en volumen (factor de volumen seco 1.54, densidad aparente del cemento 1 440 kg/m³):

    dry volume = 1.54 V_order
    cement volume = dry volume / (1 + a + b),    cement mass = cement volume × 1 440,    bags = mass / bag size
    sand = a × cement volume,    aggregate = b × cement volume

Armadura:

    bar mass per metre = 7 850 × π d²/4 ≈ d² / 162   (kg/m, d in mm)
    Mesh: bars along A = floor(B / s) + 1, bars along B = floor(A / s) + 1, length per layer = (bars along A) A + (bars along B) B
    Bars + links: main length = n × member length; link length = (floor(member length / s_link) + 1) × [2 (a − 2c) + 2 (b − 2c) + 20 d_link]
    total = (main + links) × count × (1 + lap allowance)
    steel ratio = steel mass / V_net

Cuantías de acero típicas: losas 80–120, muros 80–150, cimentaciones 60–150, columnas 150–300 kg/m³.

## Hipótesis y limitaciones

- Volúmenes geométricos brutos; no se descuentan huecos, chaflanes ni elementos embebidos. El factor de desperdicio (5–10 %) es para sobreexcavación, derrames y deformación del encofrado.
- Densidad del hormigón 2 400 kg/m³ (EN 1991-1-1); el hormigón armado tiene unos 2 500 kg/m³, diferencia que cubre la masa de acero calculada aparte.
- El desglose por dosificación nominal es la regla tradicional de estimación y da los volúmenes de material suelto a amasar; una mezcla diseñada o un hormigón premezclado siguen el diseño de mezcla y el contenido de cemento del proveedor.
- Las disposiciones de armadura están simplificadas: barras de longitud completa a la separación en cada dirección por capa, o barras longitudinales con estribos perimetrales; el recubrimiento, los doblados, los ganchos, los separadores, las esperas y las barras de refuerzo solo se cubren con el porcentaje de solapes/desperdicio (10–15 % típico).
- Las cuantías de acero son una comprobación de estimación frente a rangos típicos, no una verificación estructural; los diámetros, las separaciones y el recubrimiento salen del proyecto.
- Los tamaños de saco varían (25, 40, 50 kg); introduce el tuyo.

## Ejemplo resuelto

Losa sobre terreno de 10 m × 5 m × 200 mm, un solo hormigonado, 10 % de desperdicio, dosificación nominal 1 : 2 : 4 amasada en obra con sacos de 50 kg, armada con barras de 12 mm a 200 mm en ambas direcciones en dos capas, 10 % de margen por solapes.

1. Volumen: 10 × 5 × 0.2 = 10.0 m³ netos; pedir 11.0 m³; masa 24.0 t.
2. Materiales para 11 m³: volumen seco 16.9 m³; cemento 16.9/7 = 2.42 m³ = 3 485 kg = 69.7 sacos; arena 4.84 m³; árido 9.68 m³. Por m³ de hormigón son 317 kg de cemento, los conocidos 6.3 sacos.
3. Armadura: en la dirección de 10 m, floor(5/0.2) + 1 = 26 barras × 10 m = 260 m; en la dirección de 5 m, 51 barras × 5 m = 255 m; 515 m por capa, 1 030 m en dos capas, 1 133 m con solapes. A 0.888 kg/m (12 mm) son 1 006 kg.
4. Cuantía de acero: 1 006 / 10 = 101 kg/m³, dentro de los 80–120 kg/m³ típicos de las losas. Masa total armada 25.0 t.

Una columna de 400 × 400 mm y 3 m de altura con 8 barras de 20 mm y estribos de 8 mm a 200 mm (40 mm de recubrimiento) contiene 0.48 m³ de hormigón y unos 68 kg de acero: 142 kg/m³ antes de solapes, en el extremo bajo del rango de columnas.

## Preguntas frecuentes

**¿Por qué pedir más que el volumen neto?**
La sobreexcavación, la deformación del encofrado, los derrames y la tubería de la bomba consumen hormigón; un 5–10 % extra es normal en obra in situ, y más en excavaciones irregulares.

**¿De dónde sale el factor 1.54?**
El cemento, la arena y el árido secos y sueltos ocupan alrededor de un 54 % más de volumen que el hormigón compactado que producen, porque los materiales finos rellenan los huecos entre los gruesos y la mezcla se consolida.

**¿Cuántos sacos hacen falta para un metro cúbico?**
Con 1 : 2 : 4, unos 6.3 sacos de 50 kg (317 kg); con 1 : 1.5 : 3, unos 8 sacos (403 kg); con 1 : 3 : 6, unos 4.4 sacos (222 kg). Las mezclas diseñadas para ambiente marino suelen especificar 350–400 kg/m³, sin importar estas proporciones.

**¿Qué es la regla d²/162?**
La masa de una barra de acero en kg por metro es d² (mm) dividido entre 162: 0.888 kg/m para 12 mm y 2.47 kg/m para 20 mm. Sale de 7 850 kg/m³ y del área de la barra.

**¿Está mal el diseño si mi cuantía de acero queda fuera del rango típico?**
No necesariamente: los rangos son promedios sobre elementos completos. Revisa primero los datos de la disposición (separación, capas, número de barras) y después el diseño; las vigas de transferencia muy cargadas pueden superar los 300 kg/m³.

**¿La calculadora sirve para mallas electrosoldadas (A142, A393)?**
Introduce el diámetro y la separación de barra equivalentes (A142: 6 mm a 200 mm; A393: 10 mm a 200 mm) como una sola capa; la masa coincide con las tablas de mallas dentro del margen por solapes.

**¿Qué dosificación para estructuras marinas?**
Las clases de exposición XS1–XS3 (EN 206) exigen mezclas diseñadas con baja relación agua/cemento, alto contenido de cemento y a menudo cementos con adiciones; las dosificaciones nominales de aquí sirven para estimar los materiales, no para especificar la durabilidad.

## Calculadoras relacionadas

- [Flecha y tensión de flexión en vigas](../beam-deflection/index.html): las vigas que forman estas cantidades.
- [Pandeo de columnas (Euler y Johnson)](../column-buckling/index.html): columnas esbeltas.
- [Flujo en canales abiertos (Manning)](../manning-channel-flow/index.html): canales revestidos de hormigón.
- [Conversor de unidades de ingeniería](../unit-converter/index.html): yardas cúbicas, libras y toneladas para mediciones en unidades imperiales.
