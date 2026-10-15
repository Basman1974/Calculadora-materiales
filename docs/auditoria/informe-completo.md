# Auditoría de Calculadora Construcción

Fecha: 12 de octubre de 2026. Repositorio: [Basman1974/Calculadora-materiales](https://github.com/Basman1974/Calculadora-materiales). Base examinada: `cdc20a230cf8b925ea7963ba128e247316614d99`, confirmada de nuevo al terminar la revisión. Existen commits posteriores al traspaso `c5464d34dd8b150e35ce2ae0f3665ec6737717ca`; se ha trabajado sobre la versión actual, que ya incorpora beneficio industrial. Ningún cambio de esta auditoría se ha publicado.

La revisión cubre el código de todos los módulos, presupuestos, almacenamiento, exportaciones, navegación, CSS, cargadores y service worker. Se han corregido errores reproducibles y registrado los puntos que necesitan documentación o comprobación en dispositivo. **La auditoría no permite certificar todavía todos los sistemas constructivos ni la instalación PWA.**

## Resultado y documentación

La matriz contiene 26 hallazgos: 17 corregidos, 8 mitigados con trabajo pendiente y 1 pendiente. «Corregido» se refiere al fallo descrito, no a la homologación técnica de todo el módulo.

- [Matriz final](hallazgos-finales.json): gravedad, solución, estado y pendientes.
- [Registro de fuentes](fuentes-tecnicas.json): 17 referencias documentales, los 29 productos del catálogo y 15 grupos de parámetros orientativos. Distingue PDF leído, contraste parcial e información sin documento identificado.
- [Validación ejecutada](validacion.json) y [salida de las comprobaciones](validacion.txt).
- [Diferencias del código respecto a producción](cambios.patch).

## Hallazgos y correcciones

| ID | Gravedad | Hallazgo y resultado | Estado |
| --- | --- | --- | --- |
| CAL-01 | Alta | Se pedía precio para «Tipo de baldosa» y «Encolado». El volumen geométrico de mortero y sus sacos podían cobrarse dos veces. Se excluyen las filas informativas y se evita duplicar el mortero, también en obras anteriores. | Corregido |
| CAL-02 | Alta | Se mezclaban materiales con el mismo nombre y distinta unidad. Se separan cantidades y precios por unidad. Los ladrillos nuevos incluyen producto/formato; los formatos distintos identificables de obras anteriores se separan y requieren precios inequívocos. | Corregido |
| CAL-03 | Alta | Una estructura sin dimensionar podía terminar en un «TOTAL» definitivo si todos los otros materiales tenían precio. Pantalla, PDF/impresión, CSV, WhatsApp y Compartir identifican esos presupuestos como provisionales. | Corregido |
| TEC-01 | Media | La agrupación 12,5/15 mm del tabique sí existe en el manual de referencia: no se modifica como si fuera un error. Se explicitan las condiciones de perfil del sistema. Falta cotejar íntegramente las tablas y sus notas, especialmente trasdosados, solapes y configuraciones asimétricas. | Mitigado |
| TEC-02 | Media | Los 5 kg/m² de pasta de agarre están documentados como aproximados en Perlfix K465.es, 09/2025, p. 3. Se mantienen como referencia configurable, sin presentarlos como rendimiento universal exacto. | Corregido |
| TEC-03 | Alta | El registrable 60×120 tenía secundarios de 600 y 1200 invertidos. Se aplica el esquema documentado T24 de referencia: secundario 1200 a 1,67 m/m², sin secundario 600. Placas calculadas con la superficie real, sin redondear primero el rendimiento. | Corregido |
| TEC-04 | Alta | La longitud total de varilla infravaloraba barras cuando no cabían los cortes: 21 suspensiones de 70 cm necesitan 21 barras de 1 m, no 15. Se calcula por cortes; una longitud superior a la barra queda sin dimensionar. El margen de fijación/regulación debe añadirse en el despiece definitivo. | Corregido |
| TEC-05 | Alta | Las crucetas no coincidían con las intersecciones del modelo de perfiles: para 5×4 m son 6×11=66, frente a 43 anteriores. Corregido el cruce geométrico; faltan disposición definitiva, perímetros, anclajes y validación de suspensiones/cargas. | Mitigado |
| TEC-06 | Alta | El techo M70 utilizaba un ratio de barras por m² sin validar luz. Ahora no entrega una cantidad estructural falsa. La escayola conserva su estimación, pero deja de afirmar como comprobadas las reglas NTE/plenum sin fuente. Todos los techos conservan aviso de despiece pendiente. | Mitigado |
| TEC-07 | Alta | SikaTop-50 usaba litros para un consumo de ficha en kg/m². También PTU-20 y Primer Top se convertían a litros pese a comercializarse en kg. Se calculan kg y envases correctos. PLUS MH mantiene envases en L con conversión conservadora explícita mediante el intervalo de densidad documentado. | Corregido |
| TEC-08 | Media | El consumo medio del rango era fijo. Se puede introducir consumo según soporte y, para SikaTop-10, número de capas. El valor inicial medio se identifica como aproximado. | Corregido |
| TEC-09 | Media | Faltaban mínimos y condiciones por capa. Se validan los intervalos documentados y se advierten capas. PRISMA cambia de 1,7 a 1,5 kg/m²/mm según ficha de 12/01/2026; HIDRO PLUS mantiene 1,8 kg/m²/mm (18 por cm). Cal Nature Pro corrige palé a 42 sacos; su unidad de consumo extraída del PDF necesita confirmación visual. | Mitigado |
| TEC-10 | Alta | Ladrillos sin dimensiones heredaban las anteriores; volver al módulo sobrescribía medidas editadas. Corregidos ambos comportamientos. Perforados sin medidas y caravista con orden alto/espesor sin verificar exigen introducir dimensiones, conservando el producto en el selector. | Corregido |
| TEC-11 | Media | Los kg/m² de mortero de bloques no tenían fuente. Ahora son configurables y se identifican como orientativos, sin usar la fórmula de ladrillo. Los datos comerciales de bloques siguen pendientes de documentación. | Mitigado |
| TEC-12 | Media | La merma manual 0 % se elevaba automáticamente según patrón. Ahora se respeta; junta y superficie de tanda no se fuerzan a mínimos ocultos. Cola, coeficiente de junta y clips siguen siendo estimaciones pendientes de producto/sistema. Las cuñas continúan dependiendo de la ejecución simultánea. | Mitigado |
| TEC-13 | Media | Guardavivos presupuestos siempre en dos cantos y jambas a toda altura. Se calculan con longitud de aristas expuestas medida por el usuario, inicialmente 0 m. | Corregido |
| VAL-01 | Alta | Entradas vacías, negativas/no finitas, huecos mayores que el paño y puertas fraccionarias se aceptaban o corregían silenciosamente. Los controles principales validan y retiran «Añadir a Obra» con error. Se limpian errores de campos que pasan a estar ocultos. | Corregido |
| DAT-01 | Alta | Tipos erróneos de localStorage y editores mal formados podían romper la aplicación. Se comprueban estructuras; no se sobrescribe el almacenamiento dañado al arrancar. La restauración rechaza editores/IVA/importes inválidos antes de sustituir datos. | Corregido |
| DAT-02 | Alta | CSV entrecomillado con precio «1,25» podía importarse como 1. Se reconoce el entrecomillado, separadores y comillas escapadas; una tarifa inválida no se importa parcialmente. El CSV exportado protege textos que iniciarían fórmulas y conserva descuentos numéricos. | Corregido |
| UX-01 | Media | Editar/restaurar podía mostrar una tarjeta de sistema distinta al control guardado. Se sincronizan techo, trasdosado y familias; el borrador conserva categoría y cuerpo cerámico. | Corregido |
| PWA-01 | Alta | El logo real es 175×59, pero se declaraba 192×192 y 512×512. El manifiesto ahora declara el archivo real y retira «maskable». **Siguen faltando iconos cuadrados adecuados para validar la instalación.** | Pendiente |
| PWA-02 | Alta | Se cacheaban 404/500, se consultaban otras cachés y un JS ausente podía recibir HTML. Solo se guardan respuestas correctas; se espera la escritura, se usa la caché actual y el fallback HTML se limita a navegación. Un recurso ausente responde 503. | Corregido |
| PWA-03 | Media | Fotografías locales de productos fuera de la precarga. Se incorporan; las imágenes externas de inicio/ladrillos siguen necesitando conexión y no garantizan disponibilidad offline. Los esquemas de montaje locales siguen incluidos. | Mitigado |
| CAL-04 | Media | Pasta y cinta se redondeaban antes de calcular envases. Se conservan cantidades decimales y se redondea la unidad comercial después. | Corregido |
| TEC-14 | Media | Ladrillos/bloques y mortero compartían merma. Se añade merma de mortero independiente y se conserva la merma anterior al editar borradores/partidas antiguas. | Corregido |
| UX-02 | Media | Importes verdes poco legibles en oscuro y precios con altura de 36 px. Se mejora el color de lectura, los precios pasan a 47 px y se ajustan columnas estrechas. Faltan validación visual/lector de pantalla y persistencia de preferencias de apariencia. | Mitigado |

## Validación efectivamente realizada

Se han ejecutado localmente los cuatro bloques `run` de `.github/workflows/ci.yml`: archivos, interfaz/funciones, sintaxis y pruebas. Resultado: todos correctos. La concatenación JavaScript conserva el orden original y las comprobaciones de navegación, formularios, botones y recursos PWA pasan.

Se han ejecutado individualmente **86 casos automatizados**: presupuesto y parsers (22), flujos de guardado/exportación (16), materiales/formularios/navegación (33), PWA (12) y trazabilidad (3). El registro indica la versión concreta de Node utilizada. Las pruebas de interfaz usan DOM simulado y ejecutan los fragmentos reales; no prueban disposición visual, motores CSS ni dispositivos.

Casos de referencia:

| Caso | Resultado comprobado |
| --- | --- |
| Base 1.000 €, beneficio 15 %, IVA 21 %, sin descuento | Beneficio 150 €; total 1.391,50 € |
| Mismo caso con descuento 10 % | Base imponible 1.035 €; total 1.252,35 € |
| Beneficio/descuento con IVA 0, 10 y 21 % | Totales 1.035 €, 1.138,50 € y 1.252,35 € |
| Precio unitario 0,083 € × 1.200 unidades | 99,60 €; precio unitario conservado en exportaciones |
| Ladrillo 33×16,5×4 cm, junta 5 mm, 10 m², sin merma | 17,56 ud/m²; compra 176 unidades; mortero 17,6 L |
| Mismo ladrillo, merma mortero 10 %, piezas 0 % | 176 piezas; 19,3 L de mortero |
| Baldosa 60×60, 36 m², merma 0 %, tanda 5 m² | 100 piezas; 60 cuñas reutilizables |
| SikaTop-10, 100 m², 0,5 kg/m²/capa, 2 capas, merma 0 % | 100 kg; 20 envases de 5 kg |
| SikaTop-50, 100 m², 0,15 kg/m², merma 0 % | 15 kg; 3 envases de 5 kg |
| PRISMA, 10 m², 20 mm, merma 0 % | 300 kg; 12 sacos de 25 kg; aviso de capas |
| T24 60×120, 36 m², merma 0 % | 50 placas; sin secundario de 600; cantidades de perfil orientativas del sistema de referencia |
| 21 suspensiones, cortes de 70 cm, barras de 1 m | 21 barras; margen de montaje pendiente |

También se prueban restauración de copias anteriores, recargo inicialmente 0 %, presupuesto sin precio, precio explícito 0, nueva obra, duplicación/eliminación/deshacer, «Añadir a Obra», formato/unidad separados, informes provisionales con todos los precios completos y sincronización al editar.

PDF se ha comprobado como HTML generado y llamada a impresión. WhatsApp como texto/URL preparado; Compartir como llamada al mecanismo de compartir simulado. No se han enviado mensajes ni generado un PDF mediante un navegador real.

## Compatibilidad y comportamiento de la actualización

Las claves de almacenamiento y el formato de copia JSON siguen en versión 1. Las obras anteriores se cargan sin recalcular silenciosamente sus cantidades ni sustituir sus precios. El beneficio industrial se conserva y sigue usando una única función de totales.

Las partidas antiguas afectadas por correcciones de techo, puentes, PRISMA, caravista o guardavivos requieren revisión y producen presupuesto provisional. Si no contienen medidas guardadas, se conserva la posibilidad de duplicarlas, pero su actualización técnica requiere un cálculo nuevo. No se infiere un precio cuando un nombre antiguo se usó para unidades o formatos distintos.

Los cálculos nuevos guardan la versión `20261012-auditoria`. Cargadores, URLs de recursos, service worker y aviso de novedades utilizan esa misma versión. La precarga debe completarse antes de activar el worker; se mantiene protección de cachés de otras aplicaciones. Las pruebas simulan instalación correcta/incompleta, errores HTTP y recuperación offline. No se ha ejecutado un cambio de versión en una PWA instalada en Android.

## Pendientes técnicos prioritarios

1. Identificar sistemas exactos de techo y completar luz/cargas, suspensiones, perimetrales, anclajes, longitud comercial y margen de varilla. Los resultados actuales son despieces provisionales; el autoportante no entrega montantes sin tabla aplicable.
2. Cotejar íntegramente alturas y notas de tabiques/trasdosados, perfiles de 0,60 mm/inercia, solapes, refuerzos de huecos, tornillos por uso/capa y compatibilidad de lana con la cámara omega. No se garantiza una estructura genérica porque una altura aparezca en una tabla de otro sistema.
3. Documentar unidades/pesos comerciales de bloques y ladrillos, kg/m² de mortero de bloque, rendimiento L/saco y dosificación del mortero hecho en obra. El cálculo geométrico de juntas no incorpora relleno de perforaciones ni singularidades del soporte.
4. Confirmar visualmente la unidad de consumo de Cal Nature Pro; completar restricciones de soportes y acabados de todos los revestimientos. Un intervalo de espesor no demuestra compatibilidad del producto con cualquier soporte.
5. Elegir adhesivo, rejuntado y nivelación concretos: consumo por llana/encolado, coeficiente de junta, disposición de clips y compatibilidad de soportes. No se han transformado reglas orientativas en exigencias UNE ni en prestaciones certificadas.
6. Preparar iconos instalables adecuados y probar instalación/actualización/offline en Android real, además de vista móvil, teclado, foco, alto contraste y tamaños de texto. Las preferencias de apariencia siguen sin persistencia.

## Límites de esta comprobación

El navegador de Playwright no está disponible en el entorno usado. Por ello no se afirma haber probado diseño móvil, impresión real, instalación Android ni transición real entre service workers. Las comprobaciones se han ejecutado localmente con Node 24; GitHub Actions utiliza Node 20 y deberá ejecutar los cambios cuando se autorice su publicación. No se ha lanzado una ejecución remota de esta auditoría ni alterado el despliegue existente.

El registro documental marca expresamente los PDFs grandes que solo se han podido contrastar mediante extractos indexados y las tablas sin cotejo completo. Los 17 documentos no equivalen a 17 consumos universales certificados. Se conservan parámetros orientativos pendientes en lugar de inventar sustitutos.

## Archivos modificados

- Cálculo, datos y presupuestos: `app-a1.js`, `app-a2.js`, `app-b.js`, `data.js`.
- Formularios, legibilidad y novedades: `ui-a.html`, `ui-b.html`, `style.css`.
- Versionado y PWA: `index.html`, `app.js`, `ui-c.html`, `manifest.json`, `service-worker.js`.
- Pruebas: tres archivos existentes ampliados, `tests/material-fixture.cjs`, `tests/materials.test.js`, `tests/sources.test.js`; se actualiza el nombre de su paso en `.github/workflows/ci.yml`.
- Auditoría: este informe, matrices inicial/final, fuentes, validación, inventario de cambios y parche para revisión.

Los límites de los fragmentos y su orden permanecen intactos. No se añaden frameworks, monetización, otra plataforma, código postal, geolocalización ni integración comercial eliminada.
