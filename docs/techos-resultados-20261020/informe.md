# Corrección de los resultados incompletos de techo

Base comprobada: `f245e97c9c3731a6ec75a27ae95a804d66ee435c` en `main`.
Recursos preparados: `20261020-techos-visibles`. Cálculo conservado: `20261019-techos`.
Publicación autorizada por el propietario. Este informe recoge la validación previa; el resultado de publicación se comprueba en GitHub Actions y en los recursos desplegados.

## Incidencia reproducida

La captura del propietario muestra 7,26 m², siete placas BA15 de 2000 × 1200, cuatro barras de ángulo, 26 fijaciones de perímetro y 11 m de banda.

El caso 3,30 × 2,20 m, TC47 simple, dos placas de 15 mm y merma del 8 % reproduce esas mismas líneas y cantidades. Esto reproduce el resultado visible; no confirma que esas sean todas las medidas e intenciones del propietario.

El catálogo no contiene peso automático de referencia para dos placas BA15. El cálculo deja pendientes perfiles y suspensiones hasta introducir el peso del conjunto. La función de presentación clasificaba las filas «No dimensionados» como detalle técnico y las ocultaba del resumen. Un aviso genérico no explicaba al usuario por qué habían desaparecido los materiales.

La tabla consultada es D11.es, edición 10/2025, página 6, comprobada de nuevo el 20/10/2026: [documento del fabricante](https://knauf.com/api/download-center/v1/assets/59ac9b50-6faa-47a7-b13a-6a01035b2e1e?country=es&download=true). No se ha añadido un peso no documentado de dos placas BA15 ni extrapolado el de otra estructura.

## Cambios aplicados

- Los resultados de techo muestran las filas sin dimensionar en la lista principal, con el motivo. El encabezado indica «Despiece incompleto».
- El resultado incluye el número de placas y su espesor. La ayuda junto al selector aclara que «TC47 simple» describe la estructura y no decide el número de placas.
- Cuando falta el peso para una combinación, el resumen de carga y el campo explican la ausencia. Pulsar «Ver materiales del techo» abre el bloque de carga y enfoca el campo. También existe un botón directo en el resultado.
- Botones equivalentes llevan a los datos pendientes de varilla, pasta, sierra o escayola. Las configuraciones fuera de tabla mantienen visibles sus limitaciones.
- El botón de guardado identifica el despiece incompleto. Se mantienen las filas pendientes, las cantidades y la condición provisional en obras y exportaciones.
- Cambiar a una configuración con referencia disponible o a otro sistema retira el error de peso que ya no corresponde.
- Ayuda, aviso de novedades y recursos PWA actualizados. No se cambia la versión de cálculo porque no se han modificado rendimientos ni cantidades.

## Verificación

Los cuatro bloques de CI pasan localmente. La comprobación final pasa **243 pruebas en diez archivos**, incluidas 13 nuevas que reproducen la captura, comprueban contenido visible antes del desplegable, foco y apertura de controles, recálculo al completar datos, cambio de sistema, conservación del presupuesto provisional y la configuración confirmada de una sola placa de 15 mm.

Para probar el flujo se utiliza un peso manual de 25 kg/m²: es un dato sintético de prueba, no una recomendación ni el peso atribuido a un producto. Al introducirlo se comprueba la aparición de perfiles y suspensiones. Varilla y pasta siguen identificadas como pendientes hasta completar sus propios datos.

Evidencias: [validacion.json](validacion.json) y [validacion.txt](validacion.txt).

No se ha ejecutado una comprobación visual en Android ni en navegador: el entorno bloquea el servidor local (`listen EPERM 127.0.0.1`). Las pruebas de interfaz ejecutan los fragmentos reales con controles simulados; no sustituyen una revisión visual.

## Configuración confirmada por el propietario

Tras preguntar si debía llevar una o dos placas, el propietario respondió «Simple». Se interpreta como TC47 simple con una sola placa de 15 mm. En el caso reproducido de 7,26 m², formato 2000 × 1200 y merma del 8 %, la compra es de cuatro placas. Esa variante dispone de peso de referencia y muestra perfiles y cuelgues sin exigir un peso manual. No se altera automáticamente el número de placas de otras obras o configuraciones guardadas.

La corrección de presentación no permite afirmar que el dimensionado de otras combinaciones sin peso esté resuelto: en ellas sigue siendo necesario el dato del sistema real. Varilla y pasta también conservan sus requisitos de entrada.
