# Calculadora de mAh a Wh

**Resumen:** Capacidad de una batería en mAh o Ah convertida a energía en Wh a la tensión nominal, y al revés, con el límite de equipaje de mano de avión que le corresponde.

## Introducción

La capacidad de una batería se indica de dos formas distintas. Los teléfonos, las baterías externas y las celdas pequeñas dan miliamperios-hora (mAh), que miden carga. Los portátiles, las bicicletas eléctricas, las normas de las aerolíneas y el almacenamiento solar usan vatios-hora (Wh), que miden energía. Para comparar baterías de distintas tensiones (voltajes), o para comprobar si una batería externa puede viajar en avión, necesitas la energía, y para eso hace falta la tensión además de los mAh.

Esta calculadora convierte la capacidad en mAh o Ah a energía en Wh a la tensión nominal de la batería, y la energía de nuevo a capacidad. También te dice en qué categoría de las aerolíneas entra una batería de iones de litio: en equipaje de mano sin aprobación hasta 100 Wh, con la aprobación de la aerolínea hasta 160 Wh, y no permitida en el equipaje de los pasajeros por encima. Está pensada para viajeros, diseñadores de productos, electricistas y cualquiera que compare baterías.

## Fórmulas

Energía a partir de la capacidad, y capacidad a partir de la energía:

    E [Wh] = Q [Ah] × V
    E [Wh] = Q [mAh] × V / 1000
    Q [Ah] = E [Wh] / V

- Q: capacidad, Ah (1 Ah = 1000 mAh)
- V: tensión nominal, V: iones de litio de 3.6 a 3.7 V por celda, LiFePO4 3.2 V, plomo-ácido 2.0 V por celda, NiMH 1.2 V
- E: energía, Wh (1 kWh = 1000 Wh)

Límites de las aerolíneas para baterías de iones de litio que llevan los pasajeros (IATA):

    up to 100 Wh          allowed in carry-on
    over 100, up to 160   airline approval needed
    over 160 Wh           not allowed in passenger baggage

Es decir: hasta 100 Wh, permitida en equipaje de mano; de más de 100 hasta 160 Wh, hace falta la aprobación de la aerolínea; por encima de 160 Wh, no permitida en el equipaje de los pasajeros.

## Hipótesis y limitaciones

- La tensión es la tensión nominal, la media durante una descarga. La tensión baja a medida que la batería se vacía, y con corriente alta la energía utilizable es unos pocos por ciento menor.
- La capacidad en mAh solo tiene sentido a la propia tensión de la batería. Una batería externa de 10 000 mAh a 3.7 V entrega solo unos 6 000 a 6 500 mAh en su salida USB de 5 V, después de las pérdidas de conversión.
- Las categorías de las aerolíneas siguen las normas de la IATA. Las aerolíneas y los países pueden ser más estrictos, y las baterías de repuesto y las baterías externas van siempre en la cabina, nunca en el equipaje facturado.

## Ejemplo resuelto

La batería de un teléfono tiene 3000 mAh a 3.7 V. ¿Cuánta energía almacena?

1. Capacidad en Ah: 3000 / 1000 = 3 Ah.
2. Energía: E = 3 × 3.7 = 11.1 Wh.
3. Está muy por debajo de 100 Wh, así que el teléfono puede llevarse en cualquier vuelo sin aprobación.

Una batería externa de 20 000 mAh a 3.7 V almacena 74 Wh y también está permitida. Una de 30 000 mAh tendría 111 Wh y necesitaría la aprobación de la aerolínea.

## Preguntas frecuentes

**¿Cómo convierto mAh a Wh?**
Multiplica los mAh por la tensión y divide entre 1000. 5000 mAh a 3.7 V son 18.5 Wh.

**¿Qué tensión debo usar?**
La tensión nominal impresa en la batería: 3.6 o 3.7 V para la mayoría de las celdas de iones de litio, 3.2 V para LiFePO4, 12 V para una batería de 12 V. Para un paquete de baterías, usa la tensión del paquete.

**¿Por qué mi batería externa entrega menos mAh de los que indica?**
Sus mAh se cuentan a los 3.7 V de sus celdas, pero carga el teléfono a través de una salida de 5 V y un convertidor. La energía en Wh es la comparación honesta.

**¿Puedo llevar una batería externa de 100 Wh en el avión?**
Sí, hasta 100 Wh inclusive, en el equipaje de mano. Entre 100 y 160 Wh necesitas la aprobación de la aerolínea, y por encima de 160 Wh no se permite en el equipaje de los pasajeros.

**¿Cuántos Wh tiene una batería de 100 Ah y 12 V?**
1200 Wh, o 1.2 kWh. Solo una parte es utilizable: alrededor del 50 % en plomo-ácido y del 80 al 90 % en litio si quieres que la batería dure.

**¿Los mAh son lo mismo que la autonomía de la batería?**
No. La autonomía depende de la corriente que consume el aparato. Para eso usa la calculadora de autonomía de baterías.

## Calculadoras relacionadas

- [Tiempo de carga de una batería](../battery-charge-time/index.html): cuánto se tarda en reponer la capacidad.
- [Capacidad y autonomía de una batería](../battery-runtime/index.html): cuánto dura la energía con un consumo.
- [Costo de la electricidad y consumo de energía](../electricity-cost/index.html): lo que cuesta la energía de la red.
- [Dimensionado de campo fotovoltaico y almacenamiento](../solar-pv-sizing/index.html): bancos de baterías para instalaciones solares.
