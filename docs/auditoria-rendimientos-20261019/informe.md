# Auditoría de rendimientos — 19 de octubre de 2026

> Corrección posterior de techos: véase el [informe de cambios y pruebas](../techos-20261019/informe.md). Las cifras y observaciones de esta auditoría corresponden a la versión anterior y se conservan como evidencia histórica.

> Actualización posterior: el propietario ha confirmado los consumos de Cal Nature Pro y Cal Revoco. Véase [aclaración y corrección aplicada](aclaracion-morteros-cal.md). Este informe y sus casos conservan el diagnóstico de la versión auditada; sus conclusiones sobre estos dos datos deben leerse con esa aclaración.

**Conclusión: la calculadora funciona como estimador, pero todavía no permite dar por completo y técnicamente validado el pedido de materiales de todos sus sistemas. La prioridad es corregir el despiece de los techos.** Hay omisiones demostradas, consumos documentados bajo condiciones concretas y otros coeficientes sin justificar. No son situaciones equivalentes.

Repositorio: [Basman1974/Calculadora-materiales](https://github.com/Basman1974/Calculadora-materiales). Versión examinada de `main`: [`f0f2b29bc7a31c11f3f91c11489e1ffa480dc94f`](https://github.com/Basman1974/Calculadora-materiales/commit/f0f2b29bc7a31c11f3f91c11489e1ffa480dc94f), posterior al commit de traspaso `c5464d3`. Se cotejaron los 84 archivos del árbol remoto con sus huellas Git locales. Recursos `20261016-interfaz-completa`; cálculos identificados en la aplicación como `20261012-auditoria`.

Se han revisado fórmulas, unidades, redondeos, materiales auxiliares y documentación de tabiques, tres trasdosados, siete techos, las cuatro familias de obra húmeda —29 productos— y cerámica, además del traslado al presupuesto. Esta auditoría cubre el código actual; no certifica soluciones constructivas ni sustituye un dimensionado de obra.

**No se ha modificado el código de la aplicación ni publicado una actualización.** Los archivos nuevos de esta carpeta contienen exclusivamente el informe, sus fuentes y las reproducciones.

## 1. Techo simple, doble y resto de techos

### Problemas confirmados por ejecución

Caso común: estancia 5 × 4 m, 20 m² brutos y netos, plenum 30 cm, dos placas y merma de placas 8 %.

| Sistema | Suspensiones que devuelve la aplicación | Encuentro perimetral en el resultado |
|---|---:|---|
| TC47 simple | 17 horquillas | Omitido |
| Doble TC47 | 21 horquillas | Omitido |
| Sierra | 22 suspensiones | Omitido |
| Canal + M70 | No utiliza suspensiones | Canal R70; montantes pendientes de dimensionar |
| Registrable 60 × 60 | 14 cuelgues | Ángulo T24: 6 barras de 3 m |
| Registrable 60 × 120 | 14 cuelgues | Ángulo T24: 6 barras de 3 m |
| Escayola | 60 puntos de estopa orientativos | No modela el detalle del encuentro |

**R01 — Prioridad alta. Perimetral omitido.** En simple, doble y sierra no existe fila de perfil perimetral ni un control que defina el tipo de encuentro. Si el montaje elegido lleva perfil en los cuatro lados, en este ejemplo faltan **18 m lineales**: seis barras de 3 m como mínimo geométrico, antes de considerar cortes y desperdicio. La pieza debe corresponder al sistema seleccionado; no procede imponer el mismo ángulo a cualquier solución.

**R02 — Prioridad crítica. Horquillas calculadas sin disposición ni carga.** El simple usa `ceil(superficie / 1,2)`; el doble `ceil(superficie / 0,99)`; sierra `ceil(superficie / 0,95)`. Son divisores de superficie, no comprobaciones de separaciones. Las horquillas del simple y doble no cambian al pasar de una placa a dos. Una estancia 10 × 2 m devuelve también 17 en simple, aunque cambia la disposición de perfiles. La invariancia no demuestra por sí sola un fallo en cada obra; demuestra que el algoritmo no verifica esos factores.

Contraste documental: [Knauf D11.es, edición 10/2025](https://knauf.com/api/download-center/v1/assets/59ac9b50-6faa-47a7-b13a-6a01035b2e1e?country=es&download=true), pp. 5 y 7: en la variante F47/17 simple, con secundarios a 500 mm y carga hasta 0,15 kN/m², la separación máxima entre cuelgues es 1.200 mm. La densidad interior ideal asociada es `1/(0,5×1,2) = 1,67 ud/m²`, antes del tratamiento de bordes. El código utiliza aproximadamente 0,83 ud/m². Esta comparación confirma que ese ratio no representa aquella disposición. No establece un nuevo coeficiente universal ni una cantidad exacta para la estancia: faltan variante, carga, bordes y capacidad del cuelgue.

**R03 — Prioridad alta. Fijaciones y banda incompletas.** No hay filas explícitas de anclajes al forjado, fijaciones del perimetral o banda acústica para los techos PYL. Sus cantidades tampoco se incorporan al pulsar «Añadir a obra». La fila genérica de tornillos metal-metal no sustituye esos componentes. En registrables falta concretar las fijaciones al soporte y perimetral; «Cuelgues» y «Varilla o cuelgue» deben definirse como componentes distintos para evitar compras o valoraciones duplicadas.

**R04 — Prioridad alta. Placas, cargas y tornillos del techo.** La selección ofrece formatos y tipos, pero no el espesor de placa ni la carga adicional. Los tornillos se obtienen con la misma función por m² que en paredes, con un espesor interno predeterminado de 15 mm. No existe comprobación del patrón de fijación del sistema de techo. La elección RF no acredita resistencia al fuego.

**R05 — Prioridad alta. Sierra sin unidad comercial definida.** Se calculan `ceil(superficie/2,7)` «barras» de perfil sierra, sin longitud de barra ni distribución de primarios. No se puede verificar la compra con esa información.

**R06 — Prioridad media. Registrables: ratios respaldados, despiece limitado.** Los coeficientes T24 coinciden con los consumos medios de la [guía Rockfon System T24 A/E, pp. 3–5](https://www.rockfon.es/siteassets/commerce/es/grids/documents/documentation/gu%C3%ADas-de-instalaci%C3%B3n/es-installation-guide-rockfon-system-t24-a-click-51_d_10_2023.pdf). Eso respalda esa referencia concreta, no todos los sistemas llamados T24. Faltan distribución de bordes, recortes y refuerzos por luminarias o equipos. La superficie sola no resuelve estos detalles.

**R07 — Prioridad alta, limitación reconocida. Canal + montante pendiente.** Es correcto que no invente montantes ni suspensiones. El techo autoportante continúa incompleto hasta incorporar una tabla de luces, cargas y configuración del sistema compatible. El canal genérico de todo el perímetro tampoco define los apoyos portantes.

**R08 — Prioridad alta, pendiente documental. Escayola.** No se ha identificado una ficha primaria que justifique conjuntamente 3 puntos/m², 0,22 kg/m² de estopa y 6 kg/m² de pasta para la placa y el montaje seleccionados. No se declara que estos tres valores sean necesariamente falsos; no están acreditados. El número de puntos necesita relacionarse con los anclajes de cada placa y el montaje admisible.

Las varillas de 1 m aprovechan cortes según el plenum: 21 suspensiones de 30 cm generan 7 barras y de 70 cm, 21. **Falta un margen configurable de montaje y regulación**: a 20 cm el modelo supone cinco cortes exactos, sin longitud adicional. Los plenums superiores a 1 m se dejan correctamente sin dimensionar. Los empalmes y barras se cuentan por recorrido, sin optimizar sobrantes entre recorridos; es una estimación de compra conservadora, no un error demostrado por sí mismo.

## 2. Tabiques y trasdosados

**R09 — Prioridad alta. Tornillos independientes de la modulación.** Para un tabique 4 × 2,5 m, 1+1, se obtienen 8 montantes a 600 mm y 11 a 400 mm, pero **330 tornillos placa-metal en ambos casos**. El modelo usa 15 ud/m² en cara vista y 8 en primera capa de doble placa, más 10 %. No cuenta líneas de fijación, bordes, orientación ni longitud de juntas. Los metal-metal siguen 3 ud/m² de pared y 5 de techo. Son estimaciones, no un despiece contrastado de un sistema.

**R10 — Prioridad media. Tratamiento de juntas genérico.** Se aplica cinta 1,6 m/m² a cada capa y pasta 0,20/0,40 kg/m², con 10 % adicional. No se deriva de la geometría, tipo de borde, acabado o producto. La cinta en capas interiores depende de las prescripciones del sistema; no debe añadirse siempre por una regla comercial común.

**R11 — Prioridad media. Aislamiento condicionado al montaje.** La superficie neta más 8 % tiene una interpretación clara de merma, pero el panel 1.200 × 600 mm y el espesor deducido del perfil no definen un producto universal. En semidirecto se ofrecen 40 mm de lana sin definir la profundidad efectiva de la omega ni comprobar su encaje. No se acreditan prestaciones acústicas o térmicas.

**R12 — Prioridad alta. Huecos y fijaciones incompletos.** Puertas y ventanas tienen dimensiones fijas de 0,80 × 2,10 y 1,20 × 1,20 m. Se añaden dos montantes por hueco, pero no se desglosan dinteles, antepechos o herrajes de refuerzo según solución. Los tacos se cuentan para los canales de suelo y techo, sin modelar los anclajes de arranques laterales. Estas limitaciones afectan al pedido real.

**R13 — Prioridad alta, pendiente documental. Alturas y prolongaciones.** Existen tablas condicionales y se evitan cantidades falsas fuera de tabla: es una protección útil. Sin embargo, no se ha podido cotejar íntegramente cada valor de las tablas Placo con sus páginas originales. Tampoco quedan documentados todos los solapes de 25/35/45 cm, las uniones y sus fijaciones. La denominación M48/M70/M90 por sí sola no garantiza que un perfil genérico cumpla esas tablas. La selección automática de otra estructura debe seguir siendo explícita para el usuario.

**R14 — Prioridad media. Directo: referencia válida bajo condiciones.** Los 5 kg/m² de pasta coinciden con el consumo **aproximado** de [Knauf Perlfix K465.es, 09/2025, p. 3](https://knauf.com/api/download-center/v1/assets/cbdb1f8a-e886-45a7-9880-94639dae3c39?download=true). No es una constante exacta para cualquier pasta y soporte. La preparación o imprimación y las disposiciones especiales por irregularidad no forman parte del despiece. La separación de directo, semidirecto y autoportante funciona en las reproducciones.

## 3. Obra húmeda

**R15 — Prioridad media. Ladrillo: geometría correcta, mortero idealizado.** Con 33 × 16,5 × 4 cm y junta de 5 mm, el cálculo obtiene 17,56 ud/m²: 176 unidades para 10 m² sin merma y 17,6 L geométricos de mortero. Es coherente con su fórmula; no equivale al rendimiento comercial histórico de 18 ud/m². El volumen no incorpora penetración en perforaciones, absorción ni condiciones particulares de tendeles. La merma del mortero es independiente, correctamente. El valor inicial de 14 L por saco es editable, pero carece de una ficha identificada. «Hecho en obra» entrega volumen fresco; no descompone cemento, arena y agua.

**R16 — Prioridad alta, pendiente documental. Bloques.** No se reutiliza la fórmula de ladrillos, lo cual es correcto. Continúan pendientes las referencias por producto de 12,5 ud/m², los pesos y los consumos iniciales de mortero de 18–30 kg/m². El tipo de apoyo, llagas y geometría del bloque pueden alterar ese consumo. Las dimensiones y juntas del bloque no son editables como en ladrillos.

**R17 — Prioridad alta. Revestimientos: verificación desigual.**

| Producto | Situación del coeficiente activo |
|---|---|
| PRISMA | 1,5 kg/m²/mm y límites contrastados con ficha oficial 12/01/2026 |
| HIDRO PLUS | 18 kg/m²/cm convertido correctamente a 1,8 kg/m²/mm; ficha 23/04/2026 |
| FINO | 1,7 kg/m²/mm corroborado en extractos oficiales; revisión íntegra de ficha pendiente |
| Cal Base | 14 ± 1 kg/m²/cm respalda nominalmente 1,4 kg/m²/mm; ficha 09/2025 |
| Cal Nature Pro | La ficha expresa «19±2 Kg» sin superficie ni espesor de referencia: no permite certificar el 1,9 activo |
| Cal Revoco | En el PDF local la unidad impresa es **kg/cm² y cm de espesor**. Hay una errata dimensional que debe aclararse antes de certificar 1,4 kg/m²/mm |

La auditoría de 12/10/2026 había normalizado la unidad de Cal Revoco como kg/m²/cm sin recoger la errata visible. **Se rectifica esa conclusión documental aquí; no se inventa un nuevo consumo.** Los límites de Nature y Revoco son conservadores para una capa y no representan todas las aplicaciones multicapa permitidas. Faltan auxiliares condicionados por el soporte y acabado: mallas, refuerzos, perfiles e imprimaciones cuando procedan.

**R18 — Prioridad media. Mínimos ocultos confirmados.** Una entrada de 0,5 mm para Nature pasa la validación y se calcula como 1 mm. También se acepta 0,5 cm de espesor de ladrillo y se utiliza 1 cm. El programa debe rechazar un valor incompatible o respetarlo, nunca sustituirlo silenciosamente. Esto demuestra un fallo de entrada/cálculo; no propone esos espesores como soluciones válidas. Una junta de 5,4 mm se calcula con decimales pero se describe como 5 mm.

**R19 — Puentes de unión: verificación favorable condicionada.** SikaTop-10 mantiene 0,20–0,50 kg/m²/capa; SikaTop-30, 0,150–0,175 kg/m². Sus envases y unidades son coherentes con las fichas consultadas. También concuerdan los intervalos de SikaTop-50, PTU-20 y Primer Top. PLUS MH convierte kg a litros usando el extremo inferior de densidad y lo explica como volumen conservador. Level Primer distingue diluido y concentrado y sus diluciones se aplican correctamente, pero fija la media de consumo diluido en 0,15 L/m²/capa sin permitir escoger dentro del rango 0,10–0,20. Los consumos siguen dependiendo del soporte; un dato editable no es automáticamente un dato verificado.

## 4. Cerámica

**R20 — Prioridad alta. Consumo de cola sin producto de referencia.** Los valores por llana —2,5/3,2/4,0/4,8 kg/m²— y sumas por formato, cuerpo y doble encolado no tienen una ficha que acredite esa combinación. El código ofrece una orientación, pero no puede generar una compra validada con ese criterio. El ejemplo documental SikaCeram-252 de `fuentes.json` muestra por qué debe asociarse el rendimiento al producto; no se propone trasladarlo a todos los adhesivos. La norma de clasificación no determina por sí sola los kg/m².

**R21 — Prioridad media. Clips sin distribución de juntas.** Se multiplican piezas/m² por 2 o 4 según el formato, se redondea el ratio al entero superior y se fija un mínimo de 4 clips/m². No se modelan lados compartidos, puntos por lado, bordes o patrón. Para 60 × 60 devuelve 12 clips/m². No se certifica aquí un ratio alternativo: requiere el sistema de nivelación y un plano o método de distribución. Las cuñas sí se limitan correctamente a la superficie simultánea y no se consumen por toda la obra.

**R22 — Prioridad media. Dos necesidades de cola para los mismos datos.** Caso reproducido: porcelánico 60 × 60, 8 m², doble encolado, llana 10 y merma 10 %. Materiales da **52,8 kg, 3 sacos de 25 kg**; clasificación de adhesivo da **48,0 kg, 2 sacos**. La primera aplica merma y la segunda no, sin distinguir claramente neto y compra. Debe unificarse el criterio o rotular ambas magnitudes inequívocamente.

La fórmula geométrica de mortero de juntas tiene las dimensiones coherentes, pero el coeficiente 1,6 y el 10 % adicional son orientativos, no universales. Debe elegirse o configurarse el producto. Los cuatro patrones conservan la merma manual introducida; no añaden otra merma oculta. La clasificación del adhesivo sigue siendo una recomendación que requiere compatibilidad real de producto, soporte y aplicación.

## 5. Cantidades y presupuesto

**R23 — Prioridad media. Cantidad redondeada antes de valorar.** Con un tabique de 1,2345 × 2,5 m, la lana calculada es 3,33315 m²; se guarda como texto de 3,3 m² y el presupuesto recupera ese 3,3. Pasa algo equivalente con otras magnitudes formateadas. Es necesario conservar cantidades numéricas completas y aplicar redondeo comercial por separado. Pantalla y exportación pueden coincidir entre sí y, aun así, compartir esa pérdida de precisión.

**R24 — Prioridad baja. Unidades de más por coma flotante.** En el techo de 20 m², metal-metal dice 5 ud/m² más 10 %. El resultado matemático es 110; JavaScript produce 110,00000000000001 y `ceil` devuelve **111**. Es un error reproducido de redondeo, independiente de que el ratio técnico deba justificarse.

**R25 — Prioridad media. Validación técnica y presupuesto provisional.** Todos los techos quedan actualmente provisionales por su aviso de despiece pendiente, incluso con todos los precios: es correcto conservarlo. Otros consumos orientativos pueden dar un presupuesto con precios completos sin ese estado. Conviene separar claramente «faltan precios», «faltan materiales/dimensionado» y «rendimiento orientativo». El versionado de cálculo y una mención UNE no acreditan validación técnica.

Los totales monetarios centrales reproducen correctamente beneficio industrial, descuento posterior e IVA 0/10/21 %. Con coste 1.000 €, beneficio 15 %, descuento 10 % e IVA 21 %, se obtiene 1.252,35 €. Esto acredita esa aritmética, pero no subsana materiales ausentes ni cantidades de origen incompletas.

## 6. Pruebas, alcance y archivos

Ejecutado realmente:

- Los cuatro bloques de comprobación de `.github/workflows/ci.yml`: archivos, interfaz/enlaces, sintaxis y pruebas. Ejecución local con Node **24.19.0**; el workflow configura Node 20.
- Las **181 pruebas existentes**: 181 correctas, 0 fallidas. Se ejecutaron además individualmente por archivo para obtener el recuento de casos que la ejecución agrupada local presenta por archivo.
- **85 casos de auditoría** sobre los fragmentos originales con el DOM simulado ya existente. Incluyen todos los productos del catálogo; los ladrillos sin dimensiones verificadas exigen datos, como corresponde. Los asserts documentan comportamientos observados, incluidos los defectos; no son una certificación técnica.
- Guardado mediante «Añadir a obra» de las reproducciones y comprobación de filas en presupuesto; las pruebas existentes cubren persistencia, precios, copias, exportaciones y PWA.

No comprobado: montaje físico, adecuación estructural de cada variante, interfaces visuales en Android ni impresión real de PDF. Las exportaciones se verifican mediante los handlers y datos simulados de las pruebas. No se ejecutó un nuevo despliegue. Las tablas originales Placo no pudieron cotejarse íntegramente; algunas fichas se pudieron consultar solo mediante extractos. Esas limitaciones figuran en `fuentes.json`.

Archivos de esta auditoría:

- `informe.md`: conclusión y hallazgos R01–R25.
- `fuentes.json`: 20 referencias, con fecha de revisión, páginas o apartados, unidades, condiciones y grado de verificación.
- `reproducir.cjs` y `casos.json`: ejecución reproducible y resultados de 85 escenarios.
- `validacion.json` y `validacion.txt`: recuentos y salida de las comprobaciones existentes.
- `integridad.json`: cotejo de archivos con la versión de producción examinada.
- `base-remota.json`: rutas y huellas Git utilizadas en ese cotejo.

Reproducción: `node docs/auditoria-rendimientos-20261019/reproducir.cjs`. No altera archivos de la PWA; actualiza el fichero de casos de esta carpeta.

## 7. Orden de corrección propuesto

1. **Techos:** definir sistema y encuentro; calcular perimetral, anclajes, banda y suspensiones a partir de trazado y tabla de cargas. Mantener pendientes las configuraciones que no se puedan dimensionar.
2. **PYL:** validar alturas y empalmes; desglosar huecos, fijaciones, tornillos por líneas/capas y aislamiento compatible.
3. **Obra húmeda:** completar referencias de bloques y morteros; aclarar las unidades de Cal Nature/Revoco y eliminar mínimos ocultos.
4. **Cerámica:** rendimiento de producto configurable y documentado; nivelación por disposición real y compra coherente entre pantallas.
5. **Transversal:** guardar cantidades sin redondeo previo y distinguir alcance técnico del estado económico del presupuesto; añadir pruebas de cantidades esperadas con una referencia independiente.

Las revisiones anteriores dejaron varios puntos mitigados con avisos, sin resolver el despiece. Las comprobaciones que preservan resultados anteriores no demuestran que esos resultados sean correctos. La siguiente actualización debe cerrar estas carencias con documentación y casos independientes antes de presentar el pedido como completo.
