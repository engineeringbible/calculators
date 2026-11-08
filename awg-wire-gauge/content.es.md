# Calculadora de calibre AWG a mm² y tabla AWG

**Resumen:** Diámetro, mm², circular mils, resistencia y peso de cada calibre AWG de 4/0 a 40, o el calibre de un cable medido, con su sección métrica equivalente.

## Introducción

El American Wire Gauge (AWG) es el sistema de calibres de cable que se usa en Norteamérica. Los números van al revés: cuanto mayor es el calibre, más fino es el cable. El 12 AWG, el calibre habitual para un circuito doméstico de 20 A, mide 2.05 mm de diámetro y tiene una sección de 3.31 mm². Cada seis calibres el diámetro se reduce a la mitad, y cada tres calibres se reduce a la mitad la sección.

Esta calculadora da el diámetro, la sección en mm² y en circular mils, la resistencia y el peso de cualquier calibre de 4/0 a 40, en cobre o aluminio, macizo o cableado, a cualquier temperatura. También funciona al revés, de un diámetro medido o una sección métrica al calibre, y muestra la sección métrica IEC que se puede usar en su lugar. La tabla completa está en la sección siguiente.

## Fórmulas

ASTM B258 define cada calibre a partir de dos puntos fijos, 0000 con 0.4600 in y 36 con 0.0050 in, con 39 pasos de razón constante entre ellos:

    d = 0.005 in × 92^((36 − n) / 39)
    A = π × d² / 4
    area in circular mils = (d in mils)²

Resistencia y peso por unidad de longitud:

    R' = ρ20 × (1 + α (T − 20)) / A × k_s
    m' = ρ_m × A × k_s

- n: número de calibre; 0 (1/0) es 0, 00 (2/0) es −1, 000 (3/0) es −2 y 0000 (4/0) es −3
- ρ20: resistividad a 20 °C: cobre 1.7241 × 10⁻⁸ Ω·m, aluminio 2.8264 × 10⁻⁸ Ω·m
- α: coeficiente de temperatura: cobre 0.00393 /K, aluminio 0.00403 /K
- k_s: 1.02 para conductores cableados concéntricos (ASTM B8), 1 para hilo macizo
- ρ_m: densidad: cobre 8 890 kg/m³, aluminio 2 705 kg/m³

### Tabla AWG

Cobre macizo a 20 °C, según las fórmulas anteriores. Para cable cableado, suma un 2 % a la resistencia; para aluminio, multiplica la resistencia del cobre por 1.64. La última columna es la menor sección métrica IEC con al menos la misma sección.

| AWG | Diámetro (in) | Diámetro (mm) | Sección (mm²) | Sección (kcmil) | Cobre Ω/km | Cobre Ω/1000 ft | Siguiente sección IEC |
|---|---|---|---|---|---|---|---|
| 4/0 | 0.4600 | 11.684 | 107.2 | 211.6 | 0.161 | 0.0490 | 120 mm² |
| 3/0 | 0.4096 | 10.405 | 85.03 | 167.8 | 0.203 | 0.0618 | 95 mm² |
| 2/0 | 0.3648 | 9.266 | 67.43 | 133.1 | 0.256 | 0.0779 | 70 mm² |
| 1/0 | 0.3249 | 8.251 | 53.48 | 105.5 | 0.322 | 0.0983 | 70 mm² |
| 1 | 0.2893 | 7.348 | 42.41 | 83.69 | 0.407 | 0.124 | 50 mm² |
| 2 | 0.2576 | 6.544 | 33.63 | 66.37 | 0.513 | 0.156 | 35 mm² |
| 3 | 0.2294 | 5.827 | 26.67 | 52.63 | 0.646 | 0.197 | 35 mm² |
| 4 | 0.2043 | 5.189 | 21.15 | 41.74 | 0.815 | 0.248 | 25 mm² |
| 5 | 0.1819 | 4.621 | 16.77 | 33.10 | 1.028 | 0.313 | 25 mm² |
| 6 | 0.1620 | 4.115 | 13.30 | 26.25 | 1.296 | 0.395 | 16 mm² |
| 7 | 0.1443 | 3.665 | 10.55 | 20.82 | 1.634 | 0.498 | 16 mm² |
| 8 | 0.1285 | 3.264 | 8.366 | 16.51 | 2.061 | 0.628 | 10 mm² |
| 9 | 0.1144 | 2.906 | 6.634 | 13.09 | 2.599 | 0.792 | 10 mm² |
| 10 | 0.1019 | 2.588 | 5.261 | 10.38 | 3.277 | 0.999 | 6 mm² |
| 11 | 0.0907 | 2.305 | 4.172 | 8.234 | 4.132 | 1.260 | 6 mm² |
| 12 | 0.0808 | 2.053 | 3.309 | 6.530 | 5.211 | 1.588 | 4 mm² |
| 13 | 0.0720 | 1.828 | 2.624 | 5.178 | 6.571 | 2.003 | 4 mm² |
| 14 | 0.0641 | 1.628 | 2.081 | 4.107 | 8.285 | 2.525 | 2.5 mm² |
| 15 | 0.0571 | 1.450 | 1.650 | 3.257 | 10.45 | 3.184 | 2.5 mm² |
| 16 | 0.0508 | 1.291 | 1.309 | 2.583 | 13.17 | 4.015 | 1.5 mm² |
| 17 | 0.0453 | 1.150 | 1.038 | 2.048 | 16.61 | 5.063 | 1.5 mm² |
| 18 | 0.0403 | 1.024 | 0.823 | 1.624 | 20.95 | 6.385 | 1 mm² |
| 19 | 0.0359 | 0.912 | 0.653 | 1.288 | 26.41 | 8.051 | 0.75 mm² |
| 20 | 0.0320 | 0.812 | 0.518 | 1.022 | 33.31 | 10.15 | 0.75 mm² |
| 21 | 0.0285 | 0.723 | 0.410 | 0.810 | 42.00 | 12.80 | — |
| 22 | 0.0253 | 0.644 | 0.326 | 0.642 | 52.96 | 16.14 | — |
| 23 | 0.0226 | 0.573 | 0.258 | 0.509 | 66.78 | 20.36 | — |
| 24 | 0.0201 | 0.511 | 0.205 | 0.404 | 84.21 | 25.67 | — |
| 25 | 0.0179 | 0.455 | 0.162 | 0.320 | 106.2 | 32.37 | — |
| 26 | 0.0159 | 0.405 | 0.129 | 0.254 | 133.9 | 40.81 | — |
| 27 | 0.0142 | 0.361 | 0.102 | 0.202 | 168.9 | 51.47 | — |
| 28 | 0.0126 | 0.321 | 0.0810 | 0.160 | 212.9 | 64.90 | — |
| 29 | 0.0113 | 0.286 | 0.0642 | 0.127 | 268.5 | 81.83 | — |
| 30 | 0.0100 | 0.255 | 0.0509 | 0.101 | 338.5 | 103.2 | — |
| 31 | 0.0089 | 0.227 | 0.0404 | 0.0797 | 426.9 | 130.1 | — |
| 32 | 0.0080 | 0.202 | 0.0320 | 0.0632 | 538.3 | 164.1 | — |
| 33 | 0.0071 | 0.180 | 0.0254 | 0.0501 | 678.8 | 206.9 | — |
| 34 | 0.0063 | 0.160 | 0.0201 | 0.0398 | 856.0 | 260.9 | — |
| 35 | 0.0056 | 0.143 | 0.0160 | 0.0315 | 1079 | 329.0 | — |
| 36 | 0.0050 | 0.127 | 0.0127 | 0.0250 | 1361 | 414.8 | — |
| 37 | 0.0045 | 0.113 | 0.0100 | 0.0198 | 1716 | 523.1 | — |
| 38 | 0.0040 | 0.101 | 0.00797 | 0.0157 | 2164 | 659.6 | — |
| 39 | 0.0035 | 0.090 | 0.00632 | 0.0125 | 2729 | 831.8 | — |
| 40 | 0.0031 | 0.080 | 0.00501 | 0.00989 | 3441 | 1049 | — |

## Hipótesis y limitaciones

- Los diámetros son los de hilo redondo macizo. Un conductor cableado del mismo calibre tiene la misma sección de metal pero un diámetro exterior mayor, así que identifica el cable cableado por su número de hilos y el calibre de cada hilo, no por su diámetro exterior.
- La resistencia es el valor en CC a partir de ρ/A. El cobre estañado, el hilo recubierto y las tolerancias reales de fabricación dan valores unos pocos por ciento mayores.
- La sección métrica es la menor sección IEC 60228 al menos igual en área. Los conductores IEC se especifican por resistencia máxima, así que un conductor de 4 mm² puede llevar algo menos de cobre que 4.00 mm².
- Esta página no da la corriente admisible. La intensidad admisible depende de la temperatura nominal del aislamiento, de la instalación, del agrupamiento y de la temperatura ambiente, y la fija el reglamento de instalaciones: NEC Table 310.16 en EE. UU., IEC 60364-5-52 en otros lugares. Para la caída de tensión usa la calculadora de calibre de cable.

## Ejemplo resuelto

¿Qué dimensiones y qué resistencia tiene un cable de cobre macizo de 12 AWG a 20 °C, y qué cable métrico lo sustituye?

1. Número de calibre n = 12, así que d = 0.005 × 92^(24 / 39) = 0.0808 in = 2.053 mm.
2. Sección: A = π × 2.053² / 4 = 3.309 mm², o 80.8² = 6 530 circular mils.
3. Resistencia a 20 °C: R' = 1.7241 × 10⁻⁸ / 3.309 × 10⁻⁶ = 5.211 × 10⁻³ Ω/m = 5.211 Ω/km, que son 1.588 Ω/1000 ft.
4. Peso: 8 890 × 3.309 × 10⁻⁶ = 0.0294 kg/m, o 19.8 lb por 1 000 ft.
5. La menor sección IEC 60228 con al menos 3.309 mm² es 4 mm².

Así que el 12 AWG de cobre mide 2.05 mm de grosor con 3.31 mm² de cobre, y 4 mm² es su sustituto métrico; 2.5 mm² tendría un 24 % menos de cobre.

## Preguntas frecuentes

**¿Qué significa el número AWG?**
Cuenta los pasos de trefilado del proceso original de fabricación del hilo; por eso los números mayores corresponden a cables más finos. Hoy los calibres los fija la fórmula de ASTM B258.

**¿Cuántos mm² tiene el 12 AWG? ¿Y el 14 AWG?**
El 12 AWG tiene 3.31 mm² y el 14 AWG, 2.08 mm². Las secciones métricas más cercanas al menos iguales son 4 mm² y 2.5 mm².

**¿Qué es un cable 1/0 o 4/0?**
Los calibres mayores que 1 AWG son 1/0, 2/0, 3/0 y 4/0, que en inglés se leen one-aught a four-aught. El 4/0 mide 0.46 in de diámetro y tiene 107 mm². Por encima de 4/0, las secciones se dan en kcmil, empezando por 250 kcmil.

**¿Qué es un kcmil o MCM?**
Un circular mil es el área de un círculo de un mil, una milésima de pulgada, de diámetro. Un kcmil, también escrito MCM, son 1 000 circular mils, unos 0.5067 mm².

**¿Cómo mido el calibre de un cable?**
Pela el aislamiento y mide el diámetro desnudo con un micrómetro; luego introdúcelo en el modo de diámetro. En un cable cableado, mide un hilo, busca su calibre y multiplica su sección por el número de hilos.

**¿Cuánta corriente puede llevar un 12 AWG?**
Lo fija el reglamento de instalaciones, según el aislamiento y la instalación. En viviendas de EE. UU., NEC 240.4(D) limita la protección contra sobrecorriente del 12 AWG de cobre a 20 A y la del 14 AWG a 15 A.

**¿El cable de aluminio tiene el mismo calibre que el de cobre para la misma corriente?**
No. El aluminio tiene alrededor de un 64 % más de resistencia, así que suele ser dos calibres mayor para la misma corriente y la misma caída de tensión.

## Calculadoras relacionadas

- [Calibre de cable por caída de tensión](../wire-size/index.html): el menor calibre AWG y la menor sección métrica para un circuito.
- [Sección de cable y caída de tensión](../cable-sizing/index.html): selección de cables IEC con reactancia y factor de potencia.
- [Ley de Ohm](../ohms-law/index.html): tensión, corriente, resistencia y potencia.
- [Conversor de unidades](../unit-converter/index.html): kcmil, mm², pulgadas y más.
