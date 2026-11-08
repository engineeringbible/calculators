# Calculadora de paneles solares: ¿cuántos paneles necesito?

**Resumen:** Potencia de la instalación solar en kW y número de paneles para cubrir tu consumo anual, según horas de sol pico y pérdidas, con superficie, producción y costo.

## Introducción

¿Cuántos paneles solares necesita una vivienda? Divide la electricidad que consumes en un año entre lo que produce en un año un kilovatio de paneles donde vives, y tienes la potencia de la instalación. Divídela entre la potencia de un panel y redondea hacia arriba. Una vivienda que consume 10 000 kWh al año, con 4.5 horas de sol pico al día, necesita unos 7.1 kW de paneles: dieciocho paneles de 400 W.

Esta calculadora hace ese cálculo para una instalación conectada a la red, el montaje habitual en tejado en el que la red cubre los huecos. Da la potencia de la instalación, el número de paneles, la producción anual, la parte de tu consumo cubierta, la superficie en el tejado y el costo instalado según tu precio por vatio. Para instalaciones aisladas con baterías, usa la calculadora de campo fotovoltaico y almacenamiento.

## Fórmulas

Lo que produce en un año un kilovatio de paneles, la producción específica:

    Y = PSH × 365 × (1 − losses)        kWh per kW per year

Potencia de la instalación y número de paneles:

    P = E × offset / Y
    N = P / P_panel, rounded up

Producción anual de los paneles instalados:

    E_out = N × P_panel × Y

- E: consumo eléctrico anual, de 12 meses de facturas
- offset: la parte de ese consumo que deben cubrir los paneles
- PSH: horas de sol pico, la energía solar diaria sobre los paneles en kWh/m², promediada a lo largo del año
- losses: temperatura, suciedad, cableado, inversor y desajuste entre módulos, alrededor del 14 %
- P_panel: la potencia nominal de un panel en condiciones estándar de prueba

## Hipótesis y limitaciones

- La instalación está conectada a la red, que suministra energía por la noche y absorbe el excedente a mediodía. El cálculo hace el balance del año, no de cada día o estación.
- Las horas de sol pico dependen de la ubicación, la inclinación y la orientación. La herramienta PVWatts del NREL las da para EE. UU. y muchos otros países, y la herramienta PVGIS de la UE cubre Europa y África.
- Un 14 % de pérdidas es el valor por defecto de PVWatts para una instalación bien ejecutada. Las sombras de árboles, chimeneas o edificios vecinos pueden costar mucho más y requieren un estudio del emplazamiento.
- La superficie del panel es el contorno del módulo. Los tejados necesitan además espacio para bordes, pasillos y los retranqueos contra incendios que exigen algunas normas.

## Ejemplo resuelto

Una vivienda consume 10 000 kWh al año y quiere cubrirlo todo. El emplazamiento recibe de media 4.5 horas de sol pico al día, y el instalador ofrece paneles de 400 W de 1.9 m² cada uno.

1. Producción por kW: 4.5 × 365 × (1 − 0.14) = 1 412.6 kWh por kW al año.
2. Potencia de la instalación: 10 000 / 1 412.6 = 7.08 kW.
3. Paneles: 7 080 / 400 = 17.7, así que 18 paneles, que son 7.2 kW instalados.
4. Producción: 7.2 × 1 412.6 = 10 170 kWh al año, el 102 % del consumo.
5. Superficie en el tejado: 18 × 1.9 = 34.2 m², unos 368 ft².

## Preguntas frecuentes

**¿Cuántos paneles solares necesito para mi casa?**
Divide tus kWh anuales entre 365, entre tus horas de sol pico y entre 0.86 por las pérdidas, y luego entre la potencia del panel en kW. Para 10 000 kWh al año en un lugar con 4.5 horas, salen 18 paneles de 400 W.

**¿Cuánto produce un panel solar?**
Un panel de 400 W produce de 1.4 a 1.7 kWh al día en un clima soleado, y de 500 a 630 kWh al año en un lugar con 4 a 5 horas de sol pico.

**¿Qué son las horas de sol pico?**
La energía solar del día expresada como horas de sol pleno a 1 000 W/m². El sur de Europa y gran parte de EE. UU. reciben de 4 a 6; el norte de Europa recibe de 2.5 a 3.5 de media anual.

**¿Cuánto espacio de tejado necesito?**
Unos 1.7 a 2 m² por panel, o de 4.5 a 5 m² por kW con los paneles actuales de 400 a 450 W, más espacio alrededor de los bordes.

**¿Debo cubrir el 100 % de mi consumo?**
Depende de lo que pague la compañía eléctrica por el excedente. Donde la energía vertida a la red se paga mucho menos de lo que cuesta la energía comprada, una instalación más pequeña ajustada al consumo diurno suele amortizarse antes.

**¿Pierden producción los paneles con el tiempo?**
Sí, lentamente: las garantías típicas aseguran del 80 al 90 % de la potencia nominal al cabo de 25 años.

## Calculadoras relacionadas

- [Dimensionado de campo fotovoltaico y almacenamiento](../solar-pv-sizing/index.html): instalaciones aisladas con baterías.
- [Costo de la electricidad](../electricity-cost/index.html): lo que vale la energía que produces.
- [Tiempo de carga de una batería](../battery-charge-time/index.html): carga desde los paneles.
- [mAh a Wh](../mah-to-wh/index.html): conversiones de capacidad de baterías.
