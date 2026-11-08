# Calculadora de conversión de dureza (HRC, HRB, HV, HB)

**Resumen:** Conversión aproximada de la dureza del acero entre Rockwell C, Rockwell B, Vickers y Brinell, con la resistencia a tracción, según ASTM E140 e ISO 18265.

## Introducción

Cada ensayo de dureza presiona un penetrador distinto contra el metal con una carga distinta, así que las escalas no tienen una relación exacta. Para el acero, unas tablas normalizadas elaboradas a partir de muchos ensayos por pares dan los valores equivalentes. Un acero de 45 HRC da unos 446 HV y 421 HBW, y su resistencia a tracción es de aproximadamente 1 440 MPa.

Esta calculadora convierte una lectura en Rockwell C, Rockwell B, Vickers o Brinell a las demás escalas y estima la resistencia a tracción. También puede trabajar al revés, a partir de una resistencia a tracción. Interpola en las tablas publicadas y rechaza los valores que quedan fuera de ellas. Está pensada para inspectores, técnicos de tratamientos térmicos y proyectistas que comparan un ensayo de dureza con un plano o con un certificado de material.

## Fórmulas

De dureza a dureza, por interpolación lineal entre dos filas de ASTM E140:

    y = y₁ + (x − x₁) (y₂ − y₁) / (x₂ − x₁)

- x: la lectura que tienes; x₁, x₂: las filas de la tabla a cada lado
- y₁, y₂: los valores de la otra escala en esas filas

Tablas usadas:

| Rango | Tabla | Columnas |
|---|---|---|
| HRC 20 a 68 | ASTM E140 tabla 1 | HRC, HV, HBW (bola de carburo, 3 000 kgf) |
| HRB 55 a 100 | ASTM E140 tabla 2 | HRB, HV, HB (igual a HV en este rango) |
| HV 80 a 650 | ISO 18265 tabla A.1 | HV, resistencia a tracción Rm 255 a 2 180 MPa |

El valor Vickers une las tablas: cada lectura se convierte primero a HV y después a las demás escalas y a la resistencia a tracción.

## Hipótesis y limitaciones

- Las tablas valen para aceros al carbono y de baja aleación no austeníticos. El acero inoxidable austenítico, el acero deformado en frío, la fundición y las aleaciones de aluminio y de cobre necesitan sus propias tablas.
- Rockwell C termina en 20 HRC y Rockwell B en 100 HRB. Por debajo de 20 HRC usa Rockwell B; por encima de 100 HRB usa Rockwell C.
- Donde la tabla 1 se une con la tabla 2, en torno a 98 a 100 HRB, las dos tablas difieren hasta 10 HV. Las conversiones en esa franja son menos seguras.
- La resistencia a tracción es solo una estimación. ISO 18265 la considera el menos fiable de los valores convertidos.
- Un valor convertido nunca sustituye a un ensayo en la escala que pide una especificación. La propia ASTM E140 indica que solo se convierta cuando no sea posible ensayar en esa escala.

## Ejemplo resuelto

Un eje de acero aleado con tratamiento térmico da 45 HRC en el ensayo. ¿Cuáles son su dureza Vickers y Brinell y su resistencia a tracción aproximada?

1. ASTM E140 tabla 1, fila 45 HRC: 446 HV y 421 HBW.
2. ISO 18265 tabla A.1: 440 HV son 1 420 MPa y 450 HV son 1 455 MPa.
3. Interpola en 446 HV: 1 420 + 0.6 × 35 = 1 441 MPa.

Así que el eje tiene unos 446 HV, 421 HBW y 1 441 MPa. La antigua columna de resistencia a tracción SAE impresa en las tablas basadas en E140 da 1 480 MPa para 45 HRC, a menos de un 3 % de esta estimación.

Una chapa más blanda de 85 HRB se convierte igual mediante la tabla 2: 165 HV, 165 HB y unos 530 MPa.

## Preguntas frecuentes

**¿Puedo convertir HRC a HRB?**
Solo cerca del extremo superior de la escala B. 20 HRC son unos 99.7 HRB, y la escala B termina en 100 HRB, así que los aceros más duros no tienen valor HRB.

**¿Cómo convierto Brinell a Rockwell C?**
Busca el valor Brinell en la tabla 1 de E140 y lee el HRC en la misma fila. Por ejemplo, 400 HBW son 43 HRC.

**¿Qué precisión tienen las conversiones de dureza?**
Son aproximadas. ASTM E140 advierte de que los valores convertidos pueden ser inexactos para un material concreto, e ISO 18265 considera la estimación de resistencia a tracción la menos fiable.

**¿Por qué no hay resistencia a tracción por encima de 650 HV?**
La tabla A.1 de ISO 18265 termina en 650 HV y 2 180 MPa. Los aceros más duros son frágiles, y su resistencia a tracción depende más de los defectos que de la dureza.

**¿Sirve para el acero inoxidable?**
No para los grados austeníticos como el 304 y el 316. ASTM E140 da al acero inoxidable austenítico una tabla propia.

**¿Qué diferencia hay entre HB y HBW?**
HBW significa que el ensayo usó una bola de carburo de wolframio. Los ensayos antiguos con bola de acero se indicaban como HBS; las normas actuales solo admiten la bola de carburo.

## Calculadoras relacionadas

- [Propiedades de materiales](../material-properties/index.html): resistencia y rigidez de los materiales de ingeniería habituales.
- [Tensión y deformación](../stress-strain/index.html): la tensión que soporta una pieza bajo carga.
- [Coeficiente de seguridad a fatiga](../fatigue-goodman/index.html): límite de fatiga a partir de la resistencia a tracción.
- [Par de apriete y precarga de tornillos](../bolt-torque/index.html): clases de resistencia de los tornillos y sus rangos de dureza.
