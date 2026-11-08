# Calculadora de calibre de cable (AWG y mm²)

**Resumen:** El menor calibre AWG y la menor sección métrica que mantienen la caída de tensión dentro de tu límite en CC, monofásica o trifásica, con la caída y la pérdida.

## Introducción

Un cable demasiado fino para su longitud desperdicia potencia en forma de calor y entrega una tensión (voltaje) baja en la carga. Entonces los motores se calientan, los drivers LED parpadean y una bomba de 12 V se cala. La caída de tensión crece con la corriente y con la longitud del tendido, así que los circuitos largos suelen necesitar un cable mayor del que sugeriría solo la corriente.

Esta calculadora encuentra el menor tamaño de cable, en calibre AWG y en sección métrica en mm², que mantiene la caída de tensión dentro de tu límite. Sirve para circuitos de CC, de CA monofásica y trifásicos equilibrados, en cobre o en aluminio. También da la caída real, la tensión en la carga y la potencia perdida en el cable. Está pensada para electricistas, instaladores de sistemas solares, náuticos y de autocaravanas, e ingenieros que comprueban un circuito antes de elegir el cable.

## Fórmulas

Caída de tensión de un circuito de longitud de ida L:

    DC and single-phase:   ΔV = 2 × I × L × R′
    three-phase:           ΔV = √3 × I × L × R′

Resistencia por metro de un conductor de sección A a la temperatura T:

    R′ = ρ20 × (1 + α (T − 20)) / A × k_s

Sección mínima para una caída admisible ΔV_max = p × V:

    A_min = b × I × L × ρ(T) × k_s / (p × V)

- b: 2 en CC y monofásica, √3 en trifásica
- I: corriente de carga; L: longitud de ida; V: tensión de alimentación; p: caída admisible como fracción
- ρ20, α: cobre 1.7241 × 10⁻⁸ Ω·m y 0.00393 /K; aluminio 2.8264 × 10⁻⁸ Ω·m y 0.00403 /K
- k_s: 1.02 para cable cableado (ASTM B8), 1 para macizo

El resultado es el menor calibre AWG y la menor sección métrica IEC 60228 con al menos A_min.

## Hipótesis y limitaciones

- El cable se dimensiona solo por caída de tensión. También debe transportar la corriente con seguridad, y eso lo fija el reglamento de instalaciones según el aislamiento y el tipo de instalación: NEC Table 310.16 y 240.4(D) en EE. UU., IEC 60364-5-52 en otros lugares. Usa la mayor de las dos secciones.
- Se desprecia la reactancia. Eso queda del lado de la seguridad para cables de hasta unos 1/0 AWG o 50 mm². Para alimentaciones de CA mayores con un factor de potencia bajo, usa la calculadora de sección de cable, que incluye la reactancia.
- La longitud es de ida, de la alimentación a la carga. La fórmula añade el camino de retorno.
- La temperatura del conductor por defecto es 75 °C porque la tabla de resistencias del NEC la usa. Un cable poco cargado trabaja más frío, así que la caída real es algo menor.
- Por defecto solo se ofrecen los calibres habituales para edificios: de 18 a 4 AWG en números pares, luego 3, 2, 1 y de 1/0 a 4/0. Existen calibres impares como 5 o 7 AWG, pero rara vez hay existencias.

## Ejemplo resuelto

Un circuito monofásico de 20 A y 120 V alimenta un taller a 100 ft del cuadro. La caída debe quedarse dentro del 3 %. ¿Qué cable de cobre hace falta?

1. Caída admisible: 3 % × 120 V = 3.6 V.
2. Resistividad a 75 °C: ρ = 1.7241 × 10⁻⁸ × (1 + 0.00393 × 55) = 2.0968 × 10⁻⁸ Ω·m, o 2.1387 × 10⁻⁸ con el incremento por cableado.
3. Sección mínima: A = 2 × 20 × 30.48 × 2.1387 × 10⁻⁸ / 3.6 = 7.24 mm².
4. El 10 AWG solo tiene 5.26 mm², así que el menor calibre AWG es el 8 AWG, con 8.37 mm². Su caída es 2 × 20 × 30.48 × 2.556 × 10⁻³ = 3.12 V, es decir, un 2.60 %.
5. En secciones métricas, 6 mm² se queda corto, así que hacen falta 10 mm², con una caída del 2.17 %.

Así que el tendido necesita 8 AWG de cobre, dos calibres por encima del 12 AWG que permitiría por sí solo el interruptor automático de 20 A. El cable desperdicia unos 62 W a plena carga.

## Preguntas frecuentes

**¿Qué calibre de cable necesito para 20 amperios?**
Para un tendido corto, 12 AWG de cobre, el calibre que NEC 240.4(D) permite con un interruptor automático de 20 A. A partir de unos 50 ft a 120 V la caída supera el 3 % y hace falta 10 AWG o mayor.

**¿Cuánta caída de tensión es aceptable?**
Las notas informativas del NEC sugieren un 3 % para un circuito derivado y un 5 % para la alimentación y el circuito derivado juntos. IEC 60364-5-52 sugiere un 3 % para alumbrado y un 5 % para otras cargas. Los sistemas de CC de baja tensión suelen usar un 3 % o menos.

**¿La longitud es de ida o de ida y vuelta?**
Introduce la distancia de ida de la alimentación a la carga. La calculadora la duplica para el conductor de retorno, o usa √3 en trifásica.

**¿Por qué la trifásica necesita un cable más fino?**
La trifásica transporta la misma potencia con menos corriente por conductor, y la caída entre fases lleva un factor √3 en lugar de 2. Para la misma corriente y la misma tensión, la sección del cable baja alrededor de un 13 %.

**¿Puedo usar cable de aluminio?**
Sí, pero necesita unas 1.64 veces la sección del cobre para la misma caída, normalmente dos calibres AWG más. Usa conectores aptos para aluminio.

**¿Por qué la calculadora propone 10 mm² si el 8 AWG solo tiene 8.4 mm²?**
Las secciones métricas saltan de 6 a 10 mm², y 6 mm² está por debajo de los 7.24 mm² necesarios. La siguiente sección es la única que cumple el límite.

## Calculadoras relacionadas

- [Tabla y conversor de calibres AWG](../awg-wire-gauge/index.html): diámetro, sección y resistencia de cada calibre.
- [Sección de cable y caída de tensión](../cable-sizing/index.html): secciones IEC con reactancia y factor de potencia.
- [Vatios a amperios](../watts-to-amps/index.html): la corriente a partir de la potencia de la carga.
- [Ley de Ohm](../ohms-law/index.html): tensión, corriente y resistencia del cable.
