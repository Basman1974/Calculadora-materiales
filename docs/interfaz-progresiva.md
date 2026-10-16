# Formularios progresivos: Tabique y Presupuesto

Informe de preparación del 15 de octubre de 2026 sobre producción `b33f1fcb68cc4dec822aca084db0bb2368001ccd`. Describe la primera fase y sus comprobaciones locales previas a la publicación.

## Cambios para el usuario

- Tabique presenta medidas y plantillas primero. El resumen mantiene visibles las placas por cara, tipo y espesor, perfil solicitado, separación, lana y lámina, aunque se plieguen los ajustes. Huecos, aristas y mano de obra tienen bloques propios con sus valores resumidos.
- Los avisos de altura permanecen fuera de los controles plegados. Si la comprobación existente propone una estructura distinta de la solicitada, el aviso la identifica; las condiciones técnicas se conservan.
- Se admiten las medidas con coma o punto. Los errores aparecen junto al campo. Al enviar, se abre el bloque que contiene el primer error y se enfoca el control; con datos válidos, el botón lleva a los materiales. En móvil, la acción utiliza posición adhesiva mientras el formulario no tiene el foco.
- Presupuesto muestra total, estado provisional y materiales pendientes al principio. Las filas se presentan como tarjetas en pantallas de hasta 600 px, con cantidad, unidad de precio e importe. El proveedor sigue visible en el resumen de cada línea, con los controles de tarifa desplegables.
- «Valorar pendientes» lleva al primer precio pendiente o al primer error. Intro en un precio lleva al siguiente pendiente, con retorno al principio si hace falta. El precio 0 sigue siendo válido. Los errores conservan el último importe válido y bloquean exportar.
- El recálculo de beneficio, descuento y extras y el cambio de proveedor actualizan los importes sin reconstruir los campos de los materiales. Se conservan el texto decimal y los errores pendientes de otras líneas. Volver del catálogo recupera la línea consultada sin aplicar automáticamente otra tarifa.
- IVA, beneficio, descuento y extras están agrupados con resumen. La actualización conjunta e importación de tarifas tienen otro bloque. PDF, CSV, WhatsApp y Compartir permanecen disponibles después del desglose. La vista «Solo materiales» oculta también el nuevo resumen económico superior.
- Ayuda y aviso de novedades explican esta organización. Cargadores, CSS, JavaScript, aviso y caché usan `20261015-interfaz-progresiva`; se conserva la versión técnica de cálculo `20261012-auditoria`.

## Compatibilidad y alcance

No cambian el modelo de obras, el catálogo de proveedores, el formato JSON ni la función central de totales. Los 110 controles anteriores mantienen identificador, tipo y pertenencia a formulario. Se han comparado siete configuraciones de Tabique con la versión publicada: todas sus líneas de materiales coinciden exactamente.

Una selección de lámina incompatible se desactiva antes de validar, evitando que un error de merma de una lámina retirada bloquee un control oculto. Las plantillas también actualizan el borrador de medidas.

Trasdosado, Techo, Obra húmeda y Cerámica mantienen su organización. Los pendientes técnicos de la auditoría y de instalación PWA siguen documentados en sus informes anteriores.

## Archivos y comprobaciones

- `ui-a.html`, `ui-c.html`, `style.css`: organización, formularios, tarjetas, accesibilidad, ayuda y novedades.
- `app-a1.js`, `app-a2.js`, `app-b.js`: resúmenes, errores, foco, valoración y actualización de importes.
- `index.html`, `app.js`, `service-worker.js`: versión de recursos y caché.
- `tests/interface.test.js`: 15 casos nuevos de interacción. `tests/pwa.test.js`: coherencia de versiones y caché. Las fixtures y las comprobaciones de presupuesto se adaptan a la actualización de nodos del DOM sin reconstruir toda la pantalla.

Se han ejecutado localmente los cuatro bloques de comprobación de `.github/workflows/ci.yml` y los 153 casos individuales de las siete suites: todos correctos. Resultados en [interfaz-progresiva-validacion.json](interfaz-progresiva-validacion.json) y [salida de las comprobaciones](interfaz-progresiva-validacion.txt).

Los flujos se prueban ejecutando los fragmentos reales con un DOM simulado. Se ha intentado iniciar Chromium con Playwright, pero el proceso se cierra al arrancar. Quedan pendientes la revisión visual móvil, el teclado Android, la impresión real y la instalación/actualización en un dispositivo. No se afirma haber realizado esas pruebas ni haber ejecutado un CI remoto para esta actualización.
