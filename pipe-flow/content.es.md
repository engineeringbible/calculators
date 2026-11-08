# Calculadora de pérdida de carga en tuberías

**Resumen:** Velocidad, número de Reynolds, factor de fricción de Darcy (Colebrook, Swamee–Jain) y pérdida de carga en una tubería recta con accesorios.

## Introducción

Todo dimensionado de una bomba, un enfriador o una línea de combustible empieza aquí: a qué velocidad se mueve el fluido, si el flujo es laminar o turbulento, qué factor de fricción corresponde y cuánta presión se pierde en el recorrido. Esta calculadora toma un caudal o una velocidad, el diámetro, la longitud y el material de la tubería, y el fluido. Devuelve el número de Reynolds, el factor de fricción de Darcy según la ecuación de Colebrook–White (con el valor explícito de Swamee–Jain al lado para comparar), la pérdida por fricción, las pérdidas menores de los accesorios expresadas como ΣK y la altura estática debida a un desnivel.

Los ingenieros navales la usan para líneas de refrigeración con agua de mar, trasiego de combustible y tuberías de lastre; los ingenieros de instalaciones y de procesos, para conductos de agua y de aire; los estudiantes, para los ejercicios clásicos del diagrama de Moody, con el diagrama sustituido por una solución convergida.

## Fórmulas

Continuidad:

    V = Q / A,   A = π D² / 4

- Q — caudal volumétrico, m³/s
- V — velocidad media, m/s
- D — diámetro interior de la tubería, m

Número de Reynolds:

    Re = V D / ν

- ν — viscosidad cinemática, m²/s (= μ / ρ)

Factor de fricción (Darcy):

    Laminar, Re < 2 300:        f = 64 / Re
    Turbulent, Colebrook–White: 1/√f = −2 log₁₀( ε/(3.7 D) + 2.51/(Re √f) )   (solved by iteration)
    Swamee–Jain explicit:       f = 0.25 / [ log₁₀( ε/(3.7 D) + 5.74/Re^0.9 ) ]²

- ε — rugosidad absoluta de la pared de la tubería, m

Pérdidas:

    h_f  = f (L/D) V² / (2g)             friction head, m of fluid
    Δp_f = f (L/D) ρ V² / 2              friction pressure drop, Pa
    Δp_K = ΣK ρ V² / 2                   minor losses, Pa
    Δp_z = ρ g Δz                        static pressure from elevation, Pa
    Δp_total = Δp_f + Δp_K + Δp_z
    H_total  = Δp_total / (ρ g)
    H_loss   = (Δp_f + Δp_K) / (ρ g)     friction and fittings only (the suction-line loss of an NPSH check)

- L — longitud de la tubería, m; ρ — densidad, kg/m³; ΣK — suma de coeficientes de pérdidas menores; Δz — altura de la salida sobre la entrada, m; g = 9.80665 m/s²

Rugosidades predefinidas (Moody 1944 / White, tabla 6.1): tubo estirado y PVC 0.0015 mm, acero inoxidable 0.015 mm, acero comercial 0.045 mm, hierro galvanizado 0.15 mm, fundición 0.26 mm, hormigón (concreto) 1.0 mm, acero remachado 3 mm.

## Hipótesis y limitaciones

- Flujo estacionario, completamente desarrollado e incompresible en una tubería circular llena. Para gases, el resultado es válido mientras la caída de presión quede por debajo de un 10 % de la presión absoluta.
- El factor de fricción es el de Darcy (cuatro veces el factor de Fanning). Comprueba cuál usa un diagrama o una tabla del fabricante antes de comparar.
- En la zona de transición 2 300 < Re < 4 000 ninguna fórmula es fiable; la calculadora usa el valor turbulento (Colebrook) como opción conservadora y avisa.
- Las pérdidas menores se agrupan como ΣK × presión dinámica. Los valores de K de los manuales varían un ±30 % y dependen del número de Reynolds y de la geometría del accesorio; los métodos de longitud equivalente dan una precisión parecida.
- Las rugosidades predefinidas son de tubería nueva y limpia. Una tubería envejecida o incrustada puede tener varias veces esa rugosidad, y los productos de corrosión reducen el diámetro, lo que pesa más que la rugosidad porque las pérdidas varían con D⁻⁵ a caudal constante.
- Los combustibles y el aceite lubricante predefinidos tienen valores típicos a la temperatura indicada, no propiedades normalizadas; la viscosidad del HFO cambia en un factor de dos con un cambio de 10 °C, así que introduce el valor real en cualquier cálculo que importe.
- Conductos no circulares: usa el diámetro hidráulico D_h = 4A/P en lugar de D; la precisión es entonces de un ±15 % en flujo turbulento y mala en flujo laminar.

## Ejemplo resuelto

Línea de refrigeración con agua de mar: 100 m³/h por una tubería de acero comercial DN100 (100 mm de diámetro interior), de 100 m de longitud, con ΣK = 5 por codos y válvulas, que descarga 10 m por encima de la entrada. Agua de mar a 15 °C: ρ = 1025.9 kg/m³, ν = 1.188 × 10⁻⁶ m²/s.

1. Área: π × 0.1² / 4 = 7.854 × 10⁻³ m². Velocidad: (100/3600) / 7.854 × 10⁻³ = 3.54 m/s (alta para una línea de líquido; la calculadora avisa).
2. Reynolds: 3.54 × 0.1 / 1.188 × 10⁻⁶ = 2.98 × 10⁵, turbulento.
3. Rugosidad relativa: 0.045 / 100 = 4.5 × 10⁻⁴. Colebrook: f = 0.0179; Swamee–Jain da 0.0180.
4. Fricción: Δp_f = 0.0179 × (100/0.1) × 1025.9 × 3.54² / 2 = 115.1 kPa (11.4 m de agua de mar).
5. Pérdidas menores: 5 × 1025.9 × 3.54² / 2 = 32.1 kPa.
6. Estática: 1025.9 × 9.80665 × 10 = 100.6 kPa.
7. Total: 248 kPa ≈ 24.6 m de agua de mar, la altura que debe dar la bomba a este caudal (más la presión que se necesite en la salida).

Si duplicas el diámetro a DN200, la velocidad baja a 0.88 m/s y la pérdida por fricción a unos 4 kPa.

## Preguntas frecuentes

**¿Factor de fricción de Darcy o de Fanning?**
Aquí, Darcy. f_Darcy = 4 f_Fanning. El flujo laminar es f = 64/Re en la forma de Darcy y 16/Re en la de Fanning; es la manera más rápida de saber cuál usa una fuente.

**¿Por qué iterar Colebrook si existe Swamee–Jain?**
Swamee–Jain queda a menos de un 1 % de Colebrook dentro de su rango de validez, lo que basta para la mayor parte del diseño. La calculadora muestra ambos para que veas la diferencia; para los resultados se usa el valor convergido de Colebrook.

**¿Para qué velocidad debo diseñar?**
Práctica habitual: líneas de agua de mar 1.5–3 m/s (el cuproníquel está limitado a unos 3 m/s por erosión), agua dulce 1–2.5 m/s, aspiración de combustible por debajo de 1 m/s, impulsión de bombas hasta 3 m/s, conductos de aire 5–10 m/s.

**¿Cómo obtengo ΣK?**
Suma el K de manual de cada accesorio: codo de 90° de radio largo 0.3, codo estándar 0.9, te en paso directo 0.6, te en derivación 1.8, válvula de compuerta abierta 0.2, válvula de globo abierta 10, válvula de retención de clapeta 2, entrada en arista viva 0.5, salida 1.0. La referencia habitual es Crane TP-410.

**¿Qué uso si el régimen sale de transición?**
Evita diseñar en esa zona si puedes: un pequeño cambio de temperatura o de caudal mueve el factor de fricción un 30 % o más. La calculadora muestra el valor turbulento porque es el más alto y el más seguro.

**¿Importa la edad de la tubería?**
Mucho. El acero incrustado o sucio puede tener una rugosidad de 1–3 mm y un diámetro interior menor; las pérdidas pueden duplicarse o triplicarse a lo largo de la vida de la tubería. Usa los valores predefinidos de fundición u hormigón para líneas antiguas, o una rugosidad personalizada.

**¿Puedo usarla para aire o gas?**
Sí, con el aire predefinido o con propiedades personalizadas, siempre que la caída de presión sea una pequeña fracción de la presión absoluta. Los conductos de ventilación cumplen esa condición; las redes de aire comprimido de gran longitud pueden no cumplirla.

## Calculadoras relacionadas

- [Leyes de afinidad de bombas y ventiladores](../pump-affinity/index.html): ajusta la bomba para que dé la altura calculada aquí.
- [LMTD de intercambiadores de calor](../heat-exchanger-lmtd/index.html): la pérdida de carga del lado de los tubos acompaña al cálculo de la superficie.
- [Volumen de tanques y llenado parcial](../tank-volume/index.html): los volúmenes que mueven estas líneas.
- [Conversor de unidades de ingeniería](../unit-converter/index.html): bar, psi, m³/h, gpm, cSt.
