# Calculadora de ventaja mecánica (palanca, polipasto, gato de husillo)

**Resumen:** Ventaja mecánica ideal y real y fuerza necesaria en palancas, polipastos, planos inclinados, gatos de husillo con rozamiento, y torno.

## Introducción

La ventaja mecánica es la relación entre la carga que levanta una máquina y la fuerza que aplicas. El valor ideal es la relación entre las distancias que recorren la fuerza y la carga. El rozamiento hace que el valor real sea menor. Una palanqueta con un mango de 1.5 m y la carga a 0.3 m del apoyo multiplica tu fuerza por 5, así que 1 280 N mueven una carga de 6.4 kN.

Esta calculadora cubre las cinco máquinas clásicas: palancas de los tres géneros, polipastos, el plano inclinado, el gato de husillo y el torno. Da la ventaja mecánica ideal y real, la fuerza necesaria y el rendimiento, y para un gato de husillo los pares de subida y de bajada con el rozamiento de la rosca y del collarín. Está pensada para estudiantes, técnicos y cualquiera que planifique una elevación.

## Fórmulas

Ventaja mecánica ideal (relación de desplazamientos) y ventaja mecánica real:

    AMA = W / F,    efficiency η = AMA / IMA

Palanca, polipasto y torno:

    lever:   IMA = a_e / a_l,   F = W a_l / a_e
    pulley:  IMA = n,           F = W / (η n)
    winch:   IMA = R / r,       F = W / (η R / r)

Plano inclinado, con la fuerza paralela a la pendiente:

    IMA = 1 / sin θ,    F = W (sin θ + μ cos θ)

Gato de husillo (Shigley ecs. 8-1, 8-5, 8-6):

    T_R = (W d_m / 2) (l + π μ d_m sec α) / (π d_m − μ l sec α) + W μ_c d_c / 2
    T_L = (W d_m / 2) (π μ d_m sec α − l) / (π d_m + μ l sec α) + W μ_c d_c / 2
    IMA = 2π R / l,    F = T_R / R

- W: carga; F: fuerza aplicada; a_e, a_l: brazos de la fuerza y de la carga desde el apoyo
- n: ramales de cable que sostienen el motón móvil; R, r: radios de la rueda y del eje
- θ: ángulo de la pendiente; μ: coeficiente de rozamiento en la pendiente o en la rosca
- d_m: diámetro medio de la rosca; l: avance; α: semiángulo del flanco de la rosca (0° cuadrada, 14.5° Acme)
- μ_c, d_c: rozamiento del collarín y diámetro medio del collarín; R: radio de la palanca del gato de husillo

## Hipótesis y limitaciones

- La carga se mueve despacio a velocidad constante, así que se ignora la inercia. La fuerza aplicada es la justa para mantenerla en movimiento hacia arriba.
- Las palancas son rígidas y tienen un apoyo sin rozamiento, por lo que su ventaja real e ideal coinciden.
- En un polipasto, introduce el rendimiento global del aparejo. Disminuye a medida que se añaden poleas.
- El gato de husillo sigue las ecuaciones de tornillos de potencia de Shigley. La rosca es autoblocante cuando el término de la rosca en T_L es positivo.
- Son resultados de estática. Los equipos de elevación necesitan además su carga nominal, un coeficiente de seguridad y una inspección.

## Ejemplo resuelto

Un gato de husillo tiene una rosca cuadrada de 32 mm de diámetro exterior, paso de 4 mm y dos entradas, así que d_m = 30 mm y el avance es de 8 mm. Levanta 6.4 kN. El rozamiento de la rosca y el del collarín valen ambos 0.08, el diámetro medio del collarín es de 40 mm y el radio de la palanca es de 300 mm. Son los datos del ejemplo 8-1 de Shigley.

1. Par en la rosca para subir: 96 × (8 + 7.54) / (94.25 − 0.64) = 15.94 N·m.
2. Par en el collarín: 6 400 × 0.08 × 0.040 / 2 = 10.24 N·m, así que el par de subida es de 26.18 N·m.
3. Par de bajada: −0.466 + 10.24 = 9.77 N·m. La rosca sola dejaría bajar la carga, pero el collarín la retiene.
4. Fuerza en la palanca: 26.18 / 0.300 = 87.3 N.
5. IMA = 2π × 300 / 8 = 235.6; AMA = 6 400 / 87.3 = 73.3; rendimiento 31.1 %.

Más de dos tercios de la fuerza se pierden en rozamiento, y es el rozamiento del collarín lo que impide que el gato baje solo.

## Preguntas frecuentes

**¿Qué diferencia hay entre la ventaja mecánica ideal y la real?**
El valor ideal supone que no hay rozamiento y es la relación entre las distancias recorridas. El valor real es la carga entre la fuerza aplicada, y es menor por el rozamiento.

**¿Cuáles son los tres géneros de palanca?**
La de primer género tiene el apoyo entre la carga y la fuerza, como una palanqueta. La de segundo género tiene la carga en medio, como una carretilla. La de tercer género tiene la fuerza en medio, como unas pinzas, y siempre necesita una fuerza mayor que la carga.

**¿Cómo obtengo la ventaja mecánica de un polipasto?**
Cuenta los ramales de cable que sostienen el motón móvil. Cuatro ramales dan una ventaja ideal de 4; el rozamiento en las poleas reduce el valor real.

**¿Por qué es autoblocante un gato de husillo?**
Cuando el par de rozamiento en la rosca supera el par que crea la carga a través del avance de la rosca, la carga no puede hacer girar el tornillo. Un avance pequeño y un coeficiente de rozamiento alto hacen que un tornillo sea autoblocante.

**¿Qué rendimiento tiene un gato de husillo?**
El gato del ejemplo tiene un 31 %. Un rodamiento axial de bolas en el collarín lo aumenta; un husillo de bolas lo aumenta mucho más, pero no es autoblocante.

**¿Un plano inclinado ahorra trabajo?**
No. Reduce la fuerza pero alarga la distancia, y el rozamiento añade trabajo. La ventaja ideal es la longitud de la pendiente entre la altura.

## Calculadoras relacionadas

- [Par, potencia y velocidad](../torque-power-rpm/index.html): potencia para accionar un chigre o un husillo.
- [Relación de transmisión, rpm y par](../gear-ratio/index.html): ventaja mecánica de los trenes de engranajes.
- [Par de apriete y precarga de tornillos](../bolt-torque/index.html): otro tornillo con rozamiento.
- [Carga en eslingas y cables de elevación](../lifting-sling/index.html): cargas en eslingas y aparejos.
