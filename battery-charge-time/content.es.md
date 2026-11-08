# Calculadora de tiempo de carga de una batería

**Resumen:** Tiempo para cargar una batería desde cualquier estado de carga con un cargador dado, según la eficiencia de carga de su química, con el régimen de carga en C.

## Introducción

¿Cuánto tardará en cargarse esta batería? Dividir la capacidad entre la corriente del cargador da una primera respuesta, pero una carga real tarda más. Parte de la carga aportada se pierde en forma de calor y, en las baterías de plomo-ácido, de gas, y la última parte de la carga va lenta porque el cargador reduce su corriente. Cargar demasiado deprisa también acorta la vida de una batería, así que el régimen de carga importa tanto como el tiempo.

Esta calculadora estima el tiempo de carga a partir de la capacidad nominal de la batería, su estado de carga actual, el nivel que quieres alcanzar y la corriente del cargador. Aplica la eficiencia de carga típica de las baterías de plomo-ácido abiertas o selladas, de iones de litio, LiFePO4 o NiMH, o un valor propio. También da el régimen de carga en C, comparado con el límite habitual de la química. Está pensada para propietarios de embarcaciones y vehículos, instaladores de energía solar y de sistemas de respaldo, e ingenieros que dimensionan cargadores.

## Fórmulas

Carga a reponer, y carga que debe suministrar el cargador:

    Q_back = Q_rated × (SoC_target − SoC_now)
    Q_in = Q_back / η

Tiempo de carga y régimen de carga:

    t = Q_in / I
    C-rate = I / Q_rated   (I in A, Q in Ah)

Eficiencia de carga típica η: plomo-ácido abierta 85 %, AGM o gel 90 %, iones de litio 95 %, LiFePO4 97 %, NiMH 70 %.

## Hipótesis y limitaciones

- El cargador entrega toda su corriente nominal en todo momento. Las baterías de litio pasan a tensión constante cerca de la carga completa, y las de plomo-ácido necesitan una fase de absorción de varias horas por encima del 80 % aproximadamente, así que una carga completa tarda más que la estimación.
- Las eficiencias son valores típicos. Bajan cuando la batería está fría, caliente, es vieja o se carga deprisa.
- El estado de carga se refiere a la capacidad nominal. Una batería envejecida admite menos, así que se llena antes pero también almacena menos.
- No se incluyen las pérdidas del cargador ni las cargas alimentadas por la batería durante la carga. Una carga consume corriente que nunca llega a la batería.

## Ejemplo resuelto

Una batería de plomo-ácido abierta de 100 Ah está al 50 % y se carga por completo con un cargador de 10 A. ¿Cuánto tarda?

1. Carga a reponer: 100 × (1.00 − 0.50) = 50 Ah.
2. Con una eficiencia del 85 %, el cargador debe suministrar 50 / 0.85 = 58.8 Ah.
3. Tiempo de carga: 58.8 / 10 = 5.88 h.
4. Régimen de carga: 10 / 100 = 0.10 C, muy por debajo del 0.2 C habitual en las baterías abiertas.

El último tramo del 80 al 100 % transcurre con corriente decreciente en la fase de absorción, así que en la práctica cuenta con 2 a 4 horas más para tener la batería realmente llena.

## Preguntas frecuentes

**¿Cómo se calcula el tiempo de carga de una batería?**
Divide los amperios-hora a reponer entre la corriente del cargador y luego entre la eficiencia de carga. Para una batería de plomo-ácido, eso es aproximadamente los amperios-hora divididos entre la corriente, por 1.2.

**¿Qué significa el régimen de carga en C?**
La corriente como fracción de la capacidad. Para una batería de 100 Ah, 0.1 C son 10 A y 1 C son 100 A.

**¿Qué tamaño de cargador necesito?**
Para plomo-ácido, unos amperios equivalentes al 10 a 20 % de la capacidad; a una batería de 100 Ah le va un cargador de 10 a 20 A. Las baterías de litio admiten hasta 0.5 a 1 C si el fabricante lo permite.

**¿Por qué tarda tanto el último 20 %?**
Para evitar la sobrecarga, el cargador mantiene la tensión constante y deja que la corriente baje a medida que la batería se llena. Las baterías de plomo-ácido son las que más lo necesitan.

**¿Debo cargar las baterías de litio al 100 %?**
Para una vida larga, muchos fabricantes recomiendan del 80 al 90 % para el uso diario y el 100 % solo cuando se necesita toda la autonomía.

**¿Por qué el NiMH es tan poco eficiente?**
Cerca de la carga completa, el NiMH convierte gran parte de la energía aportada en calor, y por eso sus cargadores terminan la carga por aumento de temperatura o por una caída de tensión.

## Calculadoras relacionadas

- [Capacidad de batería de mAh a Wh](../mah-to-wh/index.html): la energía de la batería en vatios-hora.
- [Capacidad y autonomía de una batería](../battery-runtime/index.html): cuánto dura la carga con un consumo.
- [Dimensionado de campo fotovoltaico y almacenamiento](../solar-pv-sizing/index.html): carga desde paneles solares.
- [Costo de la electricidad y consumo de energía](../electricity-cost/index.html): lo que cuesta una carga desde la red.
