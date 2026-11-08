# Calculadora de kW a amperios

**Resumen:** Corriente a partir de los kW en cargas monofásicas, trifásicas y de CC, incluidos motores por sus kW en el eje y su rendimiento, con el factor de potencia.

## Introducción

Los equipos grandes se especifican en kilovatios: calefactores, enfriadoras, cargadores, bombas y motores. Antes de elegir un interruptor automático, un contactor o un cable, los kilovatios tienen que convertirse en amperios. En alimentaciones trifásicas eso supone √3 y el factor de potencia. En los motores hay una trampa más: los kW de placa son la potencia en el eje, no la potencia que se toma de la red.

Esta calculadora convierte kW en amperios para alimentaciones trifásicas, monofásicas y de CC. Puede tratar los kW como la potencia eléctrica absorbida o como la potencia de placa de un motor, que primero divide por el rendimiento. También da la potencia aparente en kVA, que es la base para dimensionar transformadores y generadores. Está pensada para electricistas, ingenieros eléctricos y de instalaciones, y personal de mantenimiento.

## Fórmulas

Potencia eléctrica de entrada:

    P_in = P                 (electrical load)
    P_in = P_shaft / η       (motor nameplate)

Corriente:

    three-phase:   I = P_in / (√3 × V × cos φ)
    single-phase:  I = P_in / (V × cos φ)
    DC:            I = P_in / V

Potencia aparente:

    S = P_in / cos φ

- V: tensión, V (entre fases en trifásica)
- cos φ: factor de potencia (motores, entre 0.8 y 0.9 aproximadamente a plena carga)
- η: rendimiento del motor (motores IE3, alrededor de 0.89 a 5 kW hasta 0.95 a 100 kW)

## Hipótesis y limitaciones

- En un motor, los kW de la placa son potencia mecánica de salida (IEC 60034-1). La calculadora añade las pérdidas del motor a través de su rendimiento.
- El factor de potencia y el rendimiento son valores a plena carga. A carga parcial el factor de potencia de un motor baja, así que su corriente disminuye más despacio que sus kW.
- En trifásica la carga está equilibrada y la tensión es entre fases.
- Esta es la corriente de servicio. Los motores con arranque directo absorben de 6 a 8 veces más durante unos segundos; consulta la calculadora de arranque de motores.

## Ejemplo resuelto

Una batería de calefactores eléctricos de 22 kW funciona a 400 V trifásica. Su regulador da un factor de potencia de 0.85. ¿Qué corriente absorbe?

1. Entrada eléctrica: P_in = 22 kW.
2. Corriente: I = 22 000 / (1.732 × 400 × 0.85) = 37.4 A por fase.
3. Potencia aparente: S = 22 / 0.85 = 25.9 kVA.

Si los 22 kW fueran la potencia de placa de un motor con un 93 % de rendimiento, la entrada sería de 23.7 kW y la corriente de 40.2 A; por eso los circuitos de motores se dimensionan con la potencia de entrada, no con los kW de placa.

## Preguntas frecuentes

**¿Cuántos amperios es 1 kW?**
A 400 V trifásica y factor de potencia 1, 1.44 A; a 230 V monofásica, 4.35 A; a 480 V trifásica, 1.20 A.

**¿Por qué √3 en trifásica?**
Las tres fases transportan la potencia juntas, y la tensión entre fases es √3 veces la tensión de fase. En conjunto, la potencia es √3 × V × I × cos φ.

**¿Los kW de un motor son de entrada o de salida?**
De salida, en el eje. La entrada es mayor según el rendimiento: un motor de 22 kW con un 93 % de rendimiento absorbe 23.7 kW.

**¿Qué factor de potencia debo usar para un motor?**
El valor de placa a plena carga, normalmente de 0.80 a 0.90. Los motores pequeños y los poco cargados tienen valores menores.

**¿Cómo elijo un interruptor automático a partir de la corriente?**
Toma la corriente a plena carga, aplica la normativa local (a menudo el 125 % para cargas continuas en Norteamérica) y ten en cuenta el arranque del motor con un interruptor o fusible adecuado para motores.

**¿Qué corriente tiene un motor de 100 kW?**
A 400 V trifásica con un 95 % de rendimiento y factor de potencia 0.87, unos 175 A.

## Calculadoras relacionadas

- [Amperios a kW](../amps-to-kw/index.html): la conversión en sentido contrario.
- [Vatios a amperios](../watts-to-amps/index.html): cargas pequeñas en vatios.
- [Potencia trifásica y corriente de motor](../three-phase-power/index.html): también arranque de motores y corrección del factor de potencia.
- [kVA a amperios](../kva-to-amps/index.html): transformadores y generadores especificados en kVA.
