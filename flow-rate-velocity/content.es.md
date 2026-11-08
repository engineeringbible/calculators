# Calculadora de caudal y velocidad en tuberías

**Resumen:** Velocidad a partir del caudal y el diámetro interior, caudal a partir de la velocidad, o el diámetro necesario para un caudal a una velocidad objetivo.

## Introducción

El caudal, la velocidad y el tamaño de la tubería están ligados por la ecuación más sencilla de la mecánica de fluidos: el caudal es igual a la velocidad por la sección interior. Los ingenieros la usan a diario, para comprobar la velocidad en una línea existente, para ver cuánto puede transportar una tubería a una velocidad razonable o para elegir el tamaño de tubería de un caudal nuevo.

Esta calculadora la resuelve en los tres sentidos. Dale el caudal y el diámetro interior para obtener la velocidad, la velocidad y el diámetro para obtener el caudal, o el caudal y una velocidad objetivo para obtener el diámetro que necesitas. Después compara la velocidad con los rangos habituales de las líneas de agua en general, las aspiraciones de bombas y las líneas de aceite, porque una velocidad demasiado alta supone ruido, erosión y caída de presión, y una velocidad demasiado baja supone una tubería sobredimensionada y cara. Está pensada para ingenieros mecánicos, de procesos, de instalaciones y navales.

## Fórmulas

Continuidad en una tubería llena:

    Q = V × A,   A = π × D² / 4

Cada incógnita por separado:

    V = Q / A = 4 Q / (π D²)
    Q = V × π D² / 4
    D = √(4 Q / (π V))

Velocidades de diseño habituales para líquidos, en m/s:

    general water and pump discharge  1.0 to 3.0
    pump suction                      0.6 to 1.5
    fuel and lubricating oil          0.5 to 2.0

- Q — caudal volumétrico, m³/s (1 m³/h = 1/3600 m³/s)
- V — velocidad media, m/s
- D — diámetro interior, m

## Hipótesis y limitaciones

- La tubería va llena y el fluido es incompresible. Para gases, usa el caudal a la presión y la temperatura reales en la tubería.
- V es la velocidad media en la sección. La velocidad en el centro es mayor: alrededor de un 20 % más en flujo turbulento y el doble de la media en flujo laminar.
- Los rangos de diseño son práctica habitual, no límites normativos. La caída de presión admisible, el ruido, el golpe de ariete y la erosión del material de la tubería deciden el tamaño final.
- El modo de diámetro devuelve el diámetro exacto. Elige la tubería normalizada siguiente cuyo diámetro interior sea al menos así de grande; el diámetro interior depende de la norma de la tubería y del espesor de pared.

## Ejemplo resuelto

Una bomba impulsa 50 m³/h por una tubería de 100 mm de diámetro interior. ¿Cuál es la velocidad y es razonable?

1. Caudal en unidades SI: Q = 50 / 3600 = 0.01389 m³/s.
2. Sección interior: A = π × 0.1² / 4 = 0.007854 m² = 78.5 cm².
3. Velocidad: V = 0.01389 / 0.007854 = 1.77 m/s.
4. Está dentro del rango habitual de 1 a 3 m/s para una línea de impulsión de agua.

Si el mismo caudal debiera circular a 2 m/s, el diámetro interior tendría que ser D = √(4 × 0.01389 / (π × 2)) = 94.0 mm, así que le sirve una tubería DN 100 de unos 100 mm de diámetro interior.

## Preguntas frecuentes

**¿A qué velocidad debe circular el agua por una tubería?**
Normalmente de 1 a 3 m/s en líneas de impulsión, menos en tuberías domésticas pequeñas y silenciosas, y de 0.6 a 1.5 m/s en la aspiración de una bomba para protegerla de la cavitación.

**¿Cómo paso de m³/h a m/s en una tubería?**
Divide el caudal entre 3600 para obtener m³/s y después divídelo entre la sección interior en m². La calculadora hace los dos pasos.

**¿Por qué la velocidad de aspiración es menor que la de impulsión?**
La presión es mínima a la entrada de la bomba, y una velocidad menor ahí mantiene pequeña la pérdida por fricción, lo que deja más NPSH disponible frente a la cavitación.

**¿Cómo dimensiono una tubería para un caudal dado?**
Elige una velocidad objetivo para el servicio, calcula el diámetro interior con D = √(4Q/πV) y toma el tamaño normalizado inmediatamente superior. Comprueba la caída de presión en todo el recorrido con la calculadora de flujo en tuberías.

**¿Duplicar el diámetro de la tubería reduce la velocidad a la mitad?**
No, la reduce a la cuarta parte, porque la sección crece con el cuadrado del diámetro.

**¿Vale para gases?**
Sí, con el caudal real, es decir, el caudal volumétrico a la presión y la temperatura de la propia tubería, no en condiciones normales. Las líneas de gas trabajan a velocidades mucho mayores, a menudo de 10 a 20 m/s.

## Calculadoras relacionadas

- [Flujo en tuberías y pérdida de carga](../pipe-flow/index.html): la caída de presión a esta velocidad.
- [Volumen de tubería y masa del contenido](../pipe-volume/index.html): el volumen de la misma tubería.
- [Número de Reynolds y régimen de flujo](../reynolds-number/index.html): si el flujo es laminar o turbulento.
- [Leyes de afinidad de bombas y ventiladores](../pump-affinity/index.html): cómo cambia el caudal con la velocidad de la bomba.
