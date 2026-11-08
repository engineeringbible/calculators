# Calculadora de par, potencia y rpm

**Resumen:** Potencia de un eje a partir del par y las rpm, par a partir de la potencia y las rpm, o velocidad a partir de potencia y par, en kW, hp, N·m y lbf·ft.

## Introducción

Toda máquina rotativa intercambia par (torque) por velocidad. La placa de características de un motor indica su potencia y su velocidad, pero el acoplamiento, el eje y la reductora se dimensionan por el par. El banco de potencia de un motor de combustión mide el par a cada velocidad, mientras que el catálogo da la potencia. Una sola relación permite pasar de uno a otro: la potencia es igual al par por la velocidad angular.

Esta calculadora resuelve esa relación para la magnitud que falte. Introduce la potencia y la velocidad para obtener el par que debe transmitir un eje, el par y la velocidad para obtener la potencia, o la potencia y el par para obtener la velocidad. Los resultados se dan en kilovatios y caballos, newton metro y libra-fuerza pie, y rpm y radianes por segundo. Está pensada para ingenieros mecánicos, navales y de automoción, técnicos y estudiantes.

## Fórmulas

Potencia, par y velocidad angular:

    P = T × ω,   ω = 2π × n / 60

Despejando cada magnitud:

    T = 60 P / (2π n)
    P = 2π n T / 60
    n = 60 P / (2π T)

En unidades imperiales, con T en lbf·ft y n en rpm:

    hp = T × n / 5252

- P: potencia, W (1 kW = 1.341 hp)
- T: par, N·m (1 N·m = 0.7376 lbf·ft)
- n: velocidad de giro, rpm; ω: velocidad angular, rad/s

## Hipótesis y limitaciones

- La potencia, el par y la velocidad corresponden al mismo eje en el mismo momento. Una reductora cambia el par y la velocidad pero, salvo por sus pérdidas, no la potencia.
- En un motor de pistones el par pulsa con cada explosión; la fórmula da el par medio, y el pico puede ser varias veces mayor.
- El caballo de potencia es aquí el caballo mecánico, 745.7 W. El caballo métrico (PS o CV) vale 735.5 W y aparece en la lista de unidades.
- El par nominal de un motor eléctrico es su par continuo a la velocidad nominal. El par de arranque y el par máximo son mayores y se obtienen de la hoja de datos.

## Ejemplo resuelto

Un motor eléctrico de 15 kW y 4 polos gira a 1460 rpm. ¿Qué par transmiten su eje y su acoplamiento a plena carga?

1. Velocidad angular: ω = 2π × 1460 / 60 = 152.9 rad/s.
2. Par: T = P / ω = 15 000 / 152.9 = 98.1 N·m.
3. En unidades imperiales, son 72.4 lbf·ft.

Un acoplamiento elegido para este motor debe tener un par nominal superior a 98.1 N·m multiplicado por el factor de servicio de la máquina accionada, normalmente de 1.5 a 2 para una bomba o un ventilador.

## Preguntas frecuentes

**¿Cómo convierto kW a N·m?**
Par en N·m = 9549 × potencia en kW / velocidad en rpm. 9549 es 60 000 / 2π.

**¿Por qué el par en lbf·ft es igual a la potencia en hp a 5252 rpm?**
Porque 5252 es 33 000 / 2π, que procede de la definición del caballo de potencia como 33 000 ft·lbf por minuto. En una gráfica de banco de potencia las curvas de par y de potencia siempre se cruzan ahí.

**¿Una reductora cambia la potencia?**
No, salvo por sus pérdidas. Multiplica el par por la relación de transmisión y divide la velocidad por ella, así que su producto, la potencia, se mantiene, menos un 1 a 3 % por etapa.

**¿Qué par da un motor diésel?**
Los motores grandes y lentos dan un par enorme. Un motor marino de 10 MW a 80 rpm transmite unos 1.2 MN·m, y por eso los ejes de hélice son tan gruesos.

**¿Puedo usarla para el par de arranque de un motor?**
No directamente. El par de arranque se obtiene de la hoja de datos del motor, normalmente de 1.5 a 2.5 veces el par nominal en un motor de inducción.

**¿Qué son los radianes por segundo?**
La unidad SI de velocidad angular. Una vuelta son 2π radianes, así que 1 rpm son 0.1047 rad/s.

## Calculadoras relacionadas

- [Par, potencia y diámetro de ejes](../shaft-torque/index.html): el diámetro del eje para este par.
- [Relación de transmisión, rpm y par](../gear-ratio/index.html): velocidad y par a través de una reductora.
- [Potencia trifásica e intensidad del motor](../three-phase-power/index.html): la parte eléctrica del motor.
- [BMEP, par y potencia de motores](../engine-bmep/index.html): el par a partir de la presión en los cilindros.
