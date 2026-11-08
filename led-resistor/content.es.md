# Calculadora de resistencia para LED

**Resumen:** Resistencia en serie para un LED o una cadena de LED: valor exacto, valor normalizado superior, corriente real, disipación y potencia nominal a comprar.

## Introducción

Un LED nunca debe conectarse directamente a una fuente de tensión (voltaje). Su corriente sube de forma muy pronunciada en cuanto se alcanza la tensión directa, y sin algo que la limite el LED se quema en unos instantes. El límite más sencillo es una resistencia en serie, que absorbe la diferencia entre la alimentación y la tensión directa del LED a la corriente que elijas.

Esta calculadora halla esa resistencia para un LED o para varios LED en serie. Devuelve el valor exacto, el siguiente valor normalizado E12 o E24 por encima, para que la corriente nunca supere tu objetivo, la corriente que da realmente ese valor, la potencia en la resistencia y la potencia nominal a comprar. Incluye las tensiones directas típicas de cada color, o puedes introducir el valor de la hoja de datos. Está pensada para aficionados, estudiantes e ingenieros que cablean pilotos indicadores y pequeña iluminación.

## Fórmulas

Resistencia en serie:

    R = (V_s − n × V_f) / I

Corriente con la resistencia normalizada R_std, y potencias:

    I = (V_s − n × V_f) / R_std
    P_R = I² × R_std
    P_LED = n × V_f × I

Potencia nominal de la resistencia: la menor potencia normalizada que sea al menos el doble de P_R.

- V_s: tensión de alimentación
- V_f: tensión directa de un LED a la corriente de diseño
- n: número de LED en serie
- I: corriente del LED

## Hipótesis y limitaciones

- La tensión directa se toma como constante a la corriente de diseño. Los valores incluidos son típicos, y el mismo color puede variar unos 0.2 V entre fabricantes, así que es mejor el valor de la hoja de datos.
- La alimentación es una tensión continua estable. Con una batería, usa su tensión más alta, para que una batería recién cargada no sobrecargue el LED.
- La resistencia elegida es el siguiente valor normalizado por encima del exacto, así que la corriente real es igual o inferior a tu objetivo.
- Cada cadena de LED en paralelo necesita su propia resistencia, porque sus tensiones directas nunca coinciden exactamente.
- Los LED de potencia de 350 mA o más se alimentan mejor con un driver de corriente constante que con una resistencia.

## Ejemplo resuelto

Un LED blanco debe funcionar a 20 mA con una alimentación de 5 V. ¿Qué resistencia hace falta?

1. Tensión directa de un LED blanco: unos 3.2 V, así que la resistencia absorbe 5 − 3.2 = 1.8 V.
2. Resistencia exacta: R = 1.8 / 0.020 = 90 Ω.
3. 90 Ω no es un valor normalizado; el siguiente valor E24 por encima es 91 Ω.
4. Corriente real: I = 1.8 / 91 = 19.8 mA, justo por debajo del objetivo.
5. Potencia en la resistencia: P = 0.0198² × 91 = 0.036 W. El doble es 0.072 W, así que basta una resistencia de 1/8 W.

Con tres LED rojos (2.0 V cada uno) en serie a 12 V y 20 mA, la resistencia es (12 − 6) / 0.02 = 300 Ω, que ya es un valor E24, y disipa 0.12 W, así que hace falta una pieza de 1/4 W.

## Preguntas frecuentes

**¿Por qué los LED necesitan una resistencia?**
La corriente de un LED sube de forma muy pronunciada por encima de su tensión directa, así que un pequeño cambio de la tensión de alimentación cambiaría enormemente la corriente. La resistencia hace que la corriente dependa de la diferencia de tensión, que es mucho más estable.

**¿Qué tensión directa debo usar?**
El valor típico de la hoja de datos a tu corriente. Los LED rojos, naranjas y amarillos rondan los 2 V, mientras que los azules, verde puro y blancos rondan de 3 a 3.3 V.

**¿Pueden varios LED compartir una resistencia?**
En serie, sí: una resistencia sirve para toda la cadena, siempre que la alimentación supere su tensión directa total con algo de margen. En paralelo, no: cada LED necesita su propia resistencia.

**¿Por qué redondear hacia arriba y no al valor más cercano?**
Redondear hacia abajo subiría la corriente por encima de tu objetivo. Redondear hacia arriba la reduce ligeramente, lo que es seguro y apenas se nota en el brillo.

**¿Cuánta corriente debe llevar un LED indicador?**
Los LED indicadores estándar de 5 mm suelen tener una corriente máxima de 20 mA. Los LED modernos de alta eficiencia brillan bien de 2 a 10 mA, lo que además ahorra energía.

**¿Y si la alimentación está solo un poco por encima de la tensión directa?**
Entonces la tensión en la resistencia es pequeña, y pequeños cambios de la alimentación o de la tensión directa hacen variar mucho la corriente. Deja al menos 1 V en la resistencia, o usa un driver de corriente constante.

## Calculadoras relacionadas

- [Ley de Ohm y potencia eléctrica](../ohms-law/index.html): la relación de la que sale el valor de la resistencia.
- [Divisor de tensión](../voltage-divider/index.html): otro circuito en serie de dos elementos.
- [Código de colores de resistencias](../resistor-color-code/index.html): encontrar la pieza de 91 Ω en el cajón.
- [Capacidad y autonomía de una batería](../battery-runtime/index.html): cuánto tiempo alimenta una batería los LED.
