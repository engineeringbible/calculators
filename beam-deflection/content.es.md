# Calculadora de flecha y tensión de flexión en vigas

**Resumen:** Momento flector máximo, tensión de flexión, flecha y reacciones de vigas biapoyadas, en voladizo y biempotradas con secciones habituales.

## Introducción

La mayoría de las comprobaciones estructurales en un buque o en un taller se reducen a una viga: una vagra de cubierta, un soporte de tubería, una viga de izado, un eje entre cojinetes, una plataforma en voladizo. Con las condiciones de apoyo, la carga y la sección transversal, necesitas el momento flector máximo, la tensión resultante comparada con el límite elástico del material y la flecha comparada con un límite de servicio. Esta calculadora cubre los ocho casos clásicos de las tablas de vigas con secciones rectangulares, circulares, tubulares, en I y definidas por el usuario, y da el momento, la tensión, la flecha, las reacciones, el aprovechamiento y el coeficiente de seguridad. También dibuja el diagrama de esfuerzos cortantes, el diagrama de momentos flectores y la deformada a lo largo de la luz.

Está pensada para ingenieros mecánicos y navales que hacen un primer dimensionado, para estudiantes que comprueban sus ejercicios con las fórmulas y para cualquiera que necesite una respuesta rápida y trazable antes de abrir una herramienta de análisis completa.

## Fórmulas

Propiedades de la sección:

    Rectángulo b × h:       I = b h³ / 12,                   c = h / 2
    Rectángulo hueco:       I = [b h³ − (b−2t)(h−2t)³] / 12,  c = h / 2
    Círculo macizo d:       I = π d⁴ / 64,                   c = d / 2
    Tubo D, pared t:        I = π [D⁴ − (D−2t)⁴] / 64,       c = D / 2
    Sección en I:           I = [b h³ − (b − t_w)(h − 2t_f)³] / 12,  c = h / 2
    Z = I / c

Tensión de flexión en la fibra extrema:

    σ = M_max × c / I = M_max / Z

Casos de carga (L luz, P carga puntual, w carga por unidad de longitud, a distancia de la carga puntual, b = L − a, E módulo de Young):

| Caso | M_max | δ_max | Posición de δ_max |
|---|---|---|---|
| Biapoyada, P en el centro del vano | P L / 4 | P L³ / (48 E I) | centro del vano |
| Biapoyada, P a una distancia a | P a b / L | P s (L² − s²)^{3/2} / (9√3 E I L), s = min(a, b) | √((L² − s²)/3) desde el apoyo más alejado |
| Biapoyada, carga uniforme w | w L² / 8 | 5 w L⁴ / (384 E I) | centro del vano |
| Voladizo, P en el extremo libre | P L | P L³ / (3 E I) | extremo libre |
| Voladizo, P a una distancia a del empotramiento | P a | P a² (3L − a) / (6 E I) | extremo libre |
| Voladizo, carga uniforme w | w L² / 2 | w L⁴ / (8 E I) | extremo libre |
| Biempotrada, P en el centro del vano | P L / 8 | P L³ / (192 E I) | centro del vano |
| Biempotrada, carga uniforme w | w L² / 12 (extremos) | w L⁴ / (384 E I) | centro del vano |

Aprovechamiento y coeficiente de seguridad:

    Utilisation = σ / f_y,   FoS = f_y / σ

- f_y: límite elástico del material

## Hipótesis y limitaciones

- Teoría de Euler-Bernoulli: se desprecia la deformación por cortante. Con relaciones luz/canto inferiores a unos 10, la flecha real es un 10 % o más mayor.
- Material elástico lineal, pequeñas flechas, sección prismática y carga en el plano de simetría. No hay torsión ni comprobación del pandeo lateral-torsional: una viga en I sin arriostrar puede fallar por pandeo mucho antes de que la tensión de flexión alcance el límite elástico.
- La tensión es solo de flexión; no se cubren la tensión tangencial, las concentraciones de tensiones, la fatiga ni el pandeo local.
- Los apoyos son articulaciones ideales o empotramientos perfectos. Las uniones reales en los extremos quedan entre ambos casos.
- No se añade el peso propio; inclúyelo en w.
- La fórmula de la sección en I no incluye los radios de acuerdo y da un I un 5 % menor que las tablas de perfiles laminados (IPE 200: 1846 frente a 1943 cm⁴). Introduce el I tabulado y h/2 como sección personalizada para obtener valores exactos.
- El aprovechamiento frente al límite elástico es una comprobación elástica sin coeficientes parciales; las normas de diseño añaden coeficientes de carga y de material y pueden admitir módulos resistentes plásticos.

## Ejemplo resuelto

Un IPE 200 biapoyado de 4 m (I = 1943 cm⁴, h = 200 mm, acero S235, E = 210 GPa) soporta una carga puntual de 10 kN en el centro del vano.

1. Momento: M = P L / 4 = 10 × 4 / 4 = 10 kN·m en el centro del vano. Reacciones de 5 kN cada una.
2. Módulo resistente: Z = I / c = 1943 / 10 = 194.3 cm³ (coincide con las tablas).
3. Tensión: σ = 10 × 10⁶ N·mm / 194.3 × 10³ mm³ = 51.5 MPa. Aprovechamiento 51.5 / 235 = 21.9 %, coeficiente de seguridad 4.57.
4. Flecha: δ = P L³ / (48 E I) = 10 000 × 4³ / (48 × 210 × 10⁹ × 1943 × 10⁻⁸) = 3.27 mm, luz / 1224.

Si cambias a una carga uniformemente distribuida de 5 kN/m: M = w L² / 8 = 10 kN·m otra vez, pero δ = 5 w L⁴ / (384 E I) = 4.08 mm. Si empotras ambos extremos, la flecha en el centro del vano baja a una cuarta parte (carga puntual) o a una quinta parte (carga uniforme) del valor de la viga biapoyada.

## Preguntas frecuentes

**¿Qué límite de flecha debo usar?**
Límites de servicio habituales: luz/250 para estructuras en general, luz/360 para forjados y vigas que soportan enlucidos o equipos, luz/180 para voladizos (medido desde el empotramiento). Las reglas de construcción naval usan sus propios límites; consulta las reglas de la sociedad de clasificación.

**¿La tensión es correcta pero la flecha es grande: es un problema?**
A menudo sí: los límites de flecha condicionan las luces largas y las secciones esbeltas. La flecha crece con L³ o L⁴ y la tensión solo con L o L², así que duplicar una luz aproximadamente duplica la tensión pero multiplica la flecha por ocho a dieciséis.

**¿Por qué mi I es menor que el valor del catálogo para la misma viga en I?**
La fórmula no incluye los radios de acuerdo entre el alma y el ala. Introduce el I del catálogo y c = h/2 como sección personalizada.

**¿Los extremos empotrados siempre ayudan?**
Reducen el momento y la flecha en el centro del vano, pero introducen momentos en los extremos del mismo orden y requieren uniones capaces de soportarlos. Un angular atornillado al alma no es un empotramiento.

**¿Puedo usarla para un eje entre cojinetes?**
Para flexión estática sí, con la sección circular. Los ejes giratorios también necesitan una comprobación a fatiga y una comprobación de flecha y giro en los cojinetes y las juntas.

**¿Y las cargas combinadas?**
Superpón: calcula cada carga por separado y suma momentos y flechas en el mismo punto (válido en el rango elástico lineal). Las cargas puntuales y distribuidas en posiciones distintas no tienen por qué alcanzar su máximo en el mismo punto.

**¿Cómo introduzco un perfil hueco de catálogo?**
Usa el rectángulo hueco o el tubo con las dimensiones exteriores nominales y el espesor de pared, o introduce el I del catálogo y h/2 como sección personalizada, lo que también tiene en cuenta los radios de las esquinas.

## Calculadoras relacionadas

- [Pandeo de columnas (Euler y Johnson)](../column-buckling/index.html): el caso equivalente a compresión.
- [Par, potencia y diámetro de ejes](../shaft-torque/index.html): torsión de ejes que además flectan.
- [Recipiente a presión de pared delgada](../pressure-vessel/index.html): tensiones de membrana en envolventes.
- [Conversor de unidades de ingeniería](../unit-converter/index.html): cm⁴, in⁴, kN·m, kip·ft.
