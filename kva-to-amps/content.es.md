# Calculadora de kVA a amperios

**Resumen:** Corriente de línea a partir de los kVA y la tensión en monofásica y trifásica, kVA a partir de amperios, y los kW con un factor de potencia dado.

## Introducción

Los transformadores, los generadores y los SAI (UPS) se especifican en kVA, mientras que los cables, los interruptores automáticos y los embarrados se eligen en amperios. Convertir entre ambos es una de las cuentas más habituales en ingeniería eléctrica de potencia, y equivocarse con √3 en un sistema trifásico da un resultado desviado un 73 %.

Esta calculadora convierte la potencia aparente en kVA en corriente de línea para alimentaciones monofásicas y trifásicas a cualquier tensión (voltaje), y la corriente de nuevo en kVA. Con un factor de potencia da también la potencia activa en kW y la potencia reactiva en kvar. Está pensada para electricistas, ingenieros eléctricos y cualquiera que dimensione cables y protecciones para un transformador, un generador o una acometida.

## Fórmulas

Trifásica, con la tensión entre fases:

    I = S / (√3 × V)
    S = √3 × V × I

Monofásica:

    I = S / V
    S = V × I

Potencia activa y reactiva con un factor de potencia cos φ:

    P = S × cos φ
    Q = S × sin φ = S × √(1 − cos² φ)

- S: potencia aparente, VA (1 kVA = 1000 VA)
- V: tensión, V (entre fases en trifásica)
- I: corriente de línea, A

## Hipótesis y limitaciones

- La alimentación es equilibrada y senoidal. En trifásica la tensión es entre fases y la corriente es la corriente de línea, tanto si la carga está conectada en estrella como en triángulo.
- Los kVA fijan la corriente. El factor de potencia solo los convierte en kW; por eso un equipo especificado en kVA lleva su corriente completa con cualquier factor de potencia.
- En un transformador, introduce la tensión del devanado cuya corriente quieres. La corriente del secundario a 400 V es mucho mayor que la del primario a 11 kV.
- Los armónicos de variadores y rectificadores elevan la corriente eficaz por encima del valor fundamental que se da aquí.

## Ejemplo resuelto

¿Cuál es la corriente a plena carga del secundario de un transformador de 1000 kVA a 400 V trifásica?

1. Fórmula trifásica: I = S / (√3 × V).
2. I = 1 000 000 / (1.732 × 400) = 1 443 A.
3. Con un factor de potencia de 0.8, el transformador suministra 1000 × 0.8 = 800 kW.

Los cables o el embarrado que salen de este transformador deben transportar 1 443 A, antes de cualquier reducción por agrupamiento o temperatura.

## Preguntas frecuentes

**¿Cómo convierto kVA a amperios?**
En trifásica, divide los VA por √3 multiplicado por la tensión entre fases. En monofásica, divide los VA por la tensión. 1 kVA a 400 V trifásica son 1.443 A.

**¿Por qué √3 en trifásica?**
Cada una de las tres fases lleva la corriente de línea a la tensión de fase, que es la tensión entre fases dividida por √3. Al sumar las tres fases se obtiene √3 × V × I.

**¿Qué diferencia hay entre kVA y kW?**
Los kVA son potencia aparente, tensión por corriente. Los kW son la potencia activa que realiza trabajo, los kVA multiplicados por el factor de potencia. Con factor de potencia 0.8, 100 kVA son 80 kW.

**¿Cuántos amperios da un generador de 500 kVA?**
A 400 V trifásica, 722 A; a 480 V, 601 A; a 690 V, 418 A.

**¿Por qué los generadores se especifican en kVA?**
Sus devanados están limitados por la corriente, sea cual sea el factor de potencia de la carga. El motor térmico está limitado por los kW; por eso en la placa aparecen ambos valores.

**¿Uso la tensión de fase o la tensión entre fases?**
La tensión entre fases con la fórmula de √3, por ejemplo 400 V en Europa o 480 V en Norteamérica. Con la tensión de fase hay que usar un factor 3 en su lugar.

## Calculadoras relacionadas

- [Potencia trifásica y corriente de motor](../three-phase-power/index.html): corrientes de motor a partir de la placa.
- [Dimensionado de transformadores y regulación de tensión](../transformer-sizing/index.html): cómo elegir los kVA del transformador.
- [Carga, kVA y combustible de un generador](../generator-load/index.html): carga de generadores en kW y kVA.
- [Sección de cable y caída de tensión](../cable-sizing/index.html): el cable para la corriente calculada aquí.
