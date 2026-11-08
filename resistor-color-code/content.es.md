# Calculadora del código de colores de resistencias

**Resumen:** Resistencia, tolerancia y coeficiente de temperatura a partir de las bandas de color de una resistencia de 4, 5 o 6 bandas, y las bandas para cualquier valor.

## Introducción

Las resistencias de inserción son demasiado pequeñas para imprimir en ellas su valor, así que llevan bandas de colores. Cada color representa una cifra, una potencia de diez, una tolerancia o un coeficiente de temperatura, según la norma internacional IEC 60062. Leerlas con rapidez es una habilidad básica en el banco de trabajo, y comprobar una lectura evita el error clásico de montar una pieza de 47 kΩ donde se quería una de 4.7 kΩ.

Esta calculadora lee resistencias de 4, 5 y 6 bandas. Da el valor, la tolerancia, los valores mínimo y máximo dentro de la tolerancia, el coeficiente de temperatura de las piezas de seis bandas y la serie E normalizada a la que pertenece el valor. También funciona al revés: introduce una resistencia y te indica las bandas que debes buscar. Está pensada para estudiantes, aficionados, técnicos y cualquiera que ordene un cajón de resistencias.

## Fórmulas

El código de colores (IEC 60062):

    black 0, brown 1, red 2, orange 3, yellow 4, green 5, blue 6, violet 7, grey 8, white 9

Resistencia:

    4 bands:     R = (10 d₁ + d₂) × 10^m
    5 or 6 bands: R = (100 d₁ + 10 d₂ + d₃) × 10^m

Banda multiplicadora m: plata −2, oro −1, y después los colores de cifra, del negro 0 al blanco 9.

Banda de tolerancia: marrón ± 1 %, rojo ± 2 %, verde ± 0.5 %, azul ± 0.25 %, violeta ± 0.1 %, oro ± 5 %, plata ± 10 %, sin banda ± 20 %.

Intervalo dentro de la tolerancia:

    R_min = R (1 − t),   R_max = R (1 + t)

Sexta banda, coeficiente de temperatura en ppm/K: negro 250, marrón 100, rojo 50, amarillo 25, verde 20, naranja 15, azul 10, violeta 5, gris 1.

Colores del bloque de fórmulas: black negro, brown marrón, red rojo, orange naranja, yellow amarillo, green verde, blue azul, violet violeta, grey gris, white blanco.

## Hipótesis y limitaciones

- Los colores siguen IEC 60062:2016. Las bandas de tolerancia naranja, amarilla y gris han tenido significados distintos en distintas ediciones, así que no se ofrecen.
- Las resistencias de cuatro bandas llevan dos cifras significativas, y las de cinco y seis bandas, tres. Un valor que necesita más cifras se redondea y se señala.
- Lee desde el extremo donde las bandas están agrupadas. La banda de tolerancia suele estar algo separada, y el oro o la plata nunca van primero.
- Las bandas descoloridas u oscurecidas por el calor se leen mal con facilidad, sobre todo el rojo, el naranja y el marrón. En caso de duda, mide la resistencia fuera del circuito con un polímetro.
- La tolerancia se aplica a 25 °C. El coeficiente de temperatura añade su valor en partes por millón por cada kelvin de diferencia respecto a esa temperatura.

## Ejemplo resuelto

Una resistencia tiene cuatro bandas: amarillo, violeta, rojo, oro. ¿Qué valor tiene?

1. Primera cifra: amarillo = 4. Segunda cifra: violeta = 7. Juntas forman 47.
2. Multiplicador: rojo = 10², así que el valor es 47 × 100 = 4 700 Ω = 4.7 kΩ.
3. Tolerancia: oro = ± 5 %.
4. Valor mínimo dentro de la tolerancia: 4 700 × 0.95 = 4.465 kΩ. Máximo: 4 700 × 1.05 = 4.935 kΩ.
5. 4.7 kΩ está en la serie E6, la de los valores más comunes, y por tanto también en E12 y E24.

Una resistencia de cinco bandas que se lee marrón, negro, negro, marrón, marrón es 100 × 10¹ = 1 kΩ ± 1 %. Una sexta banda roja indica un coeficiente de temperatura de 50 ppm/K.

## Preguntas frecuentes

**¿Por qué extremo empiezo a leer?**
Por el extremo donde las bandas están agrupadas. La banda de tolerancia, a menudo oro o plata, suele estar separada por un hueco mayor en el otro extremo, y el oro y la plata nunca son la primera banda.

**¿Qué diferencia hay entre 4, 5 y 6 bandas?**
Las piezas de cuatro bandas dan dos cifras significativas, lo que basta para resistencias del 5 % y del 10 %. Las de cinco bandas dan tres cifras para piezas del 1 % y más precisas. La sexta banda añade el coeficiente de temperatura.

**¿Qué significa el oro como tercera banda de cuatro?**
Es el multiplicador ×0.1, que se usa para valores inferiores a 10 Ω. Verde, azul, oro, oro es 5.6 Ω ± 5 %.

**¿Cómo distingo el rojo del naranja, o el marrón del rojo?**
Con luz cálida se parecen. Compara con una resistencia conocida, usa luz natural o mide la pieza.

**¿Por qué el valor que mido difiere un poco?**
Dentro de la banda de tolerancia, es normal. Una resistencia de 4.7 kΩ con banda de oro puede dar cualquier valor entre 4.465 y 4.935 kΩ. Mide también fuera del circuito, porque las piezas en paralelo cambian la lectura.

**¿Qué usan las resistencias de montaje superficial?**
Un código impreso: tres o cuatro cifras en las que la última es la potencia de diez (472 = 4.7 kΩ), o el código EIA-96 de dos cifras y una letra para piezas del 1 %.

## Calculadoras relacionadas

- [Ley de Ohm y potencia eléctrica](../ohms-law/index.html): lo que hace la resistencia en el circuito.
- [Divisor de tensión](../voltage-divider/index.html): cómo elegir valores normalizados para una tensión objetivo.
- [Resistencia en serie para LED](../led-resistor/index.html): otra resistencia habitual que identificar.
- [Resistencias en serie y en paralelo](../resistors-series-parallel/index.html): cómo combinar piezas para llegar a un valor que no tienes.
