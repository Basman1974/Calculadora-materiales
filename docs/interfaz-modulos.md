# Ampliación de formularios progresivos

Informe de preparación del 16 de octubre de 2026, continuando la primera fase de Tabique y Presupuesto sobre `b33f1fcb68cc4dec822aca084db0bb2368001ccd`. Describe la implementación y sus comprobaciones locales previas a la publicación.

## Funciones implementadas

- **Trasdosado:** medidas y configuración elegida visibles; placas, estructura y aislamiento desplegables; huecos, aristas, merma y mano de obra agrupados con sus valores resumidos. En directo, pasta de agarre visible para revisar el consumo configurado, sin controles de perfilería. Los avisos de compatibilidad, altura y propuesta estructural permanecen fuera de los ajustes plegados.
- **Techo:** se conservan las tarjetas de familias y sistemas. El resumen refleja el sistema, las placas y el descuelgue que realmente se utilizan. El sistema autoportante no solicita plenum y los sistemas registrables o de escayola no muestran ajustes PYL. Los huecos, la merma y la mano de obra son desplegables. El aviso de despiece pendiente y presupuesto provisional sigue visible.
- **Obra húmeda:** selector visual y buscador conservados. Superficie y datos de aplicación del producto primero; geometría del ladrillo, mortero/rendimiento y mermas en bloques propios. El resumen separa geometría configurada y referencia comercial. Los controles se adaptan a ladrillos, bloques, revestimientos y puentes. No se han inventado consumos ni modificado los datos del catálogo.
- **Cerámica:** formato y superficie primero, con encolado y llana accesibles. Junta, espesor, patrón, merma y tanda se agrupan con resúmenes. La tanda muestra también el límite efectivo de superficie simultánea para las cuñas reutilizables.
- **Orientación de adhesivo:** superficie, encolado y llana permanecen visibles en esta pestaña; lado mayor, ubicación, aplicación y soporte se revisan en el propio formulario. Se conserva el consumo por m² con superficie 0. Un cambio de tipo de baldosa no sustituye el lado mayor que se está introduciendo. Se ha retirado un texto de rangos genéricos que no correspondía a todas las llanas, conservando el consumo calculado de la configuración.
- **Acción de adhesivo corregida:** la orientación mostraba un botón «Añadir a obra» sin handler. Ahora ofrece «Ir al cálculo de materiales», que abre el formulario completo, conserva la superficie e invita a revisar el formato antes de añadir sus materiales. Los resultados de materiales mantienen su acción de guardado.
- **Entrada y errores:** teclado decimal, campos táctiles de al menos 48 px, coma o punto y paso con Intro entre las medidas principales. Los errores aparecen junto al campo y el envío abre el bloque correspondiente. Los errores de datos que dejan de utilizarse se retiran al cambiar de sistema. El recálculo y el guardado de partidas conservan las cantidades y las medidas.

## Recursos y archivos

La ayuda y el aviso de novedades explican la organización nueva. Cargadores, recursos y caché usan `20261016-interfaz-completa`. Se conserva la versión técnica de cálculo `20261012-auditoria`, evitando declarar obsoletas las partidas por un cambio de presentación. Los límites y el orden de los fragmentos HTML y JavaScript se mantienen.

- `ui-a.html`, `ui-b.html`, `ui-c.html`: formularios, resúmenes, errores, ayuda y novedades.
- `app-a1.js`: utilidades compartidas de validación/foco y navegación de Cerámica.
- `app-a2.js`: resúmenes y controles de Trasdosado, Techo y Obra húmeda; acción de guardado configurable en los resultados.
- `app-b.js`: recálculo de Obra húmeda y Cerámica, datos compartidos del adhesivo, retorno al cálculo de materiales y edición de partidas.
- `style.css`: controles táctiles, acción de cálculo y ficha de producto compacta.
- `index.html`, `app.js`, `service-worker.js`, `tests/pwa.test.js`: coherencia de versión y caché.
- `tests/interface-modules.test.js`: 28 casos nuevos de interacción, incluyendo los siete sistemas de techo.

No se modifican el modelo de almacenamiento, las obras anteriores, las tarifas por proveedor, las copias JSON ni la función central de totales. Se mantienen los 110 identificadores, tipos y formularios de los controles anteriores. Las referencias ARIA son válidas y no hay IDs HTML duplicados.

## Comprobaciones ejecutadas

Los cuatro bloques de `.github/workflows/ci.yml` se ejecutan localmente con éxito. Se han ejecutado individualmente las ocho suites: **181 casos correctos**. Cubren también beneficio industrial, descuentos, IVA, exportaciones, precios/proveedores, compatibilidad y caché.

Se comparan todas las líneas de materiales con la copia anterior a esta ampliación en **76 configuraciones**: 9 de trasdosado, 14 de techo, los 29 productos de obra húmeda y 24 combinaciones de cerámica. Todas coinciden. Para productos sin dimensiones verificadas, la comparación utiliza dimensiones explícitas de prueba en ambas versiones; no las incorpora al catálogo ni las presenta como datos documentados.

Resultados: [validación completa](interfaz-modulos-validacion.json), [salida de las comprobaciones](interfaz-modulos-validacion.txt) y [comparación de materiales](interfaz-modulos-comparacion.json).

Las interacciones se prueban ejecutando los fragmentos reales con un DOM simulado. Chromium con Playwright se ha intentado iniciar, pero termina con `setsockopt: Operation not permitted` y `SIGTRAP`. Quedan pendientes la revisión visual, el teclado en Android real, la impresión y el ciclo real de instalación/actualización de la PWA. El CI y la verificación de los recursos publicados se ejecutan en GitHub Actions al actualizar `main`; este informe registra las comprobaciones locales anteriores. Los pendientes técnicos de la auditoría anterior se conservan.
