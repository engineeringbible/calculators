# Calculadora del momento de inercia (propiedades de secciones)

**Resumen:** Momento de inercia, módulo resistente elástico y plástico, centro de gravedad y radio de giro de rectángulos, tubos, perfiles en I, en T y en U.

## Introducción

El momento de inercia de área, o segundo momento de área, mide cómo resiste una sección transversal a la flexión. Crece con el cubo del canto: un tablón de canto es mucho más rígido que el mismo tablón tumbado. La flecha de una viga, la tensión de flexión y el pandeo de columnas dependen de él, junto con el módulo resistente para la tensión y el radio de giro para el pandeo.

Esta calculadora da el área, el centro de gravedad, los momentos de inercia respecto a ambos ejes, los módulos resistentes elástico y plástico, los radios de giro y el momento polar de las formas habituales: rectángulos macizos y huecos, barras redondas y tubos, perfiles en I, perfiles en T, perfiles en U y triángulos. Está pensada para ingenieros y estudiantes que comprueban una viga o una columna, o una sección que no figura en un catálogo.

## Fórmulas

Rectángulo macizo b × h y barra redonda de diámetro d:

    I_x = b h³ / 12,   S_x = b h² / 6,   Z_x = b h² / 4
    I = π d⁴ / 64,     S = π d³ / 32,     Z = d³ / 6,   J = π d⁴ / 32

Secciones compuestas (I, T, U, cajón), a partir de sus rectángulos:

    ȳ = Σ A_i y_i / Σ A_i
    I_x = Σ ( b_i h_i³ / 12 + A_i (y_i − ȳ)² )       teorema de Steiner (ejes paralelos)
    S_x = I_x / c_max,   r_x = √(I_x / A)
    Z_x = Σ A_i |y_i − y_p|,   y_p divide el área en dos mitades

- c_max: distancia del centro de gravedad a la fibra más alejada
- S: módulo resistente elástico, para la tensión en el primer punto que plastifica: σ = M / S
- Z: módulo resistente plástico, para el momento totalmente plástico: M_p = f_y Z
- r: radio de giro, usado para la esbeltez de columnas L / r

## Hipótesis y limitaciones

- Las formas tienen lados rectos y esquinas vivas. Los perfiles de acero laminado tienen radios de acuerdo y a veces alas de espesor variable, por lo que los valores del catálogo son unos pocos por ciento mayores. Usa el catálogo para los perfiles normalizados y esta calculadora para secciones armadas o no normalizadas.
- Ix es respecto al eje horizontal que pasa por el centro de gravedad e Iy respecto al vertical. En secciones asimétricas como el perfil en T y el perfil en U, se da la posición del centro de gravedad.
- En secciones de pared delgada, el pandeo local puede ser determinante antes de alcanzar el momento plástico. Las clases de sección de EN 1993-1-1 o de AISC 360 deciden si se puede usar Z.
- El momento polar es la constante de torsión solo en secciones circulares. Las secciones abiertas, como los perfiles en I, son mucho más débiles a torsión de lo que sugiere Ix + Iy.

## Ejemplo resuelto

¿Cuáles son las propiedades de una viga de madera rectangular de 100 mm de ancho y 200 mm de canto que flecta respecto a su eje fuerte?

1. Área: 100 × 200 = 20 000 mm².
2. Momento de inercia: 100 × 200³ / 12 = 66.67 × 10⁶ mm⁴ = 6 667 cm⁴.
3. Módulo resistente elástico: 100 × 200² / 6 = 666 667 mm³ = 666.7 cm³.
4. Módulo resistente plástico: 100 × 200² / 4 = 1 000 cm³.
5. Radio de giro: √(6 667 × 10⁴ / 20 000) = 57.7 mm.

Tumbada, la misma viga tiene Iy = 1 667 cm⁴, una cuarta parte de la rigidez.

## Preguntas frecuentes

**¿Cuál es el momento de inercia de un rectángulo?**
b h³ / 12 respecto a su centro de gravedad, siendo h la dimensión en la dirección de la flexión. Duplicar el canto lo hace ocho veces más rígido.

**¿Qué diferencia hay entre el momento de inercia y el módulo resistente?**
El momento de inercia determina la rigidez y la flecha. El módulo resistente, I dividido por la distancia a la fibra exterior, determina la tensión de flexión: σ = M / S.

**¿Qué es el módulo resistente plástico?**
El momento estático de área respecto al eje que divide la sección en dos mitades iguales. Multiplicado por el límite elástico da el momento plástico, que se usa en el cálculo en estados límite de perfiles de acero compactos.

**¿Por qué los perfiles en I tienen esa forma?**
El material alejado del eje neutro suma a I con el cuadrado de su distancia. Poner la mayor parte del acero en las alas da un I elevado con poco peso.

**¿Es lo mismo que el momento de inercia de masa?**
No. El momento de inercia de área es una propiedad de una sección transversal, en mm⁴ o in⁴, y se usa en flexión. El momento de inercia de masa, en kg·m², mide la resistencia a la rotación y se usa en dinámica.

**¿Cómo uso el radio de giro?**
Determina la esbeltez de las columnas: la carga de pandeo disminuye con (L / r)². Las columnas pandean respecto al eje con el menor r.

## Calculadoras relacionadas

- [Flecha de vigas](../beam-deflection/index.html): flecha y tensión a partir del momento de inercia.
- [Pandeo de columnas](../column-buckling/index.html): pandeo de Euler a partir de I y r.
- [Propiedades de secciones de refuerzos](../stiffener-section/index.html): refuerzos con chapa colaborante.
- [Momento de inercia de masa](../mass-moment-of-inertia/index.html): cuerpos en rotación.
