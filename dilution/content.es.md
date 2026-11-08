# Calculadora de dilución (C1V1 = C2V2 y dilución seriada)

**Resumen:** Resuelve C1V1 = C2V2 para cualquier término, con el factor de dilución, el volumen de diluyente y la proporción, más los pasos de una dilución seriada.

## Introducción

Cuando diluyes una disolución, la cantidad de soluto no cambia y solo aumenta el volumen. De ahí sale la fórmula de dilución C1V1 = C2V2: la concentración de la disolución madre por su volumen es igual a la concentración final por el volumen final. Para preparar 500 mL de ácido clorhídrico 1 M a partir de una disolución madre 12 M, toma 1 × 500 / 12 = 41.67 mL de disolución madre y enrasa (afora) a 500 mL. El factor de dilución es C1 / C2, aquí 12.

Esta calculadora resuelve C1V1 = C2V2 para cualquiera de los cuatro términos. Da el factor de dilución, el volumen de diluyente a añadir y la proporción entre disolución madre y diluyente. También planifica una dilución seriada de pasos iguales, con el factor total y la concentración después de cada paso. Está pensada para personal de laboratorio, microbiólogos, estudiantes y operadores de procesos que preparan disoluciones de trabajo y patrones.

## Fórmulas

Fórmula de dilución y sus despejes:

    C1 V1 = C2 V2
    V1 = C2 V2 / C1,   C2 = C1 V1 / V2

Factor de dilución, diluyente y proporción:

    DF = C1 / C2 = V2 / V1
    diluent = V2 − V1
    ratio = 1 : (DF − 1)    stock : diluent

Dilución seriada de n pasos iguales de factor f:

    DF_total = f^n
    C_k = C1 / f^k
    diluent per tube = (f − 1) × v_transfer

- C1, V1: concentración y volumen de la disolución madre
- C2, V2: concentración y volumen final de la disolución diluida
- f: factor por paso; n: número de pasos; v_transfer: volumen que se pasa de un tubo al siguiente

## Hipótesis y limitaciones

- C1 y C2 deben estar en la misma unidad: sirven mol/L, mg/L, % p/v, ppm o células/mL.
- V2 es el volumen final después de enrasar. Añadir V2 − V1 de diluyente da el mismo resultado solo cuando los volúmenes se suman, lo que se cumple aproximadamente en disoluciones acuosas diluidas.
- Los ácidos concentrados, los alcoholes y otras mezclas que se contraen o se dilatan al mezclarse deben enrasarse hasta la marca en un matraz aforado.
- Las concentraciones en masa, como el % p/p, se diluyen por masa. Para ellas usa masas en lugar de volúmenes.
- Las diluciones grandes en un solo paso necesitan volúmenes de disolución madre diminutos, difíciles de medir. Más allá de 1 : 1 000 aproximadamente, una dilución seriada es más precisa.

## Ejemplo resuelto

Un técnico necesita 500 mL de ácido clorhídrico 1 M y tiene una disolución madre 12 M.

1. Volumen de disolución madre: V1 = 1 × 500 / 12 = 41.67 mL.
2. Diluyente: 500 − 41.67 = 458.3 mL de agua.
3. Factor de dilución: 12 / 1 = 12.0, una proporción de 1 : 11.

Pon unos 400 mL de agua en el matraz, añade el ácido despacio y enrasa a 500 mL cuando se haya enfriado.

## Preguntas frecuentes

**¿Cómo se usa C1V1 = C2V2?**
Introduce los tres valores que conoces y despeja el cuarto. Para diluir 10 mL de una disolución madre 0.5 M hasta 250 mL, C2 = 0.5 × 10 / 250 = 0.02 M.

**¿Qué es el factor de dilución?**
La relación entre la concentración de la disolución madre y la concentración final, o entre el volumen final y el volumen de disolución madre. Una muestra de 1 mL enrasada a 100 mL tiene un factor de dilución de 100.

**¿Qué diferencia hay entre 1 : 10 y 1 en 10?**
«1 en 10» suele significar 1 parte en un total de 10 partes, un factor de 10. «1 : 10» suele significar 1 parte de disolución madre por 10 partes de diluyente, un factor de 11. Indica cuál quieres decir.

**¿Cómo hago una dilución seriada?**
Transfiere un volumen fijo a un tubo que contenga (f − 1) veces ese volumen de diluyente, mezcla y repite. Seis pasos 1 : 10 con transferencias de 1 mL y 9 mL de diluyente dan un factor de un millón.

**¿Por qué usar una dilución seriada en lugar de una sola dilución grande?**
Preparar 100 mL de una dilución de un millón de veces en un solo paso necesita 0.1 µL de disolución madre, que no se puede medir con precisión. Varios pasos moderados mantienen todos los volúmenes medibles y precisos.

**¿Sirve C1V1 = C2V2 para concentraciones en masa?**
Para % p/p o mg/kg usa masas en lugar de volúmenes. Con volúmenes solo es exacta cuando la densidad no cambia al diluir.

## Calculadoras relacionadas

- [Molaridad](../molarity/index.html): preparar la disolución madre a partir de un sólido.
- [Conversor de concentración en ppm](../ppm-concentration/index.html): cambiar la unidad de concentración.
- [Balance de masa en mezclas](../mass-balance/index.html): dilución por masa con caudales y temperaturas.
- [Dosificación de productos químicos](../chemical-dosing/index.html): inyectar un producto diluido en un caudal.
