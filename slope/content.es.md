# Calculadora de pendiente: porcentaje, grados, proporción y x/12

**Resumen:** Convierte una pendiente entre porcentaje, grados, proporción 1 : n y pendiente de tejado, o hállala con la elevación y el recorrido, con su longitud.

## Introducción

La pendiente se expresa de muchas maneras. Los ingenieros de carreteras usan la pendiente en porcentaje, los techadores de EE. UU. usan la pendiente de tejado en pulgadas por pie, las normas de rampas y drenaje usan proporciones como 1 : 12, y los topógrafos usan grados. Todas salen de lo mismo: la elevación dividida entre el recorrido horizontal. Una elevación de 1 m en 12 m son 8.33 %, 4.76°, 1 : 12 y una pendiente de tejado de 1 en 12.

Esta calculadora convierte entre las cinco formas, o halla la pendiente a partir de una elevación y un recorrido medidos. También da la longitud a lo largo de la pendiente y la elevación en cualquier recorrido, y compara el resultado con límites habituales como el máximo para rampas accesibles. Está pensada para constructores, paisajistas, techadores, proyectistas de carreteras y drenaje, y cualquiera que trace una rampa o un camino.

## Fórmulas

A partir de la elevación y el recorrido:

    grade = rise / run                 percent = 100 × rise / run
    θ = arctan(rise / run)
    ratio 1 : n,  n = run / rise
    pitch = 12 × rise / run            inches per foot
    length along the slope = √(run² + rise²)

- rise: cambio vertical (elevación); run: distancia horizontal (recorrido)
- θ: ángulo sobre la horizontal
- grade, percent: pendiente como fracción y en porcentaje; ratio: proporción; pitch: pendiente de tejado en pulgadas por pie; length along the slope: longitud a lo largo de la pendiente

## Hipótesis y limitaciones

- El recorrido es horizontal, no medido a lo largo de la pendiente. En pendientes fuertes la diferencia importa: a 45° la superficie es un 41 % más larga que el recorrido.
- Una pendiente del 100 % son 45°, no la vertical. Las pendientes superiores al 100 % son más empinadas que 45°.
- Aquí las proporciones se escriben 1 : n, con la elevación primero. Los taludes de terraplén se escriben a menudo n H : 1 V, que significa el mismo n.
- Los límites típicos son orientaciones generales. Los códigos de edificación, las normas de carreteras y las reglas de drenaje fijan los valores que se aplican a cada proyecto.

## Ejemplo resuelto

Una rampa para sillas de ruedas debe subir 1 m. Si tiene un recorrido horizontal de 12 m, ¿cuál es su pendiente?

1. Pendiente: 1 / 12 = 0.0833, o 8.33 %.
2. Ángulo: arctan(0.0833) = 4.76°.
3. Proporción: 1 : 12, exactamente la pendiente longitudinal máxima de las normas ADA de 2010 (ADA Standards for Accessible Design, EE. UU.).
4. Longitud a lo largo de la rampa: √(12² + 1²) = 12.04 m.

Un recorrido más corto haría la rampa demasiado empinada para el límite de la ADA.

## Preguntas frecuentes

**¿Cómo calculo el porcentaje de pendiente?**
Divide la elevación entre el recorrido y multiplica por 100. Una elevación de 3 ft en 50 ft es un 6 %.

**¿Cómo convierto una pendiente en porcentaje a grados?**
Calcula el arcotangente del porcentaje dividido entre 100. El 10 % son 5.71°, el 50 % son 26.57° y el 100 % son 45°.

**¿Cuántos grados tiene una pendiente de tejado 4/12?**
18.43°, una pendiente del 33.3 %. Un tejado 6/12 tiene 26.57° y uno 12/12 tiene 45°.

**¿Cuál es la pendiente máxima de una rampa para sillas de ruedas?**
1 : 12, o el 8.33 %, según las normas ADA, con una elevación de no más de 30 in por tramo. Muchos países usan límites similares o más suaves.

**¿Qué pendiente necesita un desagüe o un patio?**
Los pavimentos y las cubiertas planas necesitan alrededor de un 1 a 2 % para evacuar el agua. Las tuberías de drenaje se suelen colocar con pendientes de 1 : 40 a 1 : 100, según su tamaño.

**¿Cuánto es 1 : 20 en porcentaje?**
Un 5 %. Por debajo de 1 : 20, una superficie peatonal no se considera rampa según las normas ADA.

## Calculadoras relacionadas

- [Volumen de movimiento de tierras](../earthwork-volume/index.html): desmonte y terraplén en terreno inclinado.
- [Flujo en canales abiertos (Manning)](../manning-channel-flow/index.html): caudal en un canal con pendiente.
- [Calculadora de losa de hormigón](../concrete-slab/index.html): losas con pendiente de evacuación.
- [Calculadora de zapatas de hormigón](../concrete-footing/index.html): zapatas escalonadas en pendientes.
