# Calculadora de amperios a vatios

**Resumen:** Vatios a partir de amperios y tensión en CC, monofásica y trifásica, con el factor de potencia: lo que puede suministrar un circuito, fusible o toma.

## Introducción

Una toma de corriente, un fusible, un interruptor automático o un alargador se especifican en amperios. Que puedan alimentar un aparato depende de los vatios que transporta esa corriente, y eso depende de la tensión (voltaje). Los mismos 13 A que alimentan un calefactor de 3 kW en una vivienda británica darían menos de la mitad en una toma norteamericana de 120 V.

Esta calculadora convierte amperios en vatios para circuitos de CC, monofásicos y trifásicos. En CA incluye el factor de potencia, porque los motores y algunas cargas electrónicas absorben más corriente de la que necesitaría solo su potencia activa. Está pensada para particulares, electricistas, quienes planifican la alimentación de eventos y obras, e ingenieros.

## Fórmulas

Potencia a partir de la corriente:

    DC:            P = V × I
    single-phase:  P = V × I × cos φ
    three-phase:   P = √3 × V × I × cos φ

Potencia aparente:

    S = P / cos φ

- I: corriente, A
- V: tensión, V (entre fases en trifásica)
- cos φ: factor de potencia (1 para cargas resistivas)

## Hipótesis y limitaciones

- La corriente es la corriente eficaz de cada fase. En trifásica la carga está equilibrada y la tensión es entre fases.
- Con un factor de potencia menor que 1, el circuito transporta más voltamperios que vatios activos. El límite del circuito lo fija la corriente, no los vatios.
- La corriente nominal de un circuito es su máximo. En Norteamérica los interruptores automáticos normalmente se cargan de forma continua a no más del 80 % de su calibre.

## Ejemplo resuelto

¿Cuánta potencia puede suministrar una toma de 13 A con una red de 230 V?

1. Un calefactor o un hervidor tiene un factor de potencia de 1.
2. Potencia: P = V × I = 230 × 13 = 2 990 W, unos 3 kW.
3. Así que dos calefactores de 2 kW en una sola toma, 4 kW en total, la sobrecargarían.

En un circuito de 15 A y 120 V, el máximo es 120 × 15 = 1 800 W, y 1 440 W para una carga continua al 80 %.

## Preguntas frecuentes

**¿Cuántos vatios son 10 amperios?**
A 230 V, 2 300 W; a 120 V, 1 200 W; a 12 V CC, 120 W.

**¿Cuántos vatios puede suministrar un circuito de 16 A?**
A 230 V monofásica, 3 680 W. A 400 V trifásica con factor de potencia unidad, 11.1 kW.

**¿Por qué el factor de potencia reduce los vatios?**
Con un factor de potencia menor que 1, parte de la corriente va y viene sin realizar trabajo. El circuito sigue transportando esa corriente, así que los vatios útiles son menores para los mismos amperios.

**¿Cómo convierto amperios a vatios en trifásica?**
Multiplica √3 por la tensión entre fases, la corriente y el factor de potencia. 32 A a 400 V y 0.9 son 19.95 kW.

**¿Un VA es lo mismo que un vatio?**
Solo con un factor de potencia de 1. Los SAI (UPS) y los generadores se especifican en VA, porque su límite es la corriente.

**¿Cuántos amperios admite un circuito doméstico?**
Depende de la normativa local y del cable. Los valores habituales son 13 A o 16 A por toma en Europa, y 15 A o 20 A por circuito en Norteamérica.

## Calculadoras relacionadas

- [Vatios a amperios](../watts-to-amps/index.html): la conversión en sentido contrario.
- [Amperios a kW](../amps-to-kw/index.html): cargas trifásicas mayores en kilovatios.
- [Ley de Ohm y potencia eléctrica](../ohms-law/index.html): tensión, corriente, resistencia y potencia juntas.
- [Sección de cable y caída de tensión](../cable-sizing/index.html): el cable que transporta esta corriente.
