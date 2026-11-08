# Calculadora de molaridad (moles, masa, volumen, normalidad)

**Resumen:** Molaridad, masa de soluto o volumen de disolución a partir de los otros dos, con masas molares de reactivos comunes, moles, normalidad, molalidad y % p/p.

## Introducción

La molaridad es el número de moles de un soluto por litro de disolución, y se escribe mol/L o M. Se calcula dividiendo la masa de soluto entre su masa molar, lo que da los moles, y después entre el volumen de disolución en litros. Disolver 58.44 g de cloruro de sodio y enrasar (aforar) a 1 L da una disolución 1 M. A la inversa, la misma relación te dice cuánto pesar: 250 mL de NaCl 0.5 M necesitan 7.305 g.

Esta calculadora halla la masa de soluto, la molaridad o el volumen de disolución a partir de los otros dos. Incluye las masas molares de 22 reactivos comunes, o puedes introducir la tuya. También da los moles, la normalidad de ácidos y bases, y la molalidad y el % p/p cuando conoces la densidad de la disolución. Está pensada para técnicos de laboratorio, estudiantes de química e ingenieros de procesos que preparan disoluciones.

## Fórmulas

Molaridad, moles y masa:

    n = m / M
    c = n / V
    m = c × V × M

Normalidad, molalidad y fracción másica:

    N = c × z
    b = n / (ρ V − m)
    w = m / (ρ V)

- c: molaridad, mol/L; n: moles de soluto; V: volumen de disolución, L
- m: masa de soluto, g; M: masa molar, g/mol
- z: equivalentes por mol: 1 para HCl y NaOH, 2 para H₂SO₄, 3 para H₃PO₄
- b: molalidad, mol por kg de disolvente; ρ: densidad de la disolución; w: fracción másica

## Hipótesis y limitaciones

- El volumen es el volumen final de la disolución. Disuelve el soluto en menos disolvente y luego enrasa hasta la marca.
- Los hidratos incluyen su agua de cristalización. El CuSO₄·5H₂O pesa 249.68 g/mol, frente a 159.60 g/mol de la sal anhidra.
- La normalidad depende de la reacción. La tabla cubre el uso ácido-base; para redox, introduce los electrones por mol, como 5 para el permanganato en medio ácido.
- La molalidad y el % p/p necesitan la densidad medida de la disolución a su temperatura.
- El reactivo se toma como puro. Para una riqueza del 98 %, divide la masa entre 0.98.

## Ejemplo resuelto

¿Cuánto cloruro de sodio hace falta para 250 mL de una disolución 0.5 M?

1. Volumen: 250 mL = 0.250 L.
2. Moles: 0.5 mol/L × 0.250 L = 0.125 mol.
3. Masa molar del NaCl: 22.990 + 35.45 = 58.44 g/mol.
4. Masa: 0.125 × 58.44 = 7.305 g.

Pesa 7.305 g de NaCl, disuélvelos en unos 200 mL de agua y enrasa a 250 mL en un matraz aforado.

## Preguntas frecuentes

**¿Cómo se calcula la molaridad?**
Divide los moles de soluto entre los litros de disolución. 10 g de glucosa (180.16 g/mol) en 500 mL son 0.0555 mol / 0.5 L = 0.111 M.

**¿Qué diferencia hay entre molaridad y molalidad?**
La molaridad son moles por litro de disolución; la molalidad son moles por kilogramo de disolvente. La molalidad no cambia con la temperatura, porque solo usa masas.

**¿Qué es la normalidad?**
La molaridad multiplicada por los equivalentes por mol de la reacción. El ácido sulfúrico 0.5 M cede dos protones por molécula, así que es 1.0 N.

**¿Cómo hallo la molaridad de un ácido concentrado?**
Multiplica la densidad por la fracción másica para obtener g/L y divide entre la masa molar. El HCl del 37 % con densidad 1.18 g/mL contiene 437 g/L, que son 12.0 M.

**¿Cómo preparo una disolución a partir de una disolución madre concentrada?**
Usa C1V1 = C2V2. Para preparar 1 L de HCl 1 M a partir de una disolución madre 12 M, toma 83 mL de la disolución madre y enrasa a 1 L, añadiendo siempre el ácido al agua.

**¿Por qué mi disolución no sale con la concentración correcta?**
Las causas habituales son una sal húmeda o hidratada, un reactivo impuro, enrasar a un volumen equivocado o una temperatura muy alejada de la de calibración del matraz.

## Calculadoras relacionadas

- [Dilución C1V1 = C2V2](../dilution/index.html): preparar disoluciones de trabajo a partir de una disolución madre.
- [Conversor de concentración en ppm](../ppm-concentration/index.html): de mol/L a mg/L, ppm y % p/p.
- [Calculadora de densidad](../density/index.html): masa y volumen de la disolución.
- [Dosificación de productos químicos](../chemical-dosing/index.html): inyectar una disolución en un caudal.
