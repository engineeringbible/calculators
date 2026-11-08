# Calculadora del par de apriete y la precarga de tornillos

**Resumen:** Precarga y par de apriete de tornillos métricos ISO por el método VDI 2230, con clase de resistencia, rozamiento, carga de prueba y dispersión.

## Introducción

Una unión atornillada funciona gracias a la precarga, no al par (torque): la fuerza de apriete mantiene unidas las piezas y soporta la carga exterior. El par es solo el medio para producir esa precarga, y la mayor parte, normalmente un 85–90 %, se gasta en vencer el rozamiento en la rosca y bajo la cabeza. Esta calculadora sigue el método VDI 2230, usado en toda la ingeniería mecánica europea: determina la precarga que admite un tornillo (el 90 % del límite elástico con la tracción y la torsión combinadas del apriete, una fracción de la carga de prueba de ISO 898-1 o un valor que tú indiques) y la convierte en un par de apriete para la condición de rozamiento y el diámetro de apoyo reales. Da las partes del par en la rosca y bajo la cabeza, el factor de apriete equivalente K, las tensiones y la precarga mínima tras la dispersión de la llave dinamométrica.

Los ingenieros navales y mecánicos la usan para tornillos de bridas, de bancadas y de acoplamientos cuando no hay una tabla del fabricante aplicable; los estudiantes la usan para ver por qué «T = 0.2 F d» es solo una regla aproximada.

## Fórmulas

Geometría de la rosca (ISO 68-1, paso grueso P, diámetro nominal d):

    d₂ = d − 0.6495 P        diámetro medio
    d₃ = d − 1.2269 P        diámetro del núcleo
    d_s = (d₂ + d₃) / 2
    A_s = π d_s² / 4          sección resistente a tracción

Carga de prueba (ISO 898-1):

    F_p = S_p × A_s

Precarga de montaje al 90 % del límite elástico con tensión combinada (VDI 2230 ec. R8/1):

    F_M = A_s × 0.9 R_p0.2 / √( 1 + 3 [ (3/2)(d₂/d_s)( P/(π d₂) + 1.155 μ_G ) ]² )

Par de apriete (VDI 2230 ec. R8/4):

    M_G = F_M (0.16 P + 0.58 d₂ μ_G)          par en la rosca
    M_K = F_M μ_K D_Km / 2                     par de rozamiento bajo la cabeza
    M_A = M_G + M_K
    D_Km = (d_w + d_h) / 2                     diámetro medio de apoyo: diámetro exterior de apoyo de la cabeza y diámetro del taladro

Tensiones durante el apriete:

    σ = F_M / A_s,   τ = M_G / (π d_s³ / 12),   σ_red = √(σ² + 3 τ²)

Factor de apriete equivalente y regla práctica:

    K = M_A / (F_M d)        (≈ 0.20 para μ_G = μ_K = 0.15, Shigley)
    T₀.₂ = 0.2 F_M d

Precarga mínima tras la dispersión:

    F_M,min = F_M / α_A      α_A 1.6–2.0 para una llave dinamométrica normal

- μ_G, μ_K: coeficientes de rozamiento en la rosca y bajo la cabeza; R_p0.2: límite elástico o límite convencional al 0.2 %; S_p: tensión de prueba de ISO 898-1

## Hipótesis y limitaciones

- La fórmula de par de VDI usa las aproximaciones habituales 0.16 ≈ 1/(2π) y 0.58 ≈ 1/(2 cos 30°) para roscas de 60° y trata el rozamiento como rozamiento de Coulomb con un coeficiente constante.
- El rozamiento es la principal incertidumbre. Los valores predefinidos son los centrales de las clases de rozamiento de VDI 2230; el coeficiente real de un tornillo, una tuerca, un recubrimiento y un lubricante concretos puede estar en cualquier punto del rango de la clase, lo que cambia el par para una precarga dada en ±30 %.
- El diámetro de apoyo por defecto corresponde a una cabeza hexagonal ISO 4014/4017 sobre un taladro pasante medio ISO 273. Las arandelas, los tornillos con valona, los tornillos de cabeza cilíndrica Allen y las tuercas tienen otras superficies de apoyo; introduce D_Km cuando importe.
- Las resistencias son los mínimos de ISO 898-1 (la 8.8 es de 660/600 MPa por encima de M16). Los inoxidables A2-70 y A4-80 usan R_p0.2 como tensión de prueba y se especifican hasta M24.
- La precarga al 90 % del límite elástico usa el módulo plástico a torsión π d_s³/12 como en VDI 2230, y por eso reproduce las tablas VDI; una comprobación de von Mises puramente elástica daría un 8 % menos.
- El control por par produce dispersión de la precarga; la precarga mínima F_M/α_A es la que puede asegurar la unión. El apriete controlado por ángulo o por límite elástico es más preciso, pero queda fuera de esta calculadora.
- No hay análisis de la unión: las pérdidas por asentamiento, el reparto de la carga exterior (factor de carga), la longitud roscada y el arrancamiento de la rosca, la fatiga, las juntas y los efectos de la temperatura requieren el procedimiento VDI 2230 completo o uno equivalente.
- Solo roscas ISO de paso grueso.

## Ejemplo resuelto

M12 × 1.75, clase de resistencia 8.8, cincado en seco (μ_G = μ_K = 0.14), cabeza hexagonal sobre un taladro de 13.5 mm.

1. Geometría: d₂ = 12 − 0.6495 × 1.75 = 10.863 mm, d₃ = 9.853 mm, d_s = 10.358 mm, A_s = 84.3 mm².
2. Resistencia: R_p0.2 = 640 MPa, S_p = 580 MPa → carga de prueba 580 × 84.3 = 48.9 kN.
3. Precarga al 90 % del límite elástico: el término entre corchetes es 1.5 × (10.863/10.358) × (1.75/(π × 10.863) + 1.155 × 0.14) = 0.335; √(1 + 3 × 0.335²) = 1.156; F_M = 84.3 × 576 / 1.156 = 42.0 kN. La tabla A1 de VDI 2230 da 41.9 kN.
4. Par: D_Km = (16.63 + 13.5)/2 = 15.07 mm. M_G = 42.0 × (0.16 × 1.75 + 0.58 × 10.863 × 0.14) = 42.0 × 1.162 = 48.8 N·m; M_K = 42.0 × 0.14 × 15.07/2 = 44.3 N·m; M_A = 93 N·m, el valor de la tabla VDI.
5. Factor de apriete: K = 93 / (42.0 × 12) = 0.185. La regla de 0.2 daría 101 N·m, un 8 % de más.
6. Dispersión: con α_A = 1.7 la precarga mínima es 42.0 / 1.7 = 24.7 kN.

Con pasta de MoS₂ (μ = 0.08) el mismo tornillo alcanza 44.9 kN de precarga con solo 61 N·m. Aplicar el par en seco a un tornillo lubricado lo sobrecargaría: por eso la condición de rozamiento debe coincidir con la de la tabla de pares.

## Preguntas frecuentes

**¿Por qué no usar simplemente T = 0.2 F d?**
Porque K varía desde unos 0.10 (bien lubricado) hasta 0.30 (en seco, rugoso). Para un par dado la precarga puede variar en un factor de tres. K = 0.2 coincide con μ ≈ 0.15.

**¿La precarga debe ser el 90 % del límite elástico? Parece mucho.**
Durante el apriete, sí: VDI 2230 y la mayoría de las tablas europeas usan el 90 % del límite elástico incluida la torsión. La tensión de torsión se relaja en gran parte tras el apriete y deja una tensión de tracción segura. La práctica estadounidense indica el 75 % de la carga de prueba para uniones reutilizables y el 90 % para las permanentes; ambas opciones están disponibles.

**¿Qué diferencia hay entre el límite elástico y la carga de prueba?**
La tensión de prueba S_p (ISO 898-1) es aproximadamente el 90 % del límite elástico mínimo; un tornillo cargado hasta su carga de prueba no debe mostrar deformación permanente. Las precargas se fijan normalmente respecto a la carga de prueba o al límite elástico, nunca respecto a la resistencia a tracción.

**¿Necesito una arandela?**
Una arandela templada aumenta D_Km (más par bajo la cabeza) y protege la superficie. Introduce el diámetro exterior de la arandela y el diámetro del taladro con la opción de diámetro de apoyo «dado».

**¿Qué precisión tiene el apriete por par?**
De ±17 % a ±43 % en la precarga con llave dinamométrica, según lo bien que se conozca el rozamiento (α_A de VDI 1.4–2.0); las llaves de impacto son mucho peores. Si la unión es crítica, usa control por ángulo o medición ultrasónica del alargamiento.

**¿Puedo usar el resultado para roscas finas o tornillos UNC/UNF?**
No directamente. Las roscas finas tienen mayor sección resistente y menor paso; las roscas en pulgadas tienen otra geometría y grados SAE. La estructura de las fórmulas es la misma si calculas d₂, d₃ y A_s para esa rosca.

**¿El tornillo se afloja si lo lubrico?**
La lubricación reduce el par necesario para una precarga dada; no reduce la fuerza de apriete. El aflojamiento depende de la precarga, la rigidez de la unión y el movimiento transversal, no de la lubricación en sí.

## Calculadoras relacionadas

- [Par, potencia y diámetro de ejes](../shaft-torque/index.html): capacidad de par del eje al que sirven los tornillos del acoplamiento.
- [Flecha y tensión de flexión en vigas](../beam-deflection/index.html): flexión de la brida o la escuadra atornillada.
- [Recipiente a presión de pared delgada](../pressure-vessel/index.html): cargas en bridas por la presión interior.
- [Conversor de unidades de ingeniería](../unit-converter/index.html): de N·m a lbf·ft, de kN a lbf.
