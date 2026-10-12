# Referencias de código abierto para Calculadora Construcción

Consultas de GitHub realizadas el 11 de octubre de 2026. Las estrellas corresponden a esas consultas y pueden cambiar. Se han revisado documentación y archivos técnicos enlazados. Los diez proyectos seleccionados superan las 1.000 estrellas.

| Repositorio | Estrellas | Idea útil para esta aplicación | Decisión |
| --- | ---: | --- | --- |
| [ERPNext](https://github.com/frappe/erpnext) | 40.016 | Descomposición de costes de materiales y operaciones, conversión de unidades y precisión configurable por campo. | Referencia para la auditoría del despiece. Se aplica la separación entre precisión de precio unitario y redondeo del importe en las exportaciones. |
| [Dolibarr](https://github.com/Dolibarr/dolibarr) | 7.717 | Cálculo común para cantidades, precios, descuentos e impuestos; distinción explícita entre precios con y sin impuestos. | Mantener el cálculo central de presupuesto y verificar que cada exportación conserva los decimales del precio introducido. La indicación de precios con/sin IVA queda como propuesta de presentación posterior. |
| [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) | 2.848 | Conversión de unidades de longitud, superficie y volumen; distinción entre superficie real, superficie de una cara y superficie proyectada. | Referencia para revisar unidades y geometría. No se incorpora importación IFC ni se sustituyen rendimientos de materiales. |
| [FreeCAD](https://github.com/FreeCAD/FreeCAD) | 34.169 | Muros definidos por longitud, altura y espesor, con geometría parametrizada. | Referencia para comparar superficie bruta, huecos y superficie neta. Su campo `ArchWall.Area` es longitud × altura; no debe tomarse como superficie neta sin comprobar las sustracciones. |
| [InvoicePlane](https://github.com/InvoicePlane/InvoicePlane) | 3.152 | Cálculo central de presupuestos, desglose de descuentos e impuestos y documentación de actualizaciones. | La actualización de beneficio industrial utiliza un cálculo central y el mismo desglose para pantalla y exportaciones. |
| [decimal.js](https://github.com/MikeMcl/decimal.js) | 7.263 | Precisión decimal y reglas explícitas de redondeo. | Se prueban cantidades fraccionarias, céntimos y porcentajes decimales. No se ha incorporado esta biblioteca; el cálculo actual utiliza Number y redondea los importes de línea y cada etapa a céntimos. Evaluar aritmética decimal durante la auditoría posterior. |
| [Workbox](https://github.com/GoogleChrome/workbox) | 13.024 | Precarga controlada de recursos y gestión del ciclo de instalación/activación del service worker. | Aplicado con código propio: la actualización requiere una precarga completa, evita reutilizar recursos de la caché HTTP y conserva las cachés de otras aplicaciones. |
| [Playwright](https://github.com/microsoft/playwright) | 97.492 | Pruebas de formularios, dispositivos móviles, descargas y navegación con navegadores reales. | Referencia para la siguiente comprobación visual. Chromium no pudo arrancar por las restricciones del entorno; no se declara verificada la interfaz en un navegador real. |
| [jsPDF](https://github.com/parallax/jsPDF) | 31.308 | Generación directa de PDF desde JavaScript. | Posible mejora posterior. Se conserva la impresión/PDF existente en esta actualización. |
| [OpenProject](https://github.com/opf/openproject) | 16.385 | Gestión por proyectos, seguimiento de costes y presupuestos. | Referencia para mejorar la presentación por obra y estancia en una fase posterior. |

Fuentes técnicas examinadas:

- [Cálculo de impuestos e importes de ERPNext](https://github.com/frappe/erpnext/blob/develop/erpnext/public/js/controllers/taxes_and_totals.js): `calculate_item_values`, `get_item_fields_to_round`, `calculate_totals` y `apply_discount_amount`.
- [Lista de materiales de ERPNext](https://github.com/frappe/erpnext/blob/develop/erpnext/manufacturing/doctype/bom/bom.py) y [servicio de costes](https://github.com/frappe/erpnext/blob/develop/erpnext/manufacturing/doctype/bom/services/costing.py): cantidades, factores de conversión y costes de materiales y operaciones.
- [Cálculo de precios de Dolibarr](https://github.com/Dolibarr/dolibarr/blob/develop/htdocs/core/lib/price.lib.php): `calcul_price_total` y sus parámetros de precio, descuento, IVA y tipo de base.
- [Unidades de IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell/blob/v0.9.0/src/ifcopenshell-python/ifcopenshell/util/unit.py): `convert`, `convert_unit` y `calculate_unit_scale`.
- [Geometría de IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell/blob/v0.9.0/src/ifcopenshell-python/ifcopenshell/util/shape.py): `get_volume`, `get_side_area` y `get_footprint_area`.
- [Muros de FreeCAD](https://github.com/FreeCAD/FreeCAD/blob/main/src/Mod/BIM/ArchWall.py): propiedades de dimensiones y cálculo de `Area`.
- [Modelo de importes de presupuesto de InvoicePlane](https://github.com/InvoicePlane/InvoicePlane/blob/develop/application/modules/quotes/models/Mdl_quote_amounts.php).
- [Precarga de Workbox](https://github.com/GoogleChrome/workbox/blob/v7/packages/workbox-precaching/src/PrecacheController.ts).
- [Activación y control de clientes de Workbox](https://github.com/GoogleChrome/workbox/blob/v7/packages/workbox-core/src/clientsClaim.ts).
- [Ejemplos de precisión y configuración de redondeo de decimal.js](https://github.com/MikeMcl/decimal.js/blob/master/README.md).

Se han tomado ideas de diseño y verificación, sin copiar código de estos proyectos ni incorporar dependencias. InvoicePlane contiene una licencia de código con permiso MIT y condiciones separadas para sus marcas y componentes; decimal.js, Workbox y jsPDF declaran MIT, Playwright Apache-2.0, ERPNext, Dolibarr y OpenProject GPL-3.0, IfcOpenShell LGPL-3.0 y FreeCAD LGPL-2.1.

Aplicación concreta de esta segunda revisión: se reprodujo con una prueba el caso de 1.200 unidades a 0,083 €/ud. El importe era 99,60 €, pero las exportaciones mostraban un precio de 0,08 €/ud, incompatible con ese importe. Se corrigió el formateo en CSV, impresión/PDF, WhatsApp y Compartir para conservar 0,083 €/ud, manteniendo el importe en céntimos. La prueba de regresión pasa y se mantiene en `tests/budget-flows.test.js`.

Prioridades derivadas para la auditoría pendiente: documentar la unidad de cálculo y la unidad comercial de cada material; comprobar sus factores de conversión; distinguir superficies brutas, netas y caras revestidas; verificar la precisión de precios y cantidades antes de redondear los importes. Estas prioridades son propuestas pendientes, salvo la corrección de exportación descrita.

Estas referencias no acreditan consumos ni rendimientos de materiales. Esos datos deben verificarse con la documentación técnica del producto o sistema correspondiente.
