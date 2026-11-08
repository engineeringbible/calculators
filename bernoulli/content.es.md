# Calculadora de la ecuación de Bernoulli

**Resumen:** Presión en un segundo punto con la ecuación de Bernoulli, con la velocidad según los diámetros (venturi, reducción, tobera), el desnivel y la pérdida de carga.

## Introducción

La ecuación de Bernoulli dice que, a lo largo de una corriente, la presión, la velocidad y la altura se compensan entre sí. Donde una tubería se estrecha, el fluido se acelera y su presión baja. Donde sube, la presión se gasta en elevarlo. La fricción se lleva una parte por el camino. Este único balance explica los medidores venturi, las toberas, los sifones, la presión en lo alto de una columna ascendente y la depresión a la entrada de una bomba.

Esta calculadora obtiene la presión en un segundo punto a partir de la presión, la velocidad y la altura en el primero. La velocidad en el segundo punto puede introducirse directamente o calcularse a partir de los dos diámetros interiores, como en un venturi, una reducción o una tobera. Puedes añadir la pérdida de carga por fricción para convertirla en la ecuación de la energía completa. Muestra las presiones dinámicas, la carga total y el caudal, y avisa cuando la presión baja lo suficiente para que haya cavitación. Está pensada para ingenieros mecánicos, de procesos y navales, y para estudiantes de mecánica de fluidos.

## Fórmulas

Ecuación de Bernoulli con pérdida de carga (la ecuación de la energía):

    p₁ + ½ ρ V₁² + ρ g z₁ = p₂ + ½ ρ V₂² + ρ g z₂ + ρ g h_L

Despejada para la presión en el punto 2:

    p₂ = p₁ + ½ ρ (V₁² − V₂²) + ρ g (z₁ − z₂ − h_L)

Continuidad, para la velocidad a partir de los dos diámetros:

    V₂ = V₁ × (D₁ / D₂)²

Carga total:

    H = p / (ρ g) + V² / (2 g) + z

- p — presión, Pa (ambas manométricas o ambas absolutas)
- V — velocidad media, m/s
- z — altura sobre un plano de referencia común, m
- h_L — pérdida de carga entre los puntos, m
- g = 9.806 65 m/s²

## Hipótesis y limitaciones

- El flujo es estacionario e incompresible. Eso cubre los líquidos, y los gases solo mientras la presión cambie menos de un 10 %.
- Sin pérdida de carga el flujo es sin fricción, lo que da un límite superior de la presión recuperada. Las tuberías y los accesorios reales pierden energía; toma la pérdida de la calculadora de flujo en tuberías.
- Las dos presiones deben usar la misma referencia. La cavitación se juzga con la presión absoluta, así que para esa comprobación las lecturas manométricas se convierten con una atmósfera estándar.
- Las velocidades son valores medios con un perfil uniforme. En flujo laminar, la energía cinética es aproximadamente el doble de lo que indica la velocidad media.

## Ejemplo resuelto

Agua a 20 °C circula a 1 m/s por una tubería de 100 mm a 200 kPa manométricos y después por la garganta de un venturi de 50 mm a la misma altura. ¿Cuál es la presión en la garganta?

1. Continuidad: V₂ = 1 × (100 / 50)² = 4 m/s, porque la sección se reduce a la cuarta parte.
2. Presiones dinámicas: ½ × 998.2 × 1² = 0.50 kPa aguas arriba y ½ × 998.2 × 4² = 7.99 kPa en la garganta.
3. Variación de presión: p₁ − p₂ = 7.99 − 0.50 = 7.49 kPa.
4. Presión en la garganta: p₂ = 200 − 7.49 = 192.5 kPa manométricos.

Esa diferencia de presión es lo que mide un medidor venturi para obtener el caudal. En un venturi sin fricción la presión se recupera por completo aguas abajo; uno real pierde del 10 al 20 % de la diferencia.

## Preguntas frecuentes

**¿Por qué baja la presión donde la tubería se estrecha?**
El mismo caudal debe pasar por una sección menor, así que el fluido se acelera. La energía cinética adicional sale de la presión.

**¿Puedo usar presión manométrica?**
Sí, si la usan los dos puntos. Solo la cavitación necesita presión absoluta, y la calculadora suma una atmósfera para esa comprobación.

**¿De dónde saco la pérdida de carga?**
De la calculadora de flujo en tuberías y pérdida de carga para tubería recta y accesorios, o del coeficiente de pérdida de un accesorio: h_L = K V² / 2g.

**¿Cuándo no se aplica la ecuación de Bernoulli?**
A través de bombas y turbinas, que añaden o quitan energía; en flujos con gran transferencia de calor; y en gases con grandes cambios de presión. Tampoco describe el flujo a través de una onda de choque o un resalto hidráulico.

**¿Qué es la cavitación?**
Donde la presión absoluta baja hasta la presión de vapor del líquido, este hierve localmente. Las burbujas colapsan cuando la presión se recupera, lo que daña bombas, válvulas y hélices.

**¿Cómo funciona un medidor venturi?**
Mide la caída de presión entre la entrada y la garganta. Con Bernoulli y la continuidad, esa caída da la velocidad, y de ella sale el caudal; un coeficiente de descarga calibrado corrige la fricción.

## Calculadoras relacionadas

- [Caudal en placas de orificio y venturis (ISO 5167)](../orifice-flow/index.html): medidores de caudal con coeficientes de descarga normalizados.
- [Caudal y velocidad en tuberías](../flow-rate-velocity/index.html): velocidades a partir del caudal y el diámetro.
- [Flujo en tuberías y pérdida de carga](../pipe-flow/index.html): la pérdida de carga entre los puntos.
- [Presión hidrostática en profundidad](../hydrostatic-pressure/index.html): la presión de una columna de líquido en reposo.
