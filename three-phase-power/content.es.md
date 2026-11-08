# Calculadora de potencia trifásica y corriente de motor

**Resumen:** kW, kVA, kvar y corriente de línea en trifásica, monofásica y CC; corriente nominal y de arranque de un motor; kvar para corregir el factor de potencia.

## Introducción

Toda cuestión eléctrica a bordo empieza por el triángulo de potencias: cuántos kilovatios toma la carga, cuántos kVA ve el generador, cuántos amperios circulan por el cable y qué efecto tiene el factor de potencia en cada uno. Esta calculadora resuelve el triángulo en tres sentidos: de una corriente y un factor de potencia medidos a las potencias, de una carga conocida a la corriente, y de la placa de un motor (potencia en el eje, rendimiento, factor de potencia) a la corriente a plena carga y de arranque. También dimensiona la batería de condensadores para elevar el factor de potencia y muestra los kVA que la carga pide al generador.

Está pensada para electricistas navales y de planta, ingenieros que dimensionan alimentaciones y generadores, y estudiantes que aprenden potencia trifásica.

## Fórmulas

Triángulo de potencias (V entre fases en trifásica, I corriente de línea):

    Three-phase:  S = √3 V I,    Single-phase:  S = V I,    DC:  P = V I
    P = S cos φ,   Q = S sin φ = √(S² − P²),   φ = acos(pf)

Corriente a partir de la potencia:

    I = P / (√3 V cos φ)   (three-phase),   I = P / (V cos φ)   (single-phase),   I = P / V   (DC)

Motor a partir de la placa:

    P_in = P_shaft / η,   I_FL = P_in / (√3 V cos φ),   losses = P_in − P_shaft
    I_start = k × I_FL,   S_start = √3 V I_start

Corrección del factor de potencia:

    Q_c = P (tan φ₁ − tan φ₂),   I_after = P / (√3 V cos φ₂)

Potencia aparente que se pide al generador = S.

- η: rendimiento del motor a carga nominal; k: múltiplo de la corriente de arranque (arranque directo 6–8, estrella-triángulo ≈ 1/3 de ese valor, arrancador suave 2–4, variador de frecuencia 1–1.5)

## Hipótesis y limitaciones

- Cargas trifásicas senoidales equilibradas con magnitudes de línea; la conexión en estrella o en triángulo no cambia las fórmulas. El desequilibrio y los armónicos de los variadores cambian las corrientes y no se modelan.
- Factor de potencia de desplazamiento a la frecuencia fundamental; no se sigue el signo de Q (inductivo o capacitivo).
- El rendimiento y el factor de potencia de placa solo valen a carga nominal; a carga parcial el factor de potencia de un motor de inducción baja y la corriente disminuye menos que la carga.
- La corriente de arranque es el valor a rotor bloqueado como múltiplo de la corriente a plena carga, con un factor de potencia supuesto de 0.3; el valor real figura en la placa (I_A/I_N) o en IEC 60034-12.
- Los condensadores se dimensionan para la frecuencia fundamental y la potencia activa introducida; la resonancia con armónicos y la sobrecompensación a carga baja requieren un estudio aparte.
- El dimensionado de un generador para el arranque de motores depende de la caída de tensión admisible y de la reactancia subtransitoria del generador, no solo de los kVA de arranque.

## Ejemplo resuelto

Un motor IE3 de 30 kW, 400 V y 4 polos, con un rendimiento de placa del 92 % y factor de potencia 0.85, con arranque directo (7 × I_N).

1. Entrada eléctrica: 30 / 0.92 = 32.6 kW; pérdidas de 2.6 kW (calor en el motor).
2. Corriente a plena carga: 32 609 / (√3 × 400 × 0.85) = 55.4 A; la cifra de catálogo para motores de esta clase es de 55–57 A.
3. Potencia aparente 38.4 kVA, potencia reactiva 20.2 kvar, ángulo de desfase 31.8°.
4. Arranque: 7 × 55.4 = 388 A, unos 269 kVA con un factor de potencia de arranque de 0.3. Un generador de 400 kVA con esta carga vería una caída de tensión del orden de los kVA de arranque divididos por su potencia nominal y multiplicados por su reactancia subtransitoria. Eso queda en el límite del 15–20 % habitual, y por eso los motores grandes en los buques usan estrella-triángulo, arrancadores suaves o arranque secuencial.
5. Corregir el factor de potencia de servicio a 0.95 requiere 32.6 × (tan 31.8° − tan 18.2°) = 9.5 kvar y reduce la corriente de línea a 49.5 A.

A partir de una corriente medida: 400 V, 50 A, cos φ 0.85 → 34.6 kVA, 29.4 kW, 18.2 kvar.

## Preguntas frecuentes

**¿Por qué √3?**
Con la tensión entre fases y la corriente de línea, la potencia por fase V_ph I_ph × 3 se convierte en √3 V_LL I_L, tanto si la carga está conectada en estrella como en triángulo.

**¿Los kW de placa son de entrada o de salida?**
De salida, en el eje (IEC 60034-1). La entrada eléctrica es mayor según el rendimiento; por eso un motor de 30 kW absorbe unos 32.6 kW.

**¿Por qué importa un factor de potencia bajo si los kW son los mismos?**
El generador y los cables transportan la corriente, que la fijan los kVA, no los kW. Con un factor de potencia de 0.7 la corriente es un 43 % mayor que con factor unidad para los mismos kW, con las pérdidas, la caída de tensión y la carga del generador que eso conlleva.

**¿Cuánta capacidad debo instalar?**
La suficiente para llegar a 0.92–0.95 con la carga normal; corregir hasta la unidad o más allá supone riesgo de factor de potencia capacitivo a carga baja y de resonancia con armónicos. En los motores grandes, corrige en el propio motor; para la planta, en el cuadro general.

**¿Qué método de arranque necesito?**
Si la red puede mantener la caída de tensión con 6–8 × I_N, el arranque directo es lo más sencillo. El arranque estrella-triángulo reduce a un tercio la corriente y el par (torque) de arranque; los arrancadores suaves y los variadores dan control a cambio de armónicos (variadores) y complejidad.

**¿Puedo usarla para un transformador o un calefactor?**
Sí: un calefactor es una carga con factor de potencia unidad en el modo de potencia de la carga; un transformador se especifica en kVA, que aquí es la potencia aparente.

**¿Y los sistemas de buques a 60 Hz o 440 V?**
La frecuencia no interviene en estas fórmulas; introduce 440 V (o 690 V) como tensión entre fases. Las corrientes de las placas de motores a 440 V/60 Hz son proporcionalmente menores que a 400 V.

## Calculadoras relacionadas

- [Sección de cable y caída de tensión](../cable-sizing/index.html): la alimentación para la corriente calculada aquí.
- [Carga, kVA y combustible de un generador](../generator-load/index.html): generadores que alimentan esta carga.
- [Capacidad y autonomía de baterías](../battery-runtime/index.html): cargas de CC y alimentaciones de emergencia.
- [Leyes de afinidad de bombas y ventiladores](../pump-affinity/index.html): la potencia en el eje que debe dar el motor.
