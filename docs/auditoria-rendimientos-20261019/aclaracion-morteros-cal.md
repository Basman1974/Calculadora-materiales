# Aclaración del propietario sobre los morteros de cal

Fecha: 19 de octubre de 2026. Procedencia: mensaje del propietario en esta conversación, posterior al informe de auditoría. No se atribuyen estos valores a una nueva ficha del fabricante ni a un consumo certificado.

| Producto | Consumo indicado | Espesor máximo recomendado indicado |
|---|---|---|
| Cal Nature Pro | 1,8 kg/m² por cada mm | No se ha indicado un nuevo límite; se conserva el existente de 20 mm |
| Cal Revoco | 1,4 kg/m² por cada mm | 9 mm |

La corrección activa cambia Cal Nature Pro de 1,9 a 1,8. Cal Revoco ya tenía 1,4 y máximo 9 mm: se mantienen. La ambigüedad de las unidades de los documentos consultados se conserva en el registro de fuentes; la confirmación del propietario tiene su propio registro y fecha. El hallazgo R17 del informe queda aclarado respecto a los valores que debe utilizar la aplicación, con verificación documental del fabricante pendiente.

Fórmula: superficie × espesor en mm × consumo × (1 + merma / 100). Se divide el resultado por 25 kg y se redondea al saco completo superior.

Ejemplos sin merma:

- Cal Nature Pro: 10 m² × 10 mm × 1,8 = 180 kg = 8 sacos de 25 kg.
- Cal Nature Pro: 25 m² × 10 mm × 1,8 = 450 kg = 18 sacos de 25 kg.
- Cal Revoco: 10 m² × 9 mm × 1,4 = 126 kg = 6 sacos de 25 kg. Un espesor superior a 9 mm se rechaza.

Las obras y copias anteriores conservan sus cantidades y precios. Las partidas antiguas de Cal Nature Pro se marcan para revisión, sin recalcularlas automáticamente. Editar y guardar una partida aplica el nuevo consumo manteniendo el precio por saco.

Se actualizan la versión de cálculo y los recursos PWA a `20261019-cal-morteros`, el aviso de novedades y la ayuda. Los demás hallazgos de la auditoría siguen pendientes. Los cambios son locales y no están publicados.

Validación ejecutada: cuatro bloques de CI local y 191 pruebas correctas, incluidas 10 nuevas sobre cálculos, mermas, sacos, límite de espesor, conservación de partidas antiguas y procedencia de datos. Véanse `validacion-morteros-cal.json` y `validacion-morteros-cal.txt`. Ejecución con Node 24.19.0; el workflow configura Node 20. Sin comprobación visual en Android ni nuevo despliegue.
