# Calculadora y comparador de medidas de neumáticos

**Resumen:** Diámetro, flanco, circunferencia y vueltas por milla a partir de medidas como 225/45R17, y comparación de dos medidas: error del velocímetro y velocidad real.

## Introducción

Una medida de neumático como 225/45R17 da la anchura de sección en milímetros, la altura del flanco como porcentaje de la anchura y el diámetro de la llanta en pulgadas. Para hallar el diámetro total, multiplica la anchura por la relación de aspecto y obtendrás la altura del flanco. Luego suma dos flancos al diámetro de la llanta. Para 225/45R17 el flanco mide 101.25 mm y el neumático tiene 634.3 mm, o 24.97 in, de alto.

Esta calculadora lee dos medidas y da la anchura, el flanco, el diámetro, la circunferencia y las vueltas por milla de cada una. Después las compara: la diferencia de diámetro, y la velocidad real cuando el velocímetro estaba ajustado para el neumático original. Está pensada para conductores que eligen llantas y neumáticos nuevos, y para cualquiera que compruebe un montaje de medida aumentada.

## Fórmulas

Medidas métricas, anchura W en mm, relación de aspecto AR en %, llanta d en pulgadas:

    H = W × AR / 100
    D = d × 25.4 + 2 H        mm

Las medidas flotation, como 33x12.50R15, dan D y W en pulgadas:

    H = (D − d) / 2

Circunferencia, vueltas y velocímetro:

    C = π D
    revs per mile = 63 360 / (π D[in])
    true speed = reading × D_B / D_A

- H: altura del flanco; D: diámetro total
- D_A: el neumático original para el que se ajustó el velocímetro; D_B: el neumático nuevo
- Los prefijos P, LT y ST, las letras de construcción ZR y R y los índices de carga y de velocidad no cambian la medida

## Hipótesis y limitaciones

- Las dimensiones son los valores nominales de diseño de la medida. Los neumáticos reales de la misma medida difieren ligeramente entre marcas y con el desgaste del dibujo.
- Las vueltas por milla son geométricas. Los fabricantes de neumáticos las miden rodando bajo carga, así que sus cifras son algo más altas.
- Un cambio de diámetro altera el velocímetro, el cuentakilómetros y las entradas de los sistemas de tracción y de estabilidad. Comprueba también la holgura con la carrocería y la suspensión.
- No se aceptan medidas sin relación de aspecto, como 195R14. Introduce la medida completa.

## Ejemplo resuelto

Un coche con neumáticos 225/45R17 pasa a 245/40R18. ¿Cuánto más alto es el neumático nuevo, y cuál es la velocidad real cuando el velocímetro marca 60 mph?

1. Flanco antiguo: 225 × 0.45 = 101.25 mm, o 3.99 in.
2. Diámetro antiguo: 17 × 25.4 + 2 × 101.25 = 634.3 mm, o 24.97 in, y 807.6 vueltas por milla.
3. Flanco nuevo: 245 × 0.40 = 98.0 mm.
4. Diámetro nuevo: 18 × 25.4 + 2 × 98.0 = 653.2 mm, o 25.72 in, y 784.2 vueltas por milla.
5. Diferencia: 653.2 / 634.3 − 1 = 2.98 %.
6. Velocidad real con 60 mph indicadas: 60 × 653.2 / 634.3 = 61.8 mph.

Una medida más parecida es 245/40R17 o 225/40R18, según la llanta elegida.

## Preguntas frecuentes

**¿Qué significan los números de un neumático?**
En 225/45R17, 225 es la anchura de sección en mm, 45 es la altura del flanco como porcentaje de la anchura, R significa radial y 17 es el diámetro de la llanta en pulgadas.

**¿Cómo calculo el diámetro de un neumático?**
Multiplica la anchura por la relación de aspecto para obtener la altura del flanco. Suma el doble de esa altura al diámetro de la llanta, pasando las pulgadas a milímetros con 25.4.

**¿Cuánto puedo aumentar la medida sin afectar al velocímetro?**
Cualquier cambio le afecta en proporción al diámetro. Mantén el diámetro nuevo lo más cerca posible del original; esta calculadora avisa por encima del 3 %.

**¿Con neumáticos más grandes el velocímetro marca de más o de menos?**
De menos. Con un neumático más grande el coche avanza más en cada vuelta, así que la velocidad real es mayor que la lectura.

**¿Qué significa la medida 33x12.50R15?**
Es una medida flotation: 33 in de alto, 12.5 in de ancho, para una llanta de 15 in. El flanco mide (33 − 15) / 2 = 9 in.

**¿Qué diferencia hay entre las medidas P y LT?**
Los neumáticos P-metric son para turismos y los LT-metric para camionetas y vehículos comerciales ligeros con cargas mayores. Las dimensiones siguen la misma fórmula.

## Calculadoras relacionadas

- [Relación de transmisión y velocidad del vehículo](../gear-speed/index.html): rpm y velocidad con el diámetro del neumático nuevo.
- [Tiempo y velocidad final en el cuarto de milla](../quarter-mile/index.html): estimaciones de prestaciones.
- [Distancia de frenado](../stopping-distance/index.html): distancia de frenado en distintas superficies.
- [Calculadora de caballos de fuerza (hp)](../horsepower/index.html): potencia a partir del par y las rpm.
