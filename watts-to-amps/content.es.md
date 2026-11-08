# Calculadora de vatios a amperios

**Resumen:** Amperios que absorbe una carga a partir de sus vatios y la tensión, en CC, monofásica y trifásica, con el factor de potencia en CA.

## Introducción

Los aparatos y equipos se etiquetan en vatios, pero los fusibles, los interruptores automáticos, los cables y los alargadores se especifican en amperios. Para saber si un calefactor puede compartir enchufe con un hervidor, qué fusible necesita una clavija o cuánta corriente debe suministrar un inversor de batería, hay que pasar los vatios a amperios, y eso depende de la tensión (voltaje).

Esta calculadora convierte vatios en amperios para alimentaciones de CC, CA monofásica y CA trifásica. En las cargas de CA incluye el factor de potencia, que eleva la corriente de los motores y de los equipos electrónicos por encima de lo que sugieren solo los vatios. Está pensada para particulares, electricistas, propietarios de autocaravanas y embarcaciones, e ingenieros.

## Fórmulas

Corriente a partir de la potencia:

    DC:            I = P / V
    single-phase:  I = P / (V × cos φ)
    three-phase:   I = P / (√3 × V × cos φ)

Potencia aparente:

    S = P / cos φ

- P: potencia activa, W
- V: tensión, V (entre fases en trifásica)
- cos φ: factor de potencia: 1 para calefactores y hervidores, entre 0.8 y 0.9 aproximadamente para motores

## Hipótesis y limitaciones

- Los vatios son la potencia que la carga toma de la red. Los kW de la placa de un motor son su potencia en el eje, así que la potencia de entrada es mayor según su rendimiento.
- Los valores de CA son eficaces a un factor de potencia constante. Las cargas con mala corrección del factor de potencia, como algunos drivers LED y cargadores, absorben más corriente de la que sugieren sus vatios.
- En trifásica la carga está equilibrada y la tensión es la tensión entre fases, por ejemplo 400 V o 480 V.
- No se incluyen las corrientes de conexión ni de arranque. Los motores arrancan con 5 a 8 veces su corriente de servicio, y las lámparas y fuentes de alimentación tienen un breve pico de conexión.

## Ejemplo resuelto

Un hervidor eléctrico de 1500 W funciona con una red de 230 V. ¿Cuántos amperios absorbe?

1. Un hervidor es un calefactor resistivo, así que su factor de potencia es 1.
2. Corriente: I = P / V = 1500 / 230 = 6.52 A.
3. Con una red norteamericana de 120 V, el mismo hervidor absorbería 1500 / 120 = 12.5 A.

Así que en Europa el hervidor puede compartir un circuito de 16 A con otras cargas pequeñas. En un circuito de 15 A a 120 V ocupa por sí solo la mayor parte de la capacidad.

## Preguntas frecuentes

**¿Cuántos amperios son 1000 vatios?**
A 230 V, 4.35 A; a 120 V, 8.33 A; a 12 V CC, 83 A. Cuanto menor es la tensión, mayor es la corriente para la misma potencia.

**¿Por qué necesito la tensión?**
Los vatios son voltios por amperios, así que la misma potencia puede significar corrientes muy distintas. Un aparato de camping de 12 V absorbe casi veinte veces la corriente de uno de 230 V de la misma potencia.

**¿Qué factor de potencia debo usar?**
Usa 1 para calefactores, hervidores, tostadoras y lámparas incandescentes. Usa alrededor de 0.85 para motores y compresores, y de 0.9 a 0.99 para equipos electrónicos con corrección del factor de potencia. Si importa, consulta la etiqueta o la hoja de datos.

**¿Cómo convierto vatios a amperios en trifásica?**
Divide los vatios por √3 multiplicado por la tensión entre fases y por el factor de potencia. 11 kW a 400 V y 0.85 son 18.7 A por fase.

**¿Qué fusible necesita mi clavija?**
Al menos la corriente de servicio calculada aquí, redondeada al siguiente calibre de fusible. Un calefactor de 2 kW a 230 V absorbe 8.7 A, así que necesita un fusible de 13 A en una clavija británica, no uno de 5 A.

**¿Más vatios significan siempre más amperios?**
A la misma tensión y el mismo factor de potencia, sí, en proporción directa.

## Calculadoras relacionadas

- [Amperios a vatios](../amps-to-watts/index.html): la conversión en sentido contrario.
- [kW a amperios](../kw-to-amps/index.html): cargas mayores en kilovatios, y motores.
- [Ley de Ohm y potencia eléctrica](../ohms-law/index.html): tensión, corriente, resistencia y potencia juntas.
- [Sección de cable y caída de tensión](../cable-sizing/index.html): el cable para la corriente calculada aquí.
