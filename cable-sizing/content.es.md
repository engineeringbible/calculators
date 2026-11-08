# Calculadora de sección de cable y caída de tensión

**Resumen:** Caída de tensión, pérdida de potencia y sección IEC mínima del conductor en CC, monofásica y trifásica según corriente, longitud, material y caída admisible.

## Introducción

Dos cosas determinan la sección de un cable: debe transportar la corriente sin sobrecalentarse (intensidad admisible), y la tensión (voltaje) en el extremo lejano debe mantenerse dentro de los límites (caída de tensión). La intensidad admisible depende de cómo se instala el cable y sale de tablas; la caída de tensión es un cálculo, y en tendidos largos o en sistemas de CC de baja tensión suele ser el factor decisivo. Esta calculadora calcula la caída para una sección de conductor IEC 60228 dada a su temperatura de servicio, incluidos la reactancia del cable y el factor de potencia en CA, indica la potencia perdida en el cable y encuentra la menor sección normalizada que cumple el porcentaje admisible que elijas.

Está pensada para ingenieros eléctricos navales que trazan circuitos de buques a 440 V y 230 V y alimentaciones de control de 24 V CC, para ingenieros de instalaciones de edificios y para estudiantes que aprenden el método de caída de tensión de IEC 60364.

## Fórmulas

Resistencia del conductor por unidad de longitud:

    R'₂₀ = IEC 60228 Table 2 value for the size (Ω/km), or ρ₂₀ / A for a non-standard size
    R'_T = R'₂₀ [1 + α (T − 20)]

- ρ₂₀: resistividad a 20 °C: cobre 1.7241 × 10⁻⁸ Ω·m, aluminio 2.8264 × 10⁻⁸ Ω·m
- α: coeficiente de temperatura: cobre 0.00393/K, aluminio 0.00403/K
- T: temperatura del conductor, °C (70 para PVC, 90 para XLPE a plena carga)

Caída de tensión (L, longitud de ida del recorrido):

    R = R'_T L / 1000,   X = X' L / 1000            [Ω]
    DC:            ΔU = 2 I R
    Single-phase:  ΔU = 2 I (R cos φ + X sin φ)
    Three-phase:   ΔU = √3 I (R cos φ + X sin φ)     (line-to-line)
    ΔU% = 100 ΔU / U_nominal

Pérdida de potencia:

    P_loss = n I² R,   n = 2 (DC, single-phase) or 3 (three-phase)

Sección mínima: la menor sección normalizada IEC 60228 cuyo ΔU% ≤ caída admisible.

## Hipótesis y limitaciones

- Las resistencias son los máximos de IEC 60228 clase 2 llevados a la temperatura, así que la caída queda ligeramente del lado de la seguridad (los cables reales son hasta un 5–7 % mejores). Se supone el conductor a su temperatura nominal; a carga parcial está más frío.
- La reactancia por defecto de 0.08 Ω/km (IEC 60364-5-52 Annex G) sirve para cables multipolares y unipolares de BT en contacto. Los cables unipolares separados, los cables armados y los cables de MT necesitan el valor del catálogo. En CC no hay reactancia.
- Carga senoidal equilibrada. Las cargas ricas en armónicos (variadores, drivers LED) aumentan las pérdidas y la corriente de neutro, y requieren una evaluación aparte.
- No se calcula la intensidad admisible. Depende del método de instalación, del agrupamiento, de la temperatura ambiente y del aislamiento; toma la intensidad corregida de IEC 60092-352 (buques), de IEC 60364-5-52 (tierra) o del fabricante e introdúcela para ver el grado de utilización. La resistencia al cortocircuito y la coordinación de protecciones también quedan fuera del alcance.
- La sección recomendada cumple solo la caída de tensión; aun así puede quedarse corta por intensidad admisible o por las secciones mínimas mecánicas.
- Límites: IEC 60364-5-52 sugiere un 3 % para alumbrado y un 5 % para otros usos desde el origen de la instalación; IEC 60092-201 admite un 6 % entre el cuadro y el consumidor en buques; los sistemas de CC alimentados por baterías suelen necesitar límites más estrictos porque la tensión de la fuente ya varía.

## Ejemplo resuelto

Un circuito de motor trifásico a 400 V absorbe 50 A con factor de potencia 0.85 a lo largo de un recorrido de 50 m en cable de cobre PVC de 16 mm² (70 °C). Caída admisible: 5 %.

1. Resistencia a 20 °C: 1.15 Ω/km (IEC 60228). A 70 °C: 1.15 × (1 + 0.00393 × 50) = 1.376 Ω/km → R = 0.0688 Ω para 50 m.
2. Reactancia: 0.08 Ω/km → X = 0.004 Ω.
3. Caída: √3 × 50 × (0.0688 × 0.85 + 0.004 × 0.527) = 86.6 × 0.0606 = 5.25 V, es decir, un 1.31 %, holgadamente dentro del 5 %. Tensión en el motor: 394.8 V.
4. Pérdida: 3 × 50² × 0.0688 = 516 W, alrededor del 1.5 % de la carga de 34 kW.
5. La menor sección normalizada que cumple el 5 % sería 6 mm² (3.4 %; 4 mm² da 5.1 %), pero 16 mm² es lo que exige la intensidad admisible para 50 A en la mayoría de los métodos de instalación, así que aquí manda la intensidad admisible.

Una alimentación de control de 24 V CC, 10 A a lo largo de 10 m en cobre de 2.5 mm² a 20 °C: ΔU = 2 × 10 × 0.0741 = 1.48 V = 6.2 %, por encima de un límite del 5 %; 4 mm² da 0.92 V (3.8 %). La baja tensión hace que la caída de tensión sea el criterio determinante.

## Preguntas frecuentes

**¿Por qué la calculadora usa la temperatura máxima del conductor?**
Porque el cable puede trabajar a plena carga, y la resistencia sube alrededor de un 20 % entre 20 y 70 °C. Proyectar con el valor en frío subestimaría la caída. En un cable poco cargado la caída real es menor.

**¿Qué límite de caída de tensión se aplica en un buque?**
IEC 60092-201 admite un 6 % entre el cuadro principal o de emergencia y cualquier punto de la instalación para consumidores de más de 50 V, con disposiciones especiales para corrientes de arranque y luces de navegación. Las reglas de las sociedades de clasificación siguen la IEC.

**¿Por qué el factor trifásico es √3 y no 2 o 3?**
La caída por conductor es I(R cos φ + X sin φ); en un sistema equilibrado el neutro no lleva corriente y la caída entre fases es √3 veces la caída por fase.

**¿Importa mucho el factor de potencia?**
Con la reactancia por defecto, de forma moderada: con fp 0.85 el término reactivo es alrededor del 4 % del total para 16 mm². En cables grandes (≥ 95 mm²) la resistencia es pequeña y la reactancia puede dominar, así que importa la X del catálogo.

**¿Puedo dimensionar el cable solo con este resultado?**
No. Comprueba la intensidad admisible en la tabla adecuada para el método de instalación, la temperatura ambiente y el agrupamiento; la respuesta es la mayor entre la sección por intensidad admisible y la sección por caída de tensión. Después comprueba la resistencia al cortocircuito y las protecciones.

**¿Y el arranque de motores?**
La corriente de arranque (6–8 × la nominal) provoca una caída transitoria que puede hacer saltar contactores o calar otros motores. Usa la calculadora con la corriente de arranque y el factor de potencia de arranque (0.2–0.4) y compara con la caída transitoria admisible (a menudo un 15 %).

**¿Aluminio o cobre?**
El aluminio tiene 1.6 veces la resistencia para la misma sección, así que necesita alrededor de 1.6 veces la sección para la misma caída, pero pesa más o menos la mitad. Los buques usan cobre casi exclusivamente (IEC 60092).

## Calculadoras relacionadas

- [Potencia trifásica y corriente de motor](../three-phase-power/index.html): la corriente para la que dimensionar el cable.
- [Capacidad y autonomía de baterías](../battery-runtime/index.html): alimentaciones de CC, donde la caída de tensión importa más.
- [Carga, kVA y combustible de un generador](../generator-load/index.html): consideraciones del lado de la fuente.
- [Conversor de unidades de ingeniería](../unit-converter/index.html): de mm² a sección AWG, de Ω/km a Ω/kft.
