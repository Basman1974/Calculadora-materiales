# Revisión de beneficio industrial

Revisión local terminada el 11 de octubre de 2026 y repetida antes de publicar. Publicación autorizada por el propietario el 12 de octubre de 2026.

Repositorio oficial: https://github.com/Basman1974/Calculadora-materiales

La base de esta actualización es `c5464d34dd8b150e35ce2ae0f3665ec6737717ca`. La comparación de GitHub previa a la publicación confirmó que no había commits posteriores en `main`. Git por HTTPS no pudo conectar; la descarga se realizó mediante el conector de GitHub. La publicación añade un commit completo sobre esa base y conserva el historial existente.

## Implementación

- Campo «BENEFICIO INDUSTRIAL (%)» en Presupuesto, con valor inicial de 0 %, coma o punto decimal y recálculo al escribir.
- Recargo sobre materiales, mano de obra, mano de obra extra y desplazamientos/varios. El descuento se aplica al subtotal con beneficio, y el IVA a la base resultante.
- Límite técnico de entrada del recargo: 0–1.000 %. Descuento: 0–100 %. No representan porcentajes legales o comerciales predeterminados.
- Los porcentajes inválidos muestran un mensaje, conservan el último valor válido e impiden exportar hasta corregirlos.
- Una sola función de cálculo (`budgetTotals`) y un desglose común (`budgetSummary`) para pantalla, impresión/PDF, CSV, WhatsApp y Compartir.
- El porcentaje se guarda en la obra activa, las obras guardadas y las copias JSON. Obra nueva lo restablece a 0 %. Abrir o restaurar una obra anterior sin ese campo utiliza 0 %, sin heredarlo de la obra activa.
- Se conserva la identificación de presupuesto provisional cuando faltan precios.
- Se completa el CSV con extras, coste base, beneficio, subtotal y descuento.
- Se conservan los decimales del precio unitario en todas las exportaciones: 1.200 unidades a 0,083 €/ud se muestran con precio 0,083 y un importe de 99,60 €, evitando mostrar 0,08 junto a ese importe.
- Importes de línea y etapas monetarias redondeados a céntimos; las cantidades físicas conservan su precisión. Frente al cálculo anterior con importes fraccionarios sin redondear, algún total antiguo puede variar en céntimos para cuadrar con sus líneas y etapas visibles.
- Versionado coherente de cargadores y caché, aviso de novedades y registro del service worker incluso cuando el JavaScript termina de cargar después del evento `load`.
- Una descarga incompleta impide activar el nuevo service worker. La limpieza de caché solo afecta a cachés de esta aplicación.

## Archivos cambiados

| Archivos | Cambio |
| --- | --- |
| `app-a1.js` | Metadatos, validación, cálculo central, redondeo, desglose y versión del aviso. |
| `app-b.js` | Guardado, recuperación, nueva obra, exportaciones, recálculo y registro PWA. |
| `ui-c.html` | Campo, ayuda, validación accesible y versiones de scripts. |
| `ui-a.html` | Aviso de novedades y versión del CSS. |
| `index.html`, `app.js` | Versión de recursos; mismo orden y límites de fragmentos. |
| `service-worker.js` | Nueva versión de caché, instalación y activación controladas. |
| `.github/workflows/ci.yml` | Ejecución de pruebas de presupuesto y PWA. |
| `tests/budget.test.js` | 14 casos de cálculo, límites, decimales, precios pendientes y redondeo. |
| `tests/budget-flows.test.js` | 12 casos con DOM y almacenamiento simulados: formularios, exportaciones, copias, partidas y precisión de precios unitarios. |
| `tests/pwa.test.js` | 6 casos de instalación, activación, registro y recuperación de caché simulados. |
| `docs/referencias-desarrollo.md` | Diez repositorios de código abierto con más de 1.000 estrellas e ideas aplicables, incluidos proyectos de medición y costes de materiales. |
| Este documento | Resultado, alcance y límites de la verificación. |

## Pruebas ejecutadas

Se han ejecutado localmente todos los bloques `run` del workflow de CI: existencia/tamaño de archivos, interfaz y funciones críticas, navegación enlazada, formularios enlazados, ausencia de controles eliminados, sintaxis JavaScript y validación de `manifest.json`. También se ha comprobado la sintaxis del cargador `app.js` y del script de `index.html`.

Han pasado 32 pruebas específicas con Node.js 24.19.0. El workflow de GitHub mantiene su configuración de Node.js 20 y añade los nuevos tests; los resultados de Actions y Pages se comprobarán después de publicar el commit autorizado.

Ejemplos verificados:

| Coste base | Beneficio | Descuento | IVA | Total |
| ---: | ---: | ---: | ---: | ---: |
| 1.000,00 € | 15 % = 150,00 € | 0 % | 21 % | 1.391,50 € |
| 1.000,00 € | 15 % = 150,00 € | 10 % = 115,00 € | 21 % | 1.252,35 € |
| 1.000,00 € | 15 % = 150,00 € | 10 % | 10 % | 1.138,50 € |
| 1.000,00 € | 15 % = 150,00 € | 10 % | 0 % | 1.035,00 € |

Las pruebas ejecutan las funciones y handlers reales con elementos de interfaz, localStorage, descargas y ventanas simulados. Verifican el contenido generado de CSV, texto compartido e impresión/PDF; no se ha abierto WhatsApp ni se ha enviado ningún mensaje. La prueba de «Añadir a Obra» confirma la conservación de todas las líneas y medidas del caso probado.

## Pendiente de comprobar

Chromium no pudo arrancar: el aislamiento del entorno deniega las operaciones de socket necesarias. Por ello no se declara probado el diseño visual móvil, Android físico, el diálogo real de impresión, la instalación de la PWA ni una actualización y sesión sin conexión reales. Sus handlers y ciclo de caché se han probado mediante simulación.

La auditoría de rendimientos de construcción y el resto de prioridades posteriores no se han realizado en esta tarea. No se ha cambiado ningún rendimiento de material ni añadido monetización. El propietario autorizó la publicación el 12 de octubre de 2026; el despliegue se comprobará después de actualizar `main`.
