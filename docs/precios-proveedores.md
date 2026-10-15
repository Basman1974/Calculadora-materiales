# Precios por proveedor y ayuda ampliada

Actualización preparada el 15 de octubre de 2026 en el repositorio existente. Este informe describe la implementación y la verificación previas a la publicación, incluyendo las correcciones de la auditoría anterior.

## Funcionamiento

- «Precios y proveedores» está disponible desde Presupuesto y desde Más. Los materiales de las partidas se registran con su nombre y unidad; los formatos identificables se distinguen. Baldosas de distintos formatos, bandas para perfiles distintos y calzos de distinta junta no comparten precio por tener un nombre genérico.
- «Tarifa general» conserva los precios anteriores cuando se conoce su unidad. Si no puede determinarse de manera inequívoca, el precio queda conservado en un apartado pendiente de completar. No se adivinan equivalencias por semejanza de nombres.
- Cada proveedor puede tener un precio por material/unidad, referencia y fecha. El catálogo compara precios netos del mismo material; la referencia debe corresponder al producto real que se quiere utilizar.
- Escribir un precio en Presupuesto lo guarda durante la entrada, actualiza importes y conserva el campo para continuar escribiendo. El guardado abarca tanto la tarifa del proveedor de esa línea como el precio de la obra. Vaciar una línea la deja pendiente, conservando la tarifa disponible para otras ocasiones; 0 es un precio explícito válido.
- El proveedor inicial se elige para los materiales nuevos. Cambiarlo no modifica las líneas existentes. En una línea, seleccionar un proveedor con tarifa aplica su precio; si no tiene tarifa, la línea queda pendiente de valorar.
- «Actualizar con tarifa actual» respeta por defecto el proveedor de cada línea. Un selector permite proponer un proveedor único para toda la obra. Prepara una comparación y calcula el total propuesto con la misma función de totales que usa el presupuesto. Las líneas sin tarifa conservan su precio. Solo se aplican los cambios tras pulsar el botón de la propuesta. Si entretanto cambia la obra o el catálogo, la propuesta se renueva antes de permitir aplicarla.
- Una obra guardada conserva sus precios, proveedor, referencia y fecha. Actualizar o quitar una tarifa no recalcula las copias. Una copia antigua sin precios no hereda silenciosamente los actuales.

## Unidades e IVA

El precio corresponde a la unidad principal de la línea: ud, saco, barra, rollo, caja, panel, envase, bote, m, m², kg o L. No se convierten automáticamente paquetes, longitudes o masas: un precio por envase de 5 kg se introduce por envase, mientras que una línea expresada en kg requiere €/kg.

La tarifa se guarda sin IVA. Si el precio facilitado lo incluye, se marca y se introduce su porcentaje explícitamente. Se conserva el importe de origen y el neto sin redondear prematuramente el precio unitario. El IVA del presupuesto se calcula al final, evitando sumarlo dos veces.

## Importación y exportación

Cabecera recomendada:

```csv
material;unidad;precio;proveedor;referencia;fecha;iva_incluido;iva
```

También se admiten `concepto;precio` y `material;unidad;precio`, con o sin cabecera. Un proveedor omitido usa la selección de importación. Una unidad omitida solo se asigna si ya existe una única unidad para ese nombre en el catálogo. La fecha acepta AAAA-MM-DD y DD/MM/AAAA. La coma y el punto decimales están admitidos, al igual que campos entrecomillados. No se aceptan símbolos de moneda ni separadores de miles en el precio.

Las filas sin precio se omiten; el valor 0 se conserva. Un error de formato, precio, fecha, IVA o una duplicidad rechaza el archivo completo antes de guardar. El número de fila ayuda a localizar el problema. Importar actualiza el catálogo; aplicar los precios a una obra sigue requiriendo revisión.

Se puede descargar una plantilla de los materiales registrados y exportar las tarifas normalizadas a CSV. El CSV destinado a una hoja de cálculo protege textos que podrían interpretarse como fórmulas. El JSON conserva el estado completo, incluidas las obras y sus precios históricos.

## Persistencia y compatibilidad

Se utiliza una nueva clave local, `calculadora-tarifas-v1`, con catálogo y precios activos separados dentro de un único registro. Una escritura de ese registro guarda ambos de forma conjunta. Las claves anteriores de obras, empresa, cliente y precios se mantienen para su compatibilidad.

Las copias descargadas pasan a formato 2 e incluyen `priceCatalog`, `jobPricing` y la configuración de precios de cada obra guardada. Se restauran también las copias de formato 1. Antes de sustituir los datos se valida su contenido y se pide confirmación. Si una escritura falla, se intenta revertir la restauración antes de alterar el estado en memoria. Un catálogo que no puede validarse no se sobrescribe automáticamente; su contenido original se adjunta, cuando se puede leer, a una copia de recuperación descargada.

El funcionamiento es local y sin conexión. No hay sincronización entre dispositivos ni descarga automática de precios comerciales. Limpiar datos del navegador puede borrar el catálogo: conviene conservar una copia JSON fuera de él.

## Ayuda y PWA

La ayuda ahora explica el recorrido completo, proveedores, tarifas, IVA, formatos CSV, actualización con propuesta, obras guardadas, recuperación y uso sin conexión. Se han retirado instrucciones antiguas que contradicen la auditoría: guardavivos automáticos, un límite de estopa presentado como verificado y consumos de bloque tratados como documentados. Se explica también la merma de mortero independiente y el carácter orientativo de los cálculos pendientes de validación.

Los cargadores, recursos, caché y aviso de novedades usan `20261015-precios-proveedores`. Se conserva la versión de cálculo de la auditoría `20261012-auditoria`: añadir tarifas no vuelve obsoletas todas las partidas revisadas. Los archivos necesarios para la nueva ayuda y precios ya forman parte de la precarga PWA existente.

## Archivos

- `app-a1.js`: identidad de materiales, catálogo, migración, guardado, validaciones y propuestas calculadas con los totales centrales.
- `app-a2.js`: registro de precios al añadir o actualizar una partida.
- `app-b.js`: formularios, guardado durante la entrada, comparación, aplicación de tarifas, copias e importación/exportación.
- `ui-c.html`: pantalla de precios, controles de presupuesto y ayuda ampliada.
- `style.css`: presentación de tarifas y controles para móvil.
- `index.html`, `app.js`, `ui-a.html`, `service-worker.js`: versionado y novedades.
- `.github/workflows/ci.yml`, `tests/material-fixture.cjs`, `tests/prices.test.js`, `tests/pwa.test.js`: comprobaciones y pruebas.

Los fragmentos HTML/JavaScript conservan sus límites y orden. No se añaden dependencias, servidor ni servicios externos.

## Verificación y límites

El resultado exacto de las pruebas está en [precios-proveedores-validacion.json](precios-proveedores-validacion.json) y su salida en [precios-proveedores-validacion.txt](precios-proveedores-validacion.txt). Se ejecutan los bloques de comprobación del CI existente localmente y los casos individuales de todas las suites.

Chromium se ha intentado ejecutar, pero el entorno lo cierra con `setsockopt: Operation not permitted`. No se afirma haber probado visualmente el diseño móvil, la impresión real, la instalación ni la actualización en Android. Los formularios se comprueban ejecutando el código real con un DOM simulado; las pruebas no sustituyen un navegador.

Los resultados de este informe corresponden a comprobaciones locales anteriores a la publicación. El CI y la comprobación de los recursos publicados se ejecutan en GitHub Actions al actualizar `main`. Los pendientes técnicos de la auditoría, incluidos sistemas constructivos sin validación completa e iconos instalables, siguen vigentes y no forman parte de una certificación de esta función.
