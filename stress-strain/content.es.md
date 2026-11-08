# Calculadora de tensión y deformación (módulo de Young)

**Resumen:** Tensión axial, deformación unitaria y alargamiento de una barra a partir de fuerza, área, longitud y módulo de Young, o cálculo inverso de cada dato.

## Introducción

La tensión es la fuerza dividida por el área que la soporta. La deformación unitaria es la variación de longitud dividida por la longitud inicial. En el rango elástico ambas son proporcionales, y la constante es el módulo de Young: σ = E ε. Una barra de acero de 20 mm y 2 m de longitud, traccionada con 50 kN, soporta 159 MPa y se alarga 1.5 mm.

Esta calculadora aplica estas tres relaciones a una barra a tracción o a compresión. Obtiene la tensión, la deformación y el alargamiento a partir de la fuerza, o trabaja al revés para obtener la fuerza, el módulo, el área necesaria para una tensión admisible o la longitud inicial. Incluye el módulo de Young de materiales habituales tomado de normas y hojas de datos. Está pensada para estudiantes, técnicos e ingenieros que dimensionan varillas, tirantes, tornillos y probetas.

## Fórmulas

    σ = F / A
    ε = ΔL / L
    σ = E ε
    ΔL = F L / (A E)
    k = E A / L

- F: fuerza axial; A: área de la sección, π d²/4 para una barra redonda
- L: longitud inicial; ΔL: alargamiento (acortamiento a compresión)
- E: módulo de Young; σ: tensión normal; ε: deformación unitaria
- k: rigidez axial de la barra, fuerza por unidad de alargamiento

Cada modo de cálculo reordena las mismas relaciones. Para una tensión admisible, A = F / σ_allow.

## Hipótesis y limitaciones

- La carga actúa según el eje de una barra recta de sección constante, así que la tensión es uniforme. Los taladros, las roscas y los cambios de sección elevan la tensión local.
- El material permanece en régimen elástico. La calculadora avisa cuando la tensión supera el límite elástico guardado para el material, porque ahí deja de cumplirse la ley de Hooke.
- La deformación es la deformación ingenieril sobre la longitud inicial. Se desprecia el pequeño cambio de área debido al coeficiente de Poisson.
- Una barra esbelta a compresión pandea con una carga menor. Comprueba el pandeo por separado.
- Los módulos son valores de normas o de hojas de datos. El Eurocódigo usa 210 GPa para el acero y AISC usa 200 GPa, y los valores reales varían unos pocos por ciento.

## Ejemplo resuelto

Un tirante de acero de 20 mm de diámetro y 2 m de longitud soporta una tracción de 50 kN. Toma E = 210 GPa. ¿Cuáles son la tensión y el alargamiento?

1. Área: π × 20² / 4 = 314.16 mm².
2. Tensión: 50 000 N / 314.16 mm² = 159.2 MPa.
3. Deformación: 159.2 / 210 000 = 0.000758, es decir, 0.0758 %.
4. Alargamiento: 0.000758 × 2 000 mm = 1.516 mm.

La tensión queda muy por debajo del límite elástico de 235 MPa del S235, así que la barra permanece en régimen elástico. Su rigidez axial es 210 000 × 314.16 / 2 000 = 33.0 kN/mm.

## Preguntas frecuentes

**¿Qué diferencia hay entre tensión y deformación?**
La tensión es la fuerza interna por unidad de área, en pascales o psi. La deformación es la variación relativa de longitud y no tiene unidades.

**¿Cómo calculo el módulo de Young a partir de un ensayo?**
Divide la tensión por la deformación en el tramo recto y elástico de la curva. Usa la fuerza y el alargamiento de dos puntos para evitar errores por las holguras del inicio.

**¿Cuál es el módulo de Young del acero?**
Unos 200 a 210 GPa, o 29 000 a 30 500 ksi. Las aleaciones de aluminio rondan los 70 GPa, así que se alargan el triple con la misma tensión.

**¿La fórmula sirve a compresión?**
Sí, tomando la fuerza como compresión y ΔL como acortamiento. Las piezas esbeltas pandean mucho antes de alcanzar el límite elástico, así que comprueba el pandeo.

**¿Qué es la microdeformación?**
Una millonésima de deformación, la unidad que miden las galgas extensométricas. La barra del ejemplo tiene 758 microdeformaciones.

**¿Por qué la calculadora avisa sobre el límite elástico?**
Por encima del límite elástico, el acero se alarga plásticamente y el alargamiento se hace mucho mayor de lo que predice la ley de Hooke.

## Calculadoras relacionadas

- [Constantes elásticas](../elastic-constants/index.html): módulo de cizalladura y módulo de compresibilidad a partir de E y el coeficiente de Poisson.
- [Propiedades de materiales](../material-properties/index.html): límite elástico, densidad y módulo de materiales habituales.
- [Dilatación térmica y tensión por coacción](../thermal-expansion/index.html): deformación y tensión por un cambio de temperatura.
- [Círculo de Mohr](../mohr-circle/index.html): tensiones combinadas y tensiones principales.
