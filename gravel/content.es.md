# Calculadora de grava: metros cúbicos y toneladas

**Resumen:** Metros cúbicos, yardas cúbicas y toneladas de grava, piedra triturada, arena o tierra vegetal para un área y una profundidad, con camiones y costo.

## Introducción

¿Cuánta grava necesitas? Multiplica la longitud, el ancho y la profundidad para obtener el volumen, conviértelo a yardas cúbicas y multiplícalo por el peso de una yarda cúbica para obtener toneladas. Un camino de 20 ft de largo y 10 ft de ancho, cubierto con 4 in de profundidad, lleva 2.47 yardas cúbicas de piedra triturada. Con un margen por compactación son unas 3.7 toneladas cortas.

Esta calculadora hace las cuentas para grava, piedra triturada, arena, arena con grava y tierra vegetal. Da el volumen colocado y el volumen a pedir, el peso en toneladas cortas y en toneladas métricas, el número de viajes de camión y el costo. Está pensada para particulares, paisajistas y contratistas que piden material a granel por yarda o por tonelada.

## Fórmulas

Volumen colocado y volumen a pedir:

    V = L × W × d
    V_order = V × (1 + c)

Peso, viajes de camión y costo:

    m = V_order × ρ
    loads = larger of V_order / truck volume and m / truck payload, rounded up
    cost = tons × price per ton

- L, W: longitud y ancho del área; d: profundidad compactada, con las pulgadas divididas entre 12 para obtener pies
- c: margen por compactación y asentamiento, como fracción
- ρ: densidad aparente en suelto del material entregado
- loads: viajes de camión, el mayor de los dos cocientes, redondeado hacia arriba; cost: costo, toneladas × precio por tonelada
- 1 yd³ = 27 ft³ = 0.7646 m³; 1 tonelada corta = 2 000 lb = 907.2 kg

Densidades aparentes en suelto según el Caterpillar Performance Handbook:

| Material | kg/m³ | lb/yd³ | toneladas cortas por yd³ |
|---|---|---|---|
| Piedra triturada | 1 600 | 2 700 | 1.35 |
| Grava seca, de ¼ a 2 in | 1 690 | 2 850 | 1.43 |
| Arena y grava secas | 1 720 | 2 900 | 1.45 |
| Arena seca | 1 420 | 2 400 | 1.20 |
| Tierra vegetal | 950 | 1 600 | 0.80 |

## Hipótesis y limitaciones

- El área es un rectángulo, o un área que introduces, cubierta con una profundidad uniforme. Divide un área irregular en rectángulos y suma los resultados.
- La profundidad es la profundidad final tras la compactación. El margen añade el volumen que se pierde al extender y apisonar la piedra suelta. Lo habitual es del 10 al 15 % para una base compactada.
- Los pesos son pesos típicos en suelto. El material húmedo pesa más, y los distintos tipos de roca varían. Pide a tu cantera su peso por yarda cuando compres por tonelada.
- La capacidad y la carga útil del camión varían con el camión y con los límites de peso de cada estado. Introduce las cifras de tu transportista.

## Ejemplo resuelto

Un camino de jardín mide 20 ft de largo, 10 ft de ancho y 4 in de profundidad, en piedra triturada. ¿Cuánto debes pedir con un 10 % de margen por compactación, y cuánto cuesta a $40 por tonelada?

1. Profundidad en pies: 4 / 12 = 0.333 ft.
2. Volumen: 20 × 10 × 0.333 = 66.7 ft³, que son 66.7 / 27 = 2.47 yd³.
3. Con un 10 % de margen: 2.47 × 1.10 = 2.72 yd³, o 73.3 ft³.
4. Peso: 2.72 yd³ × 2 697 lb/yd³ = 7 325 lb, que son 3.66 toneladas cortas.
5. Costo: 3.66 × $40 = $146.50.

La carga cabe en un camión. En unidades métricas son 2.08 m³ y 3.32 toneladas métricas.

## Preguntas frecuentes

**¿Cuántas toneladas hay en una yarda cúbica de grava?**
Unas 1.35 toneladas cortas de piedra triturada y 1.43 de grava seca, en suelto. La arena pesa unas 1.2 toneladas por yarda y la tierra vegetal unas 0.8.

**¿Cuántos pies cuadrados cubre una yarda cúbica de grava?**
Una yarda cúbica son 27 ft³. Cubre 162 ft² con 2 in de profundidad, 108 ft² con 3 in y 81 ft² con 4 in.

**¿Cuántas yardas cúbicas hay en una tonelada de piedra triturada?**
Unas 0.74 yd³, ya que una yarda cúbica en suelto pesa unas 2 700 lb.

**¿Por qué añadir un margen por compactación?**
La piedra suelta se asienta al extenderla y apisonarla. Si pides solo el volumen compactado, te quedas corto, así que para una capa de base se suele añadir del 10 al 15 %.

**¿Por qué el peso colocado es mayor que el peso en suelto?**
La compactación elimina huecos. Caterpillar da para la piedra triturada 1 600 kg/m³ en suelto, pero 2 670 kg/m³ en banco.

**¿Cuántos sacos de grava hacen una yarda cúbica?**
54 sacos de 0.5 ft³, porque una yarda cúbica son 27 ft³. La entrega a granel suele ser más barata a partir de una o dos yardas cúbicas.

## Calculadoras relacionadas

- [Calculadora de losa de hormigón](../concrete-slab/index.html): hormigón para la losa que a menudo descansa sobre la base de grava.
- [Calculadora de asfalto](../asphalt/index.html): toneladas de mezcla en caliente para una entrada de vehículos sobre la base.
- [Calculadora de volumen de zanjas y excavaciones](../trench-volume/index.html): volumen de una zanja que rellenar con piedra.
- [Volúmenes de desmonte y terraplén](../earthwork-volume/index.html): volúmenes mayores de desmonte y terraplén con esponjamiento y contracción.
