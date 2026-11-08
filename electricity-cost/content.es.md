# Calculadora de costo de la electricidad y consumo de energía

**Resumen:** Consumo de energía y costo de funcionamiento de cualquier aparato o carga por hora, día, mes y año, según su potencia, horas de uso y precio del kWh.

## Introducción

¿Cuánto cuesta tener funcionando un calefactor, una bomba, un compresor o un servidor durante un año? La respuesta necesita solo tres números: la potencia que consume la carga, el tiempo que funciona y el precio del kilovatio-hora. Multiplicarlos a mano es fácil de hacer mal, sobre todo con cargas que funcionan solo parte del tiempo o solo los días laborables.

Esta calculadora da la energía y el costo por hora de funcionamiento, por día de uso, al mes y al año. El ciclo de trabajo cubre las cargas que se encienden y se apagan con un termostato, como frigoríficos, congeladores y calefactores. El ajuste de días a la semana cubre las cargas que funcionan solo los días laborables. Sirve con cualquier moneda, porque el precio es el tuyo. Está pensada para particulares que revisan sus aparatos, responsables de instalaciones y de energía, e ingenieros que comparan equipos.

## Fórmulas

Energía por día de uso:

    E_day = P × duty × hours per day

Energía mensual y anual, con el mes medio de 30.44 días:

    E_month = E_day × (days per week / 7) × 30.44
    E_year  = E_day × (days per week / 7) × 365.25

Costo:

    cost = E [kWh] × price per kWh
    1 kWh = 1000 W for one hour = 3.6 MJ

- P: potencia en funcionamiento, W o kW
- duty: fracción del tiempo en que la carga consume realmente esa potencia, de 0 a 100 %

## Hipótesis y limitaciones

- La potencia es la potencia activa mientras la carga funciona, de su placa de características o de un medidor de enchufe. Las placas suelen indicar el máximo, así que los valores medidos dan una estimación mejor.
- El precio es una tarifa fija por kWh. No se incluyen los términos fijos, las tarifas por franjas horarias, los cargos por potencia demandada ni los impuestos.
- Los meses y los años son medias de 30.44 y 365.25 días.
- El consumo en espera se acumula a lo largo de un año. Introdúcelo como una pequeña carga aparte que funciona 24 horas al día.

## Ejemplo resuelto

Un calefactor eléctrico de 2 kW funciona 4 horas al día, todos los días, y la electricidad cuesta 0.25 por kWh. ¿Cuánto cuesta?

1. Energía por día: 2 kW × 4 h = 8 kWh.
2. Costo por día: 8 × 0.25 = 2.00.
3. Energía al año: 8 × 365.25 = 2 922 kWh.
4. Costo al año: 2 922 × 0.25 = 730.50.
5. Por hora de funcionamiento cuesta 2 × 0.25 = 0.50.

Si un termostato lo mantiene encendido solo el 60 % del tiempo, introduce un ciclo de trabajo del 60 % y todas las cifras bajan al 60 %.

## Preguntas frecuentes

**¿Cómo calculo el costo eléctrico de un aparato?**
Multiplica su potencia en kW por las horas que funciona para obtener los kWh, y luego por tu precio por kWh. Una bombilla de 100 W durante 10 horas consume 1 kWh.

**¿Dónde encuentro la potencia de un aparato?**
En la placa de características o en el manual, en vatios. Para cargas que funcionan por ciclos, un medidor de energía de enchufe da la media real, que suele ser mucho menor que el valor de la placa.

**¿Qué es el ciclo de trabajo?**
La fracción del tiempo en que una carga cíclica consume realmente potencia. El compresor de un frigorífico funciona alrededor del 30 al 50 % del tiempo, así que su energía anual queda muy por debajo de su potencia nominal multiplicada por 8 766 horas.

**¿Cuánto cuesta el consumo en espera?**
Una carga en espera de 5 W funcionando todo el año consume unos 44 kWh, alrededor de 13 a 0.30 por kWh. Muchas cargas así en un edificio suman bastante.

**¿Por qué no coincide con mi factura?**
Las facturas añaden términos fijos, impuestos y a veces tarifas por franjas horarias, y el consumo real varía con la estación y los hábitos. Esta calculadora da la parte de energía a una tarifa fija.

**¿Cómo convierto vatios en kWh?**
Los vatios son un ritmo y los kWh una cantidad. Multiplica los vatios por las horas de uso y divide entre 1000.

## Calculadoras relacionadas

- [Ley de Ohm y potencia eléctrica](../ohms-law/index.html): potencia a partir de tensión y corriente.
- [Potencia trifásica y corriente de motores](../three-phase-power/index.html): la potencia activa de motores y cargas trifásicas.
- [Carga de un generador, kVA y combustible](../generator-load/index.html): lo que cuesta generar la energía tú mismo.
- [Dimensionado de campo fotovoltaico y almacenamiento](../solar-pv-sizing/index.html): producir la energía en el propio emplazamiento.
