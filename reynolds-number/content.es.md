# Calculadora del número de Reynolds

**Resumen:** Número de Reynolds en una tubería, un conducto no circular, una placa plana o cualquier longitud, con el régimen: laminar, de transición o turbulento.

## Introducción

El número de Reynolds compara la inercia de un fluido en movimiento con su viscosidad. Es el único número que te dice si un flujo es suave y en capas (laminar) o caótico y con mezcla (turbulento), y el que decide qué factor de fricción, qué correlación de transferencia de calor o qué coeficiente de arrastre se aplica. Todo cálculo de caída de presión en tuberías, de intercambiadores de calor o de capa límite empieza por obtenerlo.

Esta calculadora lo obtiene para una tubería circular a partir de su diámetro interior, para un conducto rectangular u otro no circular a partir de su diámetro hidráulico, para una placa plana a partir de la distancia recorrida sobre ella, o para cualquier longitud característica que elijas. Puedes dar la velocidad o, en tuberías y conductos, el caudal volumétrico. Incluye las propiedades del agua, el agua de mar, los combustibles, el aceite lubricante y el aire, o puedes introducir las tuyas. Está pensada para ingenieros mecánicos, de procesos, de climatización (HVAC) y navales, y para estudiantes que se enfrentan al diagrama de Moody.

## Fórmulas

El número de Reynolds:

    Re = V L / ν = ρ V L / μ

La longitud característica L depende de la geometría:

    circular pipe:      L = D
    non-circular duct:  L = D_h = 4 A / P
    flat plate:         L = x, the distance from the leading edge

A partir de un caudal volumétrico:

    V = Q / A,   A = π D² / 4 for a pipe

Límites de régimen:

    pipe or duct:  laminar Re < 2300,  transitional 2300 to 4000,  turbulent Re > 4000
    flat plate:    laminar Re_x < 5 × 10⁵,  turbulent beyond

- V — velocidad media, m/s
- L — longitud característica, m
- ν — viscosidad cinemática, m²/s (1 cSt = 10⁻⁶ m²/s)
- μ — viscosidad dinámica, Pa·s; ρ — densidad, kg/m³
- A — sección de paso, m²; P — perímetro mojado, m

## Hipótesis y limitaciones

- El fluido es newtoniano, con densidad y viscosidad uniformes. Para un flujo que se calienta o se enfría, toma las propiedades a la temperatura media; la viscosidad de un aceite puede reducirse a la mitad con 15 °C más.
- Los límites del flujo interno suponen flujo completamente desarrollado en una tubería llena. Una tubería muy lisa y sin vibraciones puede seguir en régimen laminar bastante por encima de 2300, pero la práctica de diseño trata la zona de 2300 a 4000 como incierta.
- El diámetro hidráulico sustituye bien al diámetro en flujo turbulento en un conducto. En flujo laminar, el factor de fricción depende de la forma del conducto y el diámetro hidráulico es solo aproximado.
- La transición en placa plana a 5 × 10⁵ corresponde a una placa lisa en una corriente tranquila. La rugosidad de la superficie y la turbulencia de la corriente libre pueden provocar la transición mucho antes, como en el casco de un buque.
- Los combustibles y aceites incluidos son grados típicos. Usa el fluido personalizado con la densidad y la viscosidad de la ficha técnica para un producto concreto.

## Ejemplo resuelto

Agua dulce a 20 °C circula a 1.5 m/s por una tubería de 50 mm de diámetro interior. ¿El flujo es laminar o turbulento?

1. Longitud característica: el diámetro interior, D = 0.05 m.
2. Viscosidad cinemática del agua a 20 °C: ν = 1.004 × 10⁻⁶ m²/s, es decir, 1.004 cSt.
3. Número de Reynolds: Re = V D / ν = 1.5 × 0.05 / 1.004 × 10⁻⁶ = 74 700.
4. Está muy por encima de 4000, así que el flujo es totalmente turbulento y se aplica el factor de fricción de Colebrook.
5. El flujo pasaría a laminar por debajo de Re = 2300, lo que exige V = 2300 × 1.004 × 10⁻⁶ / 0.05 = 0.046 m/s. Las tuberías de agua casi nunca van tan despacio, y por eso el flujo turbulento es el caso normal en agua.

Para comparar, un fuelóleo pesado de 380 cSt a 1 m/s en una tubería de 100 mm da Re = 1 × 0.1 / 380 × 10⁻⁶ = 263, claramente laminar. Los combustibles viscosos y los aceites lubricantes son la excepción habitual al flujo turbulento en tuberías.

## Preguntas frecuentes

**¿Qué número de Reynolds es turbulento?**
En tuberías, por encima de unos 4000. Por debajo de 2300 el flujo es laminar, y entre ambos valores es de transición y puede alternar entre uno y otro. En una placa plana, la capa límite pasa a turbulenta hacia 5 × 10⁵.

**¿Qué viscosidad uso, la cinemática o la dinámica?**
Cualquiera de las dos, siempre que la fórmula corresponda: Re = V L / ν con la viscosidad cinemática, o ρ V L / μ con la viscosidad dinámica. La viscosidad cinemática en cSt es la que dan las fichas técnicas de combustibles y aceites.

**¿Cómo obtengo el diámetro hidráulico de un conducto rectangular?**
Cuatro veces la sección dividida por el perímetro mojado. Para un conducto de a por b, es 2 a b / (a + b). Un conducto de 300 × 200 mm tiene un diámetro hidráulico de 240 mm.

**¿Por qué importa si el flujo es laminar o turbulento?**
Cambian la fricción, la transferencia de calor y la mezcla. Un flujo turbulento pierde más presión, pero transmite el calor mucho mejor. La fricción laminar es f = 64 / Re, mientras que la turbulenta depende también de la rugosidad de la tubería.

**¿La rugosidad de la tubería cambia el número de Reynolds?**
No. La rugosidad cambia el factor de fricción para un número de Reynolds dado y puede adelantar la transición en una placa, pero no entra en el propio Re.

**¿Cuál es el número de Reynolds del casco de un buque?**
Muy alto: un buque de 200 m a 14 nudos en agua de mar llega a unos 1.2 × 10⁹, así que su capa límite es turbulenta en casi todo el casco.

## Calculadoras relacionadas

- [Flujo en tuberías y pérdida de carga](../pipe-flow/index.html): el factor de fricción y la caída de presión a este número de Reynolds.
- [Caudal en placas de orificio y venturis (ISO 5167)](../orifice-flow/index.html): coeficientes de descarga que dependen del número de Reynolds.
- [Dimensionado de válvulas de control Cv / Kv](../control-valve-cv/index.html): el dimensionado de la válvula para el mismo caudal.
- [LMTD de intercambiadores de calor](../heat-exchanger-lmtd/index.html): donde el régimen fija el coeficiente de transferencia de calor.
