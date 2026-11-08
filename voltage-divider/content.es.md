# Calculadora de divisor de tensión

**Resumen:** Salida de un divisor de dos resistencias, o la R2 para una tensión objetivo con el valor E24 o E96 más cercano, más corriente, potencia y efecto de la carga.

## Introducción

Un divisor de tensión (voltaje) son dos resistencias en serie conectadas a una alimentación, con la salida tomada en el punto entre ambas. Es la forma más sencilla de reducir una tensión: para llevar una señal de 12 V a una entrada de 3.3 V de un microcontrolador, para fijar la referencia de un regulador o de un comparador, o para polarizar un transistor. La salida es una fracción fija de la entrada, que depende solo de la relación entre las dos resistencias.

Esta calculadora funciona en los dos sentidos. Si le das la entrada y las dos resistencias, devuelve la salida. Si le das la entrada, la salida objetivo y la resistencia superior, halla la resistencia inferior, elige el valor normalizado E12, E24 o E96 más cercano y muestra la salida que da realmente ese valor. También muestra la corriente y la potencia en cada resistencia, la caída al conectar una carga y la resistencia de fuente que ve la etapa siguiente. Está pensada para estudiantes de electrónica, aficionados e ingenieros que diseñan circuitos de sensores y de referencia.

## Fórmulas

Salida sin carga:

    V_out = V_in × R2 / (R1 + R2)

Resistencia inferior para una salida objetivo:

    R2 = R1 × V_out / (V_in − V_out)

Corriente y potencia:

    I = V_in / (R1 + R2),   P_R1 = I² R1,   P_R2 = I² R2

Con una carga R_L en la salida, R2 se sustituye por R2 en paralelo con R_L:

    R2 ∥ R_L = R2 R_L / (R2 + R_L)

Resistencia de fuente vista desde la salida (Thévenin):

    R_th = R1 ∥ R2 = R1 R2 / (R1 + R2)

## Hipótesis y limitaciones

- Las resistencias se toman con su valor nominal. Con piezas del 5 %, la relación puede desviarse hasta un 10 % aproximadamente en el peor caso; usa piezas del 1 % cuando la salida importe.
- Un divisor sin carga supone que nada toma corriente de la salida. Cualquier carga en paralelo con R2 reduce la salida, y el resultado con carga indica cuánto.
- La alimentación es ideal. Una fuente con resistencia propia se suma a R1.
- Un divisor sirve para fijar y medir tensiones, no para alimentar un circuito. Su salida se mueve en cuanto cambia la corriente de carga, así que usa un regulador para suministrar potencia.

## Ejemplo resuelto

Una señal de 12 V debe reducirse a 3.3 V para la entrada de un microcontrolador. La resistencia superior es R1 = 10 kΩ. ¿Qué resistencia inferior hace falta?

1. Valor exacto: R2 = R1 × V_out / (V_in − V_out) = 10 000 × 3.3 / (12 − 3.3) = 3 793 Ω.
2. El valor E24 más cercano es 3.9 kΩ.
3. Con 3.9 kΩ la salida es V_out = 12 × 3 900 / (10 000 + 3 900) = 3.37 V, algo por encima del objetivo pero dentro de la tolerancia de una entrada típica.
4. Corriente del divisor: I = 12 / 13 900 = 0.863 mA, así que cada resistencia disipa solo unos pocos milivatios.
5. La resistencia de fuente en la salida es 10 kΩ ∥ 3.9 kΩ = 2.8 kΩ. Una entrada de microcontrolador de varios megaohmios apenas la carga.

Para una salida más cercana a 3.3 V, el valor E96 de 3.83 kΩ da 3.32 V.

## Preguntas frecuentes

**¿Cómo elijo los valores de las resistencias?**
La relación fija la salida y el tamaño fija la corriente. Los valores bajos desperdician potencia, y los valores muy altos se ven alterados por la carga y por el ruido. Para medir niveles lógicos, una elección habitual es de 10 kΩ a 100 kΩ en total.

**¿Por qué baja la salida cuando conecto algo?**
La carga queda en paralelo con R2 y reduce la resistencia inferior. Mantén la carga al menos diez veces mayor que R2, o pon un búfer en la salida con un seguidor de amplificador operacional.

**¿Puedo alimentar un circuito con un divisor de tensión?**
No de forma fiable. La salida cambia con la corriente de carga, así que un microcontrolador o un relé verían moverse su alimentación. Usa un regulador lineal o un convertidor CC-CC.

**¿Qué pasa con la tolerancia de las resistencias?**
Dos resistencias del 5 % pueden desplazar la relación hasta un 10 % aproximadamente en el peor caso, y las piezas del 1 % alrededor de un 2 %. Para una referencia precisa, usa resistencias del 0.1 % o un potenciómetro de ajuste.

**¿Funciona un divisor de tensión con corriente alterna?**
Sí, con resistencias a frecuencias de audio y de radio bajas. A frecuencias altas, la capacidad parásita lo convierte en una red que depende de la frecuencia.

**¿Para qué sirve la resistencia de fuente?**
Es lo que la etapa siguiente ve como resistencia interna del divisor. Importa para la temporización con condensadores y para la corriente de entrada de los convertidores analógico-digitales.

## Calculadoras relacionadas

- [Ley de Ohm y potencia eléctrica](../ohms-law/index.html): corriente y potencia en cada resistencia.
- [Resistencias en serie y en paralelo](../resistors-series-parallel/index.html): combinar resistencias para obtener la R2 que necesitas.
- [Resistencia en serie para LED](../led-resistor/index.html): otro diseño con resistencia en serie.
- [Código de colores de resistencias](../resistor-color-code/index.html): leer y marcar los valores elegidos.
