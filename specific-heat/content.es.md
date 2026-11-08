# Calculadora de calor específico (Q = mcΔT)

**Resumen:** Calor para calentar o enfriar un material, Q = m c ΔT, o la variación de temperatura, la masa o el calor específico, con el tiempo de calentamiento.

## Introducción

El calor específico de un material es la energía necesaria para elevar un grado la temperatura de un kilogramo de ese material. El agua tiene uno de los más altos: 4 181 julios por kilogramo y kelvin, unas diez veces el del cobre. Por eso un hervidor tarda minutos en hervir el agua y por eso se usa el agua para almacenar y transportar calor.

Esta calculadora aplica Q = m c ΔT en cualquier sentido. Obtiene el calor para calentar o enfriar una masa, la temperatura que se alcanza con un calor dado, la masa que puede calentar un calor dado o el calor específico de un material a partir de una medición. También da el tiempo de calentamiento con un calentador de potencia y rendimiento dados. Incluye el calor específico del agua, el hielo, el aire, el vapor de agua, el aceite, los metales, el hormigón (concreto) y el vidrio.

## Fórmulas

Calor sensible y tiempo de calentamiento:

    Q = m × c × (T₂ − T₁)
    t = Q / (P × η)

Despejando las demás magnitudes:

    T₂ = T₁ + Q / (m c),   m = Q / (c ΔT),   c = Q / (m ΔT)

- Q: calor, J; 1 kWh = 3.6 MJ; 1 Btu = 1 055 J
- m: masa, kg; c: calor específico, J/(kg·K)
- P: potencia del calentador, W; η: fracción de esa potencia que llega al material

## Hipótesis y limitaciones

- Solo se incluye el calor sensible. Fundir hielo necesita otros 334 kJ/kg y hervir agua otros 2 257 kJ/kg a 100 °C, mucho más que calentarla.
- El calor específico se toma constante. Es preciso para el agua entre 0 y 100 °C y para los metales en intervalos moderados, pero los gases en intervalos amplios necesitan un valor medio.
- El tiempo de calentamiento ignora el calor perdido al entorno durante el calentamiento, así que los tiempos reales son mayores, sobre todo en calentamientos lentos.
- Los valores de los materiales son típicos a temperatura ambiente y varían con la aleación y la composición.

## Ejemplo resuelto

¿Cuánta energía hace falta para llevar a ebullición 1.5 litros de agua que están a 20 °C, y cuánto tarda un hervidor de 2 kW con un 90 % de rendimiento?

1. Masa: 1.5 L de agua son 1.5 kg.
2. Calor: 1.5 × 4 181 × (100 − 20) = 501 720 J = 501.7 kJ.
3. En kilovatios hora: 501.7 / 3 600 = 0.139 kWh.
4. Tiempo: 501 720 / (2 000 × 0.9) = 279 s = 4.65 min.

Evaporar por completo el agua necesitaría otros 1.5 × 2 257 = 3 386 kJ, casi siete veces más.

## Preguntas frecuentes

**¿Cuál es el calor específico del agua?**
4 181 J/(kg·K) a 25 °C, o 1 Btu/(lb·°F) y 1 cal/(g·°C). Es uno de los más altos de todas las sustancias habituales.

**¿Cómo calculo el calor necesario para calentar agua?**
Multiplica la masa en kg por 4 181 y por el aumento de temperatura. Calentar 100 L en 40 K necesita 16.7 MJ, o 4.6 kWh.

**¿Cuánto se tarda en calentar agua con un calentador?**
Divide el calor por la potencia del calentador multiplicada por su rendimiento. Una resistencia de inmersión de 3 kW calienta 150 L en 45 K en unas 2.6 horas con un 100 % de rendimiento.

**¿Por qué los metales se calientan tan deprisa?**
Su calor específico es bajo: cobre 385 y aluminio 897 J/(kg·K), frente a 4 181 del agua. El mismo calor eleva mucho más su temperatura.

**¿Qué diferencia hay entre calor específico y capacidad calorífica?**
El calor específico es por kilogramo. La capacidad calorífica es la de un objeto entero, su masa por su calor específico, en J/K.

**¿Y cp y cv en los gases?**
cp es a presión constante y cv a volumen constante. Para el aire a temperatura ambiente cp = 1 007 y cv = 720 J/(kg·K). Para calentar el aire de una sala o de un conducto se usa cp.

## Calculadoras relacionadas

- [Transmisión de calor](../heat-transfer/index.html): con qué rapidez fluye el calor por conducción, convección y radiación.
- [Costo de la electricidad](../electricity-cost/index.html): el costo de los kilovatios hora.
- [Pérdidas de calor de edificios](../heat-loss/index.html): calefacción de un edificio entero.
- [Rendimiento de Carnot y COP](../carnot-cop/index.html): bombas de calor y motores térmicos.
