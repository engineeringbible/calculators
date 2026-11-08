# Calculadora de relación de transmisión de engranajes

**Resumen:** Relación de transmisión a partir del número de dientes en una o dos etapas, con la velocidad, el par y la potencia de salida tras las pérdidas.

## Introducción

Un tren de engranajes cambia velocidad por par (torque). Un engranaje pequeño que mueve uno grande hace girar la salida más despacio pero con más fuerza, y así es como un motor eléctrico rápido acciona una cinta transportadora, un chigre o un mezclador lentos. La relación sale directamente del número de dientes, y la potencia pasa a través del tren, menos una pequeña pérdida en cada engrane.

Esta calculadora obtiene la relación de un tren de engranajes de una o dos etapas a partir del número de dientes, o parte de una relación total conocida. Con la velocidad y el par de entrada da la velocidad de salida, el par de salida tras las pérdidas de cada etapa, las potencias de entrada y de salida, y el calor que debe disipar la reductora. Está pensada para ingenieros mecánicos y de mantenimiento, proyectistas que eligen una reductora y estudiantes de diseño de máquinas.

## Fórmulas

Relación, como velocidad de entrada entre velocidad de salida:

    una etapa:   i = z₂ / z₁
    dos etapas:  i = (z₂ / z₁) × (z₄ / z₃)

Velocidad, par y potencia de salida, con rendimiento η por etapa y k etapas:

    n_out = n_in / i
    T_out = T_in × i × ηᵏ
    P_out = P_in × ηᵏ,   P_in = 2π n_in T_in / 60

- z₁, z₃: dientes de los engranajes motores; z₂, z₄: dientes de los engranajes conducidos
- n: velocidad de giro, rpm; T: par, N·m
- η: rendimiento por etapa (rectos o helicoidales de 0.97 a 0.99, tornillo sinfín de 0.5 a 0.9)

## Hipótesis y limitaciones

- Los engranajes no deslizan, así que la relación de velocidades es exactamente la relación de dientes. Las transmisiones por correa deslizan de un 1 a un 2 %.
- Cada etapa pierde la misma fracción de la potencia que la atraviesa. Una reductora real tiene además pérdidas por batido del aceite y por las juntas que no dependen de la carga, por lo que su rendimiento es menor a carga parcial.
- No se incluyen los engranajes locos: cambian el sentido de giro, no la relación.
- El par es el valor de funcionamiento en régimen estable. Las reductoras se eligen con un factor de servicio para el arranque, los choques y el tipo de servicio, a menudo de 1.25 a 2.

## Ejemplo resuelto

Un motor eléctrico a 1450 rpm y 20 N·m mueve un piñón de 12 dientes que engrana con una rueda de 48 dientes. La etapa tiene un rendimiento del 98 %. ¿Qué se obtiene a la salida?

1. Relación: i = 48 / 12 = 4.00.
2. Velocidad de salida: 1450 / 4 = 362.5 rpm.
3. Par de salida: 20 × 4 × 0.98 = 78.4 N·m.
4. Potencia de entrada: 2π × 1450 × 20 / 60 = 3.04 kW, de la cual un 2 %, es decir 61 W, se convierte en calor en el engrane.

Un piñón de 12 dientes está por debajo de los 17 dientes necesarios para evitar el socavado con un perfil normalizado de 20°, así que este se fabricaría con perfil desplazado.

## Preguntas frecuentes

**¿Cómo se calcula una relación de transmisión?**
Divide el número de dientes del engranaje conducido entre el número de dientes del engranaje motor. Con varias etapas, multiplica entre sí las relaciones de cada etapa.

**¿Un engranaje de salida más grande da más par?**
Sí. El par aumenta según la relación, menos las pérdidas, y la velocidad disminuye en la misma relación. La potencia se mantiene salvo por las pérdidas.

**¿Qué hace un engranaje loco?**
Invierte el sentido de giro y salva la distancia entre ejes, pero no cambia la relación total.

**¿Qué rendimiento tienen los engranajes?**
Un engrane recto o helicoidal pierde de un 1 a un 3 %, uno cónico de un 2 a un 5 %. Los tornillos sinfín pueden perder la mitad de la potencia de entrada con relaciones altas, y por eso se calientan.

**¿Por qué usar dos etapas en vez de una?**
Una etapa muy por encima de 6:1 a 8:1 necesita una rueda muy grande. Dos etapas más pequeñas dan una reductora más compacta y ligera.

**¿Cuál es el número mínimo de dientes de un piñón?**
Unos 17 para un perfil normalizado con ángulo de presión de 20°. Con menos dientes se socava el pie del diente salvo que el perfil esté desplazado.

## Calculadoras relacionadas

- [Par, potencia y velocidad](../torque-power-rpm/index.html): par y potencia en cualquiera de los ejes.
- [Par, potencia y diámetro de ejes](../shaft-torque/index.html): dimensionado del eje de salida para el par más alto.
- [Vida L10 de rodamientos (ISO 281)](../bearing-life/index.html): los rodamientos que soportan las cargas de los engranajes.
- [Potencia trifásica e intensidad del motor](../three-phase-power/index.html): el motor que acciona la reductora.
