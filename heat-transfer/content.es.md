# Calculadora de transmisión de calor: conducción, convección, radiación

**Resumen:** Flujo de calor por conducción a través de una pared (Fourier), convección desde una superficie (Newton) y radiación (Stefan-Boltzmann), con resistencia térmica.

## Introducción

El calor se transmite de tres maneras. Se conduce a través de los sólidos, un fluido en movimiento lo arrastra por convección, y toda superficie caliente lo radia como luz infrarroja. Cada modo tiene una ley sencilla: la ley de Fourier para la conducción, la ley de enfriamiento de Newton para la convección y la ley de Stefan-Boltzmann para la radiación. Juntas explican por qué una pared de ladrillo pierde calor, un radiador calienta una habitación y una tubería caliente necesita aislamiento.

Esta calculadora aplica cada ley a una superficie plana. Da el flujo de calor en vatios, la densidad de flujo de calor por metro cuadrado, la resistencia térmica y el coeficiente de transmisión de calor equivalente. Para la conducción incluye la conductividad térmica de metales, materiales de construcción, aislamientos, agua y aire. Está pensada para estudiantes, ingenieros y cualquiera que estime el flujo de calor a través de paredes, desde superficies o entre ellas.

## Fórmulas

Conducción a través de una pared plana (Fourier):

    Q = k A (T₁ − T₂) / L

Convección desde una superficie (Newton):

    Q = h A (T_s − T_∞)

Radiación desde una superficie hacia un entorno grande (Stefan-Boltzmann):

    Q = ε σ A (T_s⁴ − T_sur⁴),   σ = 5.670 × 10⁻⁸ W/(m²·K⁴), T en kelvin

Resistencia térmica y densidad de flujo de calor:

    R = ΔT / Q,   q″ = Q / A

- k: conductividad térmica, W/(m·K); L: espesor de la pared
- h: coeficiente de convección, W/(m²·K); ε: emisividad, de 0 a 1

## Hipótesis y limitaciones

- El flujo de calor es estacionario y unidimensional, con propiedades constantes. La conducción es a través de una pared plana; para tuberías y cilindros usa la calculadora de aislamiento de tuberías.
- El coeficiente de convección depende del fluido y de su velocidad: unos 2 a 25 W/(m²·K) para aire en reposo, 25 a 250 para aire en movimiento, y de cientos a miles para el agua.
- La radiación es entre una superficie pequeña y un entorno grande que se ven por completo. Dos superficies próximas, como los vidrios de una ventana, intercambian menos.
- Las conductividades son valores típicos cerca de la temperatura ambiente. Los aislamientos pierden buena parte de su eficacia cuando se mojan.

## Ejemplo resuelto

Una pared de ladrillo macizo de 200 mm y 10 m² tiene 20 °C en una cara y 0 °C en la otra. ¿Cuánto calor conduce?

1. Conductividad del ladrillo común: 0.72 W/(m·K).
2. Flujo de calor: Q = 0.72 × 10 × (20 − 0) / 0.2 = 720 W.
3. Densidad de flujo de calor: 720 / 10 = 72.00 W/m².
4. Resistencia térmica: 20 / 720 = 0.028 K/W.

Las películas de aire superficiales de cada cara añaden resistencia, así que una pared real pierde algo menos. Con 100 mm de poliestireno extruido en su lugar, el flujo sería de 54 W.

## Preguntas frecuentes

**¿Cuáles son los tres modos de transmisión de calor?**
La conducción a través de sólidos y fluidos en reposo, la convección por un fluido en movimiento y la radiación por ondas electromagnéticas, que no necesita ningún medio.

**¿Qué es la conductividad térmica?**
El calor que atraviesa una placa de 1 m de espesor y 1 m² por cada kelvin de diferencia de temperatura. El cobre conduce 401 W/(m·K), el ladrillo 0.72 y un buen aislamiento unos 0.03.

**¿Cómo calculo las pérdidas de calor a través de una pared?**
Divide la conductividad térmica por el espesor y multiplica por el área y por la diferencia de temperatura. En paredes de varias capas, suma las resistencias L / k de cada capa, o usa la transmitancia U en la calculadora de pérdidas de calor de edificios.

**¿Cuál es un coeficiente de convección típico?**
Unos 5 a 10 W/(m²·K) para aire en reposo sobre una pared, 25 a 100 para aire impulsado por un ventilador y 500 a 10 000 para agua bombeada.

**¿Cuánto calor radia una superficie caliente?**
Una superficie negra a 100 °C emite 1 099 W/m²; frente a un entorno a 20 °C pierde 681 W/m² netos. Un metal brillante con ε = 0.05 pierde solo una vigésima parte de eso.

**¿Qué es la emisividad?**
La capacidad de una superficie para radiar comparada con un cuerpo negro perfecto: unos 0.9 para la pintura, el ladrillo y la piel, y de 0.03 a 0.1 para los metales pulidos.

## Calculadoras relacionadas

- [Calor específico (Q = mcΔT)](../specific-heat/index.html): el calor almacenado en un material.
- [Pérdidas de calor de edificios](../heat-loss/index.html): edificios completos con transmitancias U.
- [Aislamiento de tuberías](../pipe-insulation/index.html): pérdidas de calor de tuberías aisladas.
- [Intercambiador de calor (DTML)](../heat-exchanger-lmtd/index.html): transmisión de calor entre dos fluidos.
