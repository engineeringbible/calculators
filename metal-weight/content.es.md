# Calculadora de peso del acero y otros metales

**Resumen:** Peso de chapas, barras, tubos, angulares, vigas y perfiles U de acero, inoxidable, aluminio, cobre o latón, por metro o pie, por pieza y en total.

## Introducción

El peso de una barra, una chapa o un tubo de acero es el área de su sección transversal por su longitud por la densidad del metal. El acero pesa 7 850 kg por metro cúbico, así que una barra redonda de 20 mm pesa 2.47 kg por metro, y una chapa de 10 mm, 78.5 kg por metro cuadrado. Estas cifras importan para el pedido, el transporte, el izado y la carga permanente de una estructura.

Esta calculadora da la sección, el peso por metro y por pie, el peso por pieza y el peso total de las formas habituales: chapa, barra redonda, cuadrada, hexagonal y pletina, tubo redondo y rectangular, angular, viga I y perfil U. Cubre el acero al carbono y el inoxidable, el aluminio, el cobre, el latón, el bronce, la fundición, el titanio y el plomo, o cualquier densidad que introduzcas.

## Fórmulas

Peso de n piezas de longitud L:

    m = ρ × A × L × n

Áreas de la sección transversal:

    plate, flat bar:   A = w t
    round bar:         A = π d² / 4
    hex bar:           A = (√3 / 2) s²          s across flats
    round tube:        A = π t (D − t)
    rectangular tube:  A = b h − (b − 2t)(h − 2t)
    angle:             A = t (a + b − t)
    I-beam, channel:   A = 2 b t_f + (h − 2 t_f) t_w

- ρ: densidad; acero al carbono 7 850, inoxidable 304 7 900, aluminio 2 700, cobre 8 940 kg/m³
- D, t: diámetro exterior y espesor de pared de un tubo; b, h: ancho y altura
- plate, flat bar: chapa, pletina (w: ancho); round bar: barra redonda (d: diámetro); hex bar: barra hexagonal (s: distancia entre caras); round tube: tubo redondo; rectangular tube: tubo rectangular; angle: angular (a, b: lados); I-beam, channel: viga I, perfil U (t_f: espesor del ala; t_w: espesor del alma)

## Hipótesis y limitaciones

- Los pesos son teóricos, para formas con esquinas vivas. Los angulares, las vigas y los perfiles U laminados en caliente tienen radios de acuerdo, y los tubos tienen esquinas redondeadas, así que los pesos de catálogo difieren en un pequeño porcentaje. Usa el peso de catálogo para perfiles normalizados cuando importe.
- Las tolerancias de laminación en el espesor permiten que el peso real varíe hasta un 5 % aproximadamente.
- Introduce el diámetro exterior real de un tubo, no su tamaño nominal: un tubo de 2 in tiene 60.3 mm (2.375 in) de diámetro exterior.
- Las densidades de las aleaciones varían en un uno o dos por ciento. Introduce una densidad medida o de catálogo para trabajos exactos.

## Ejemplo resuelto

¿Cuánto pesa un tramo de 6 m de barra redonda de acero de 20 mm de diámetro?

1. Área: π × 20² / 4 = 314.2 mm² = 0.0003142 m².
2. Peso por metro: 7 850 × 0.0003142 = 2.466 kg/m, o 1.657 lb/ft.
3. Peso de la barra: 2.466 × 6 = 14.80 kg.

Un paquete de 20 barras como esta pesa 296 kg.

## Preguntas frecuentes

**¿Cómo calculo el peso del acero?**
Multiplica el volumen en metros cúbicos por 7 850 kg/m³. En una barra, el volumen es el área de la sección por la longitud.

**¿Cuánto pesa una chapa de acero por metro cuadrado?**
7.85 kg por milímetro de espesor: 78.5 kg/m² para 10 mm y 157 kg/m² para 20 mm. En unidades de EE. UU., 40.8 lb/ft² por pulgada de espesor.

**¿El acero inoxidable pesa más que el acero al carbono?**
Algo más: el 304 tiene unos 7 900 kg/m³ y el 316 unos 8 000 kg/m³, frente a 7 850 del acero al carbono.

**¿Cuánto más ligero es el aluminio?**
Pesa alrededor de un tercio que el acero para la misma forma: 2 700 frente a 7 850 kg/m³.

**¿Cuánto pesa por metro un tubo de acero?**
Usa el diámetro exterior y el espesor de pared: 60.3 × 3.9 mm (2 in Schedule 40) pesa 5.43 kg/m.

**¿Por qué el peso de mi proveedor es distinto?**
Los pesos de catálogo incluyen los radios de acuerdo y de las esquinas, y a veces los proveedores dan el peso máximo dentro de la tolerancia. Las diferencias del 2 al 5 % son normales.

## Calculadoras relacionadas

- [Peso y cantidad de varillas de acero corrugado](../rebar-weight/index.html): barras de armadura por tamaño.
- [Momento de inercia (propiedades de la sección)](../moment-of-inertia/index.html): rigidez de las mismas formas.
- [Volumen de hormigón y peso de armadura](../concrete-volume/index.html): el hormigón con su armadura.
- [Eslingas de izado](../lifting-sling/index.html): aparejos para el peso.
