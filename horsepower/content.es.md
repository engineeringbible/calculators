# Calculadora de caballos de fuerza (hp)

**Resumen:** Potencia en hp a partir del par y las rpm, o estimada por el tiempo o la velocidad final en cuarto de milla y el peso, en hp, kW y CV, en cigüeñal y ruedas.

## Introducción

La potencia es el ritmo al que un motor realiza trabajo. Para calcularla a partir de una lectura de banco de potencia, multiplica el par (torque) en lbf·ft por las rpm y divide entre 5 252. Un motor que da 400 lbf·ft a 5 000 rpm produce 380.8 hp. Sin banco de potencia, los pilotos de carreras de aceleración estiman la potencia a partir del peso del coche y de su tiempo o su velocidad final en el cuarto de milla.

Esta calculadora da la potencia en el cigüeñal a partir del par y las rpm, o la estima a partir de una hoja de tiempos con tres juegos de constantes publicados. Muestra el resultado en hp, kW y CV (PS), y la potencia en las ruedas después de la pérdida de la transmisión. Está pensada para aficionados al automóvil que leen hojas de banco y de tiempos, y para cualquiera que convierta entre unidades de potencia.

## Fórmulas

Potencia a partir del par, exacta:

    P = T × 2π × N / 60
    hp = T[lbf·ft] × N[rpm] / 5 252

Estimaciones a partir de una carrera de cuarto de milla:

    hp = W × (K_t / ET)³
    hp = W × (mph / K_v)³

Potencia en las ruedas y en el cigüeñal:

    hp_wheel = hp_crank × (1 − loss)

- T: par; N: régimen del motor
- W: peso en carrera en lb, con piloto y combustible
- ET: tiempo empleado en s; mph: velocidad final
- K_t, K_v: Hale 5.825 y 234; Fox 6.050 y 225; Huntington 6.290 y 224
- 1 hp = 745.7 W; 1 PS (CV) = 735.5 W

## Hipótesis y limitaciones

- La potencia a partir del par y las rpm es exacta. Las curvas de par y de potencia siempre se cruzan a 5 252 rpm cuando se representan en lbf·ft y hp.
- Las fórmulas de la hoja de tiempos son estimaciones ajustadas a resultados de pista de aceleración. Dan la potencia en el volante para un coche con buena tracción en una pista preparada.
- La velocidad final es la mejor guía. Una mala salida o el patinaje de las ruedas añaden décimas al tiempo, pero cambian mucho menos la velocidad final.
- La pérdida de la transmisión es una hipótesis. Un 15 % es una cifra habitual para un coche manual de propulsión trasera, y los automáticos y la tracción total pierden más.
- Las constantes difieren porque se ajustaron a coches distintos. Las de Hale se adaptan a los coches deportivos modernos; las de Huntington proceden de los muscle cars de los años sesenta.

## Ejemplo resuelto

Un banco de motor marca 400 lbf·ft a 5 000 rpm. ¿Cuál es la potencia en ese punto, y en las ruedas con un 15 % de pérdida de la transmisión?

1. Potencia: 400 × 5 000 / 5 252 = 380.8 hp.
2. En kilovatios: 380.8 × 0.7457 = 284.0 kW.
3. En caballos métricos: 284 000 / 735.5 = 386.1 CV (PS).
4. En las ruedas: 380.8 × (1 − 0.15) = 323.7 hp.

En un coche de 3 500 lb con buena tracción, la fórmula de Hale predice una velocidad final de 234 × (380.8 / 3 500)^(1/3) = 111.7 mph. Haciendo el cálculo inverso a partir de una hoja de tiempos, 111.7 mph devuelve unos 381 hp.

## Preguntas frecuentes

**¿Cómo calculo la potencia a partir del par?**
Multiplica el par en lbf·ft por las rpm y divide entre 5 252. En unidades SI, kW = N·m × rpm / 9 549.

**¿Por qué el par y la potencia se cruzan a 5 252 rpm?**
Porque 5 252 es la constante de hp = lbf·ft × rpm / 5 252. A ese régimen los dos números son iguales.

**¿Qué precisión tiene la potencia calculada con el tiempo en el cuarto de milla?**
Es una estimación. Para el mismo tiempo, la constante de Huntington da un 26 % más de potencia que la de Hale, así que la elección de constantes importa. La velocidad final da una cifra más fiable que el tiempo.

**¿Qué diferencia hay entre hp y CV (PS)?**
El CV (PS) es el caballo de vapor métrico, 735.5 W. Un caballo de fuerza mecánico (hp) son 745.7 W, así que 100 hp son 101.4 CV.

**¿Qué es la potencia en las ruedas?**
La potencia que mide un banco de rodillos en las ruedas motrices. Es menor que la potencia en el cigüeñal porque la caja de cambios, el árbol de transmisión y el diferencial absorben parte de ella.

**¿Cómo convierto hp a kW?**
Multiplica por 0.7457. Un motor de 300 hp tiene 224 kW.

## Calculadoras relacionadas

- [Tiempo y velocidad final en el cuarto de milla](../quarter-mile/index.html): la hoja de tiempos a partir del peso y la potencia.
- [Par, potencia y régimen](../torque-power-rpm/index.html): cualquiera de las tres a partir de las otras dos.
- [Cilindrada del motor](../engine-displacement/index.html): pulgadas cúbicas y litros a partir del diámetro y la carrera.
- [Tamaño de los inyectores](../fuel-injector-size/index.html): el caudal de los inyectores para la potencia.
