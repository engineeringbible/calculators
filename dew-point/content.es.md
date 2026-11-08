# Calculadora del punto de rocío

**Resumen:** Punto de rocío a partir de la temperatura y la humedad relativa, o la humedad a partir del punto de rocío, con bulbo húmedo, humedad específica y entalpía.

## Introducción

El punto de rocío es la temperatura a la que el aire se satura y el agua empieza a condensarse. Si enfrías un vaso en aire a 20 °C y un 50 % de humedad, se forma rocío sobre él a 9.3 °C. A diferencia de la humedad relativa, que cambia cada vez que cambia la temperatura, el punto de rocío mide cuánta agua contiene realmente el aire, así que es mejor guía para el confort, la condensación en paredes y ventanas, la niebla y el curado de pinturas.

Esta calculadora da el punto de rocío a partir de la temperatura del aire y la humedad relativa, o la humedad a partir de un punto de rocío medido. También da la temperatura de bulbo húmedo, el contenido de humedad en g/kg, la humedad absoluta, la entalpía y la densidad del aire, a cualquier altitud. Usa las ecuaciones psicrométricas de ASHRAE, las mismas que hay detrás del diagrama psicrométrico.

## Fórmulas

Presión de vapor a partir de la humedad relativa, y punto de rocío donde se alcanza la saturación:

    p_w = RH × p_ws(t)
    p_ws(t_d) = p_w    →   t_d

Contenido de humedad y entalpía:

    W = 0.621945 × p_w / (p − p_w)
    h = 1.006 t + W (2501 + 1.86 t)    kJ/kg

La aproximación rápida de Magnus, con un error de unos 0.1 °C entre −40 y 50 °C:

    γ = ln(RH) + 17.625 t / (243.04 + t)
    t_d = 243.04 γ / (17.625 − γ)

- t — temperatura del aire, °C; RH — humedad relativa como fracción
- p_ws — presión de saturación del vapor de agua (ecuación de Hyland–Wexler en ASHRAE)
- p — presión barométrica, que disminuye con la altitud

## Hipótesis y limitaciones

- Las ecuaciones son las del ASHRAE Handbook of Fundamentals, capítulo 1. Por debajo de 0 °C la saturación es sobre hielo, así que el resultado es el punto de escarcha.
- La humedad relativa se toma tal como la dan los higrómetros y los servicios meteorológicos: la presión de vapor dividida por la presión de saturación a la temperatura del aire.
- La presión no cambia el punto de rocío, pero sí el contenido de humedad, el bulbo húmedo y la densidad. Usa la altitud o la presión de la estación, no la presión reducida al nivel del mar de un parte meteorológico.
- La descripción del confort sigue las bandas del Servicio Meteorológico Nacional de EE. UU. y es una guía general.

## Ejemplo resuelto

El aire de una habitación está a 20 °C con un 50 % de humedad relativa, a nivel del mar. ¿Cuál es el punto de rocío?

1. Presión de saturación a 20 °C: 2.339 kPa.
2. Presión de vapor: 0.50 × 2.339 = 1.169 kPa.
3. La temperatura a la que 1.169 kPa es la presión de saturación: 9.27 °C. Este es el punto de rocío.
4. Contenido de humedad: 0.621945 × 1.169 / (101.325 − 1.169) = 0.00726 kg/kg, o 7.26 g/kg.
5. Bulbo húmedo, a partir del balance de energía de ASHRAE: 13.78 °C.

Cualquier superficie más fría que 9.3 °C, como una ventana de vidrio simple en invierno, acumulará condensación.

## Preguntas frecuentes

**¿Qué punto de rocío es confortable?**
55 °F (13 °C) o menos se siente seco y confortable. Entre 55 y 65 °F (13 a 18 °C) el aire se siente pegajoso, y por encima de 65 °F (18 °C) se siente agobiante.

**¿Qué diferencia hay entre punto de rocío y humedad?**
La humedad relativa indica lo cerca que está el aire de la saturación a su temperatura actual. El punto de rocío es la cantidad de agua que contiene expresada como una temperatura, y no cambia cuando el aire se calienta o se enfría.

**¿Por qué se forma condensación en mis ventanas?**
El vidrio está más frío que el punto de rocío de la habitación. Reduce la humedad interior, ventila o mejora el acristalamiento para que su superficie se mantenga más caliente.

**¿Puede el punto de rocío ser mayor que la temperatura?**
No. Cuando el aire se enfría hasta su punto de rocío está saturado, y cualquier enfriamiento adicional condensa agua en forma de rocío o niebla.

**¿Qué es la temperatura de bulbo húmedo?**
La temperatura que alcanza un termómetro mojado mientras el agua se evapora de él. Está entre el punto de rocío y la temperatura del aire, y limita la eficacia de los enfriadores evaporativos y del sudor.

**¿Qué punto de rocío se necesita para pintar?**
La mayoría de las normas de recubrimientos exigen que la superficie del acero esté al menos 3 °C por encima del punto de rocío, para que no se condense humedad bajo la pintura.

## Calculadoras relacionadas

- [Calculadora de la densidad del aire](../air-density/index.html): densidad del aire húmedo a cualquier altitud.
- [Renovaciones de aire por hora y CFM](../air-changes/index.html): ventilación para eliminar la humedad.
- [Calculadora de BTU para aire acondicionado](../btu-ac-size/index.html): capacidad de refrigeración.
- [Ventilación de la carga y punto de rocío](../cargo-ventilation-dewpoint/index.html): la regla de los tres grados para las bodegas de los buques.
