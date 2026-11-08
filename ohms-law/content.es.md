# Calculadora de la ley de Ohm y potencia eléctrica

**Resumen:** Tensión, corriente, resistencia y potencia a partir de dos de ellas, con la ley de Ohm V = I R y P = V I, en CC y en CA resistiva.

## Introducción

La ley de Ohm es la primera relación que aprende todo electricista e ingeniero, y la que más se usa: la tensión (voltaje) entre los bornes de una resistencia es la corriente que la atraviesa multiplicada por su resistencia. Junto con la ley de la potencia P = V I, relaciona cuatro magnitudes, de modo que dos cualesquiera fijan las otras dos. Esta calculadora toma el par que conozcas (tensión y corriente, tensión y resistencia, corriente y resistencia, o potencia con cualquiera de las otras) y devuelve el resto.

Usos típicos: comprobar la corriente que absorberá un calefactor o la bobina de un solenoide, la resistencia que debe tener una carga para disipar una potencia dada, la caída de tensión en una resistencia conocida o la potencia nominal que necesita una resistencia. Está pensada para electricistas, técnicos, estudiantes y cualquiera que dimensione un circuito sencillo de CC o de CA resistiva.

## Fórmulas

La ley de Ohm y la ley de la potencia:

    V = I R
    P = V I = I² R = V² / R

A partir de cada par de valores conocidos:

    V and I:  R = V / I,        P = V I
    V and R:  I = V / R,        P = V² / R
    I and R:  V = I R,          P = I² R
    P and V:  I = P / V,        R = V² / P
    P and I:  V = P / I,        R = P / I²
    P and R:  I = √(P / R),     V = √(P R)

La conductancia es la inversa de la resistencia:

    G = 1 / R   (siemens)

- V: tensión entre los bornes del elemento, en voltios (eficaz en CA)
- I: corriente que lo atraviesa, en amperios (eficaz en CA)
- R: resistencia, en ohmios
- P: potencia disipada, en vatios

## Hipótesis y limitaciones

- El elemento es una resistencia lineal. Las lámparas, los diodos, las resistencias calefactoras en el arranque y los semiconductores cambian su resistencia con la corriente, así que un único valor solo describe un punto de funcionamiento.
- En CA los valores son eficaces y la carga es puramente resistiva. Los motores, los transformadores y las cargas electrónicas tienen un factor de potencia menor que 1, y entonces P = V I cos φ; para ellos usa la calculadora de potencia trifásica.
- La resistencia es el valor a la temperatura de funcionamiento. Un devanado de cobre tiene alrededor de un 4 % más de resistencia por cada 10 K que se calienta, así que una medición en frío subestima la resistencia en servicio.
- Las cuatro magnitudes pertenecen al mismo elemento. En un circuito con varias resistencias, aplica la ley a cada una por separado, o reduce primero la red a su resistencia equivalente.

## Ejemplo resuelto

La bobina de una electroválvula de 24 V CC mide 48 Ω. ¿Qué corriente absorbe y cuánto calor produce?

1. Valores conocidos: tensión y resistencia, V = 24 V y R = 48 Ω.
2. Corriente: I = V / R = 24 / 48 = 0.5 A.
3. Potencia: P = V² / R = 24² / 48 = 576 / 48 = 12 W, lo mismo que V × I = 24 × 0.5 = 12 W.
4. Conductancia: G = 1 / 48 = 0.0208 S.

Así que la bobina absorbe 0.5 A y convierte 12 W en calor. Una fuente para cuatro de estas válvulas conectadas a la vez necesita al menos 2 A, y los 12 W de la bobina son lo que su carcasa debe disipar cuando permanece energizada durante largos periodos.

## Preguntas frecuentes

**¿La ley de Ohm sirve en CA?**
Sí, con valores eficaces y una carga puramente resistiva, como un calefactor. Cuando la carga tiene inductancia o capacidad, el cociente entre tensión y corriente es la impedancia, y la potencia es V I cos φ en lugar de V I.

**¿Por qué obtengo otra resistencia cuando mido una lámpara en frío?**
La resistencia de un filamento de tungsteno se multiplica aproximadamente por diez entre el frío y la temperatura de trabajo. La ley de Ohm se cumple en cada instante, pero la propia resistencia depende de la corriente, así que usa el valor en caliente para la potencia en servicio.

**¿Qué potencia nominal debe tener una resistencia?**
Al menos la potencia que da esta calculadora, y habitualmente el doble, para que la resistencia trabaje muy por debajo de su temperatura máxima. Una resistencia que disipa 0.25 W debería ser de 0.5 W.

**¿Cómo se relaciona la potencia con la energía de la factura?**
La energía es la potencia multiplicada por el tiempo. Un calefactor de 1 kW que funciona 3 horas consume 3 kWh, sea cual sea su tensión.

**¿Por qué se calienta un cable fino?**
Su resistencia convierte la corriente en calor a razón de I² R. Si se duplica la corriente, el calentamiento se cuadruplica; por eso la sección de los cables crece deprisa con la corriente de carga.

**¿Qué es la conductancia?**
La inversa de la resistencia, en siemens. Resulta cómoda con resistencias en paralelo, porque las conductancias en paralelo simplemente se suman.

## Calculadoras relacionadas

- [Potencia trifásica y corriente de motor](../three-phase-power/index.html): para cargas con factor de potencia y para alimentaciones trifásicas.
- [Sección de cable y caída de tensión](../cable-sizing/index.html): el cable que transporta la corriente calculada aquí.
- [Capacidad y autonomía de baterías](../battery-runtime/index.html): cuánto tiempo suministra una batería esta corriente.
- [Carga, kVA y combustible de un generador](../generator-load/index.html): cómo sumar cargas en un generador.
