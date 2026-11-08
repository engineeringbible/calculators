# Calculadora de renovaciones de aire por hora (ACH) y CFM

**Resumen:** Renovaciones de aire por hora a partir del caudal de aire, o los CFM, m³/h y L/s para unas ACH objetivo, más la ventilación de vivienda según ASHRAE 62.2.

## Introducción

Las renovaciones de aire por hora (ACH) son las veces que se sustituye el aire de una habitación en una hora. Convierten un caudal de aire, en pies cúbicos por minuto (CFM), metros cúbicos por hora o litros por segundo, en algo comparable entre habitaciones de cualquier tamaño. Un dormitorio de 12 × 15 ft con un techo de 8 ft contiene 1 440 ft³ de aire; aportar 144 CFM lo renueva seis veces por hora.

Esta calculadora trabaja en los dos sentidos: el caudal de aire necesario para unas ACH objetivo, o las ACH que da un caudal conocido. También da el caudal de ventilación de ASHRAE 62.2 para una vivienda completa a partir de su superficie y sus dormitorios. Está pensada para proyectistas de climatización (HVAC), instaladores que dimensionan ventiladores y purificadores de aire, y cualquiera que quiera comprobar la ventilación de una habitación.

## Fórmulas

Renovaciones de aire y caudal para una habitación de volumen V:

    ACH = 60 × CFM / V_ft³ = Q_m³/h / V_m³
    CFM = ACH × V_ft³ / 60

Ventilación de toda la vivienda (ASHRAE 62.2):

    Q = 0.03 × A_floor + 7.5 × (N_br + 1)    cfm, A in ft²
    Q = 0.15 × A_floor + 3.5 × (N_br + 1)    L/s, A in m²

- V — volumen de la habitación, largo × ancho × altura del techo
- A_floor — superficie acondicionada; N_br — número de dormitorios
- 1 CFM = 1.699 m³/h = 0.4719 L/s

## Hipótesis y limitaciones

- El volumen es el de la habitación vacía. Las ACH cuentan el aire aportado y suponen que se mezcla por toda la habitación; una mala mezcla deja rincones estancados.
- Las normas de ventilación rara vez fijan una única cifra de ACH. ASHRAE 62.1 y 62.2 y la norma europea EN 16798-1 dan caudales por persona y por superficie, que aquí puedes convertir en ACH. Los hospitales, los laboratorios y las salas limpias tienen sus propias tablas de ACH.
- El caudal de ASHRAE 62.2 es la ventilación mecánica total de la vivienda. El descuento por infiltración natural y los requisitos de extracción de cocina y baños van aparte.
- Para los purificadores de aire, la tasa de suministro de aire limpio (CADR) en CFM ocupa el lugar del caudal de aire.

## Ejemplo resuelto

Un dormitorio mide 15 ft de largo, 12 ft de ancho y 8 ft de alto. ¿Qué caudal de aire da seis renovaciones por hora?

1. Volumen: 15 × 12 × 8 = 1 440 ft³.
2. Caudal de aire: 6 × 1 440 / 60 = 144 cfm.
3. En unidades métricas: 144 × 1.699 = 245 m³/h, o 144 × 0.4719 = 68.0 L/s.

Seis renovaciones significan que el aire se sustituye cada 10 minutos.

## Preguntas frecuentes

**¿Cuántas renovaciones de aire por hora necesito?**
Depende de la habitación y de la normativa. Las viviendas necesitan en conjunto unas 0.35 ACH o más de aire exterior, con extractores de 50 cfm en los baños y de 100 cfm en las cocinas según ASHRAE 62.2. Las habitaciones de hospital, los laboratorios y las salas limpias tienen sus propios requisitos de ACH, mucho más altos.

**¿Cómo paso de CFM a ACH?**
Multiplica los CFM por 60 y divide por el volumen de la habitación en pies cúbicos.

**¿Qué es ASHRAE 62.2?**
La norma de EE. UU. de ventilación en viviendas. Fija el aire exterior continuo para toda la vivienda a partir de la superficie y del número de dormitorios: una casa de 2 000 ft² con tres dormitorios necesita 90 cfm.

**¿Cuántas ACH da un purificador de aire?**
Divide su CADR por el volumen de la habitación y multiplica por 60. La Agencia de Protección Ambiental de EE. UU. (EPA) recomienda un CADR de al menos dos tercios de la superficie de la habitación en pies cuadrados.

**¿Siempre es mejor un valor de ACH más alto?**
Más aire exterior diluye los contaminantes y la humedad, pero también cuesta energía calentarlo o enfriarlo. Los sistemas equilibrados con recuperación de calor dan mucha ventilación con poco costo energético.

**¿Cómo paso de m³/h a CFM?**
Divide por 1.699. 300 m³/h son 177 cfm.

## Calculadoras relacionadas

- [Calculadora de la densidad del aire](../air-density/index.html): la masa del aire que se mueve.
- [Calculadora de BTU para aire acondicionado](../btu-ac-size/index.html): capacidad de refrigeración.
- [Pérdidas de calor de un edificio](../heat-loss/index.html): el calor que se pierde por ventilación.
- [Calculadora del punto de rocío](../dew-point/index.html): la humedad del aire de la habitación.
