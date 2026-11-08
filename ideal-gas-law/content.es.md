# Calculadora de la ley de los gases ideales (PV = nRT)

**Resumen:** Presión, volumen, temperatura o cantidad de un gas con PV = nRT, con su masa, densidad y constante específica para aire, N₂, CO₂, H₂ y otros gases.

## Introducción

La ley de los gases ideales relaciona las cuatro magnitudes que describen un gas en un recipiente: su presión, su volumen, su temperatura y cuánto gas hay. Si conoces tres, la cuarta se deduce. Con la masa molar del gas, la misma ecuación da su masa y su densidad, y así obtienen los ingenieros el aire de una habitación, el gas de una botella, el aumento de presión en un recipiente cerrado que se calienta o la densidad de un gas en un conducto.

Esta calculadora resuelve la variable que necesites y convierte la cantidad en kilogramos para aire, nitrógeno, oxígeno, dióxido de carbono, metano, hidrógeno, helio, argón, amoníaco o un gas propio. Está pensada para ingenieros mecánicos, de procesos y navales, y para estudiantes de termodinámica y química.

## Fórmulas

La ley de los gases ideales:

    P V = n R T

Despejada para cada incógnita:

    n = P V / (R T),   P = n R T / V,   V = n R T / P,   T = P V / (n R)

Masa, densidad y constante específica del gas:

    m = n M
    ρ = P M / (R T)
    R_specific = R / M

- P — presión absoluta, Pa
- V — volumen, m³
- n — cantidad de gas, mol
- T — temperatura absoluta, K (T = t + 273.15 con t en °C)
- R — constante molar de los gases, 8.314 462 618 J/(mol·K), exacta
- M — masa molar, kg/mol (aire 0.028 965, N₂ 0.028 013, CO₂ 0.044 010)

## Hipótesis y limitaciones

- El gas es ideal. Los gases reales siguen la ley con un error de alrededor del 1 % a presiones de unos pocos bar y a temperaturas muy por encima de su punto de ebullición. A alta presión, multiplica n R T por el factor de compresibilidad Z de un diagrama o de una ecuación de estado.
- La presión debe ser absoluta. Una lectura manométrica de 7 bar son 8.01 bar absolutos a nivel del mar, y si introduces el valor manométrico el resultado sale un 13 % bajo.
- La temperatura debe ser absoluta. La calculadora convierte °C y °F por ti, pero un cociente de temperaturas en °C no tiene sentido.
- Las masas molares son las del gas puro. El aire húmedo es algo más ligero que el aire seco, y el gas natural es más pesado que el metano puro.
- Cerca de la condensación, como el dióxido de carbono por debajo de 31 °C bajo presión o cualquier gas próximo a su punto de ebullición, la ley de los gases ideales no se aplica.

## Ejemplo resuelto

¿Cuánto aire hay en una habitación de 5 m × 4 m × 2.5 m a presión atmosférica normal y 20 °C?

1. Volumen: V = 5 × 4 × 2.5 = 50 m³.
2. Presión absoluta: P = 101.325 kPa = 101 325 Pa. Temperatura absoluta: T = 20 + 273.15 = 293.15 K.
3. Cantidad de aire: n = P V / (R T) = 101 325 × 50 / (8.314 × 293.15) = 2 079 mol.
4. Masa: m = n M = 2 079 × 0.028 965 = 60.2 kg.
5. Densidad: ρ = P M / (R T) = 1.204 kg/m³, la densidad del aire a 20 °C de los libros de texto.
6. La constante específica del aire es R / M = 8.314 / 0.028 965 = 287.1 J/(kg·K).

Así que una habitación normal contiene unos 60 kg de aire. Si se calentara a 30 °C en un espacio cerrado, su presión subiría en proporción a la temperatura absoluta, un 10 / 293 = 3.4 %, y por eso un recinto cerrado al sol acumula presión.

## Preguntas frecuentes

**¿Por qué debo usar presión y temperatura absolutas?**
La ley describe las moléculas del gas a partir de presión cero y temperatura cero. La presión manométrica y los °C tienen ceros arbitrarios, así que dan resultados erróneos si no se convierten antes.

**¿Cuál es el valor de R?**
8.314 462 618 J/(mol·K), exacto por definición desde 2019. En otras unidades es 0.083 145 L·bar/(mol·K) o 0.082 057 L·atm/(mol·K).

**¿Cuándo falla la ley de los gases ideales?**
A alta presión, cerca de la condensación y a temperatura muy baja. Una botella de nitrógeno a 200 bar contiene un pequeño porcentaje menos de gas del que predice la ley ideal; el vapor de agua cerca de la saturación necesita tablas de vapor.

**¿Cómo obtengo la densidad del aire a otra altitud o temperatura?**
Introduce la presión absoluta y la temperatura locales. A 35 °C y 101.3 kPa, el aire tiene 1.145 kg/m³, un 5 % más ligero que a 20 °C, lo que importa para el rendimiento de ventiladores y motores.

**¿Qué es la constante específica del gas?**
La constante molar dividida por la masa molar del gas: 287 J/(kg·K) para el aire, 297 para el nitrógeno, 189 para el dióxido de carbono. Permite escribir la ley por kilogramo como P = ρ R_specific T.

**¿Cómo la uso para una mezcla de gases?**
Usa la masa molar media de la mezcla, la media de sus componentes ponderada por fracción molar, como gas personalizado. El aire seco es en sí una mezcla de un 78 % de nitrógeno, un 21 % de oxígeno y un 1 % de argón.

## Calculadoras relacionadas

- [Botellas de aire de arranque y compresores](../starting-air/index.html): aire comprimido almacenado en botellas.
- [Volumen de tanques y llenado parcial](../tank-volume/index.html): el volumen del recipiente que introduces aquí.
- [Pérdida de calor por el aislamiento de tuberías y tanques](../pipe-insulation/index.html): el calor que pierde un recipiente lleno de gas.
- [Conversor de unidades de ingeniería](../unit-converter/index.html): presión y temperatura en otras unidades.
