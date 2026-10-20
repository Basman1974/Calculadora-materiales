# Corrección de techos y actualización de morteros de cal

Versión de recursos y cálculo: `20261019-techos`. Comprobaciones finales: 20 de octubre de 2026.

Base de publicación comprobada: `f0f2b29bc7a31c11f3f91c11489e1ffa480dc94f`, rama `main` del repositorio `Basman1974/Calculadora-materiales`.

## Cambios

- Se incluyen perfiles perimetrales, compra por barras y fijaciones por tramo. Los techos de PYL incluyen banda acústica cuando corresponde.
- En TC47 simple y doble, se cuentan suspensiones por recorridos y separación máxima de la configuración de carga de referencia. Se añaden apoyos en juntas cortas, empalmes y cruces del despiece. Se incluyen cuelgue, anclaje universal y fijaciones al forjado del montaje de referencia.
- Las varillas se compran según los cortes posibles en la longitud comercial introducida. Es obligatorio indicar el margen de fijación y regulación para obtener una cantidad; cero es una elección explícita.
- Tornillos por capa y espesor, cinta por longitud de juntas y perímetro y pasta del conjunto. No se reutiliza el consumo de tornillos de pared. Los consumos orientativos se identifican y se pueden configurar.
- En T24 se cuentan recorridos, bordes y suspensiones de un replanteo centrado. Se elimina la duplicidad de un cuelgue completo y otra fila genérica de varilla o cuelgue.
- Sierra mantiene cantidades de plano configurables y los accesorios pendientes de definir. Canal y montante conserva el dimensionado pendiente de tabla y no incorpora suspensiones. Escayola requiere los puntos por pieza y consumos del producto: se eliminan los coeficientes generales sin respaldo y el umbral histórico de 25 cm.
- Las obras antiguas mantienen cantidades y precios. Se identifican las partidas de techo pendientes de revisar. Al editar una partida antigua sin espesor se recuperan los 15 mm que asumía el cálculo anterior; los campos nuevos no heredan valores de otro techo.
- Cal Nature Pro pasa de 1,9 a **1,8 kg/m²/mm** según confirmación del propietario. Cal Revoco conserva **1,4 kg/m²/mm**, máximo recomendado **9 mm**. La documentación diferencia esta confirmación de las fichas del fabricante.
- Ayuda ampliada, aviso de novedades y versión de caché PWA renovada. Se mantiene el orden de los fragmentos HTML y JavaScript.

## Casos de control

Paño de 5 × 4 m, placa normal de 2 × 1,2 m y espesor 12,5 mm, sin carga adicional, referencia F47/17 y encuentro no portante:

| Configuración | Suspensiones |
| --- | ---: |
| Simple, una placa | 45 |
| Simple, dos placas | 54 |
| Doble, una placa | 42 |
| Doble, dos placas | 48 |

Perímetro de ese paño: 18 m, seis barras de 3 m y 38 fijaciones del perimetral. Estas cifras corresponden a las condiciones anteriores, no a cualquier techo de 20 m². Con dos placas, un paño de 10 × 2 m devuelve 55 suspensiones en simple y 56 en doble.

T24 de 6 × 6 m: diez barras primarias de 3,6 m, 54 secundarios de 1,2 m y 30 conjuntos de suspensión. En 60 × 60 se añaden 40 secundarios de 600 mm; en 60 × 120 no se añaden.

## Límites técnicos

Todos los despieces de techo siguen siendo provisionales hasta verificar componentes, soporte, cargas, anclajes y replanteo reales. La referencia F47/17 no valida una perfilería genérica, una solución RF ni cargas superiores a las tablas incorporadas. Para pesos sin referencia disponible se exige dato del conjunto.

La compra de placas por superficie y merma necesita comprobar los recortes. Los huecos no tienen posición en el formulario: descuentan superficie de placas, pero no reducen estructura, tornillos ni longitud de juntas; sus recercados quedan pendientes. Equipos y luminarias requieren refuerzos propios. El paso adoptado para tornillos de placa de 600 mm es orientativo y queda pendiente de la ficha del producto.

Las fuentes y condiciones están registradas en [fuentes.json](fuentes.json). La auditoría anterior es evidencia histórica de los errores encontrados, no una descripción del código corregido.

## Verificación ejecutada

- Los cuatro bloques de comprobación de `.github/workflows/ci.yml` pasan localmente: archivos, interfaz y enlaces de navegación/formularios, sintaxis de JavaScript concatenado y pruebas.
- **230 pruebas pasan en los nueve archivos**, incluidas 39 específicas de techos. Se comprueban casos numéricos, separaciones y bordes, datos inválidos, partidas antiguas, guardado, copia y restauración, PDF de impresión, CSV, WhatsApp y compartir.
- Las pruebas PWA comprueban instalación de caché, activación, recursos y respuesta sin conexión mediante simulación. No equivalen a una instalación en un teléfono real.
- Revisión de diferencias con la base remota: no hay eliminaciones de archivos. Los cambios de ejecución se limitan a los cálculos indicados, compatibilidad de datos, controles, ayuda y versión de recursos.
- Entorno local: Node 24.19.0. El flujo de GitHub utiliza Node 20; su resultado se comprueba después de publicar.

Evidencias: [validacion.json](validacion.json) y [validacion.txt](validacion.txt).

**Pendiente de comprobación manual:** aspecto visual en móvil, instalación y actualización en Android real. El entorno bloqueó la apertura del servidor local con `listen EPERM`; no se afirma haber ejecutado esas pruebas de navegador.
