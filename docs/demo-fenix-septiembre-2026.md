# Guía de demo — FENIX Riobamba
## GestorClub · Septiembre 2026

---

## Preparación (hacer antes de la reunión)

### Cuentas necesarias
| Cuenta | Correo | Rol | Para mostrar |
|---|---|---|---|
| Administrador | `kevito418+testerowner@gmail.com` | owner | Todo el dashboard |
| Entrenador | `kevito418+trainer@gmail.com` | trainer | Vista restringida |

### Datos de prueba mínimos (crear antes)
- 1 plan de membresía activo (ej. "Mensualidad FENIX", $32/mes, 30 días)
- 2–3 estudiantes ya creados con perfil completo
- 1 rubro creado (ej. "Descuento hermanos", 15%)
- 1 sede creada (ej. "Coliseo Riobamba")

### URL base
```
http://localhost:3000/[orgSlug]/dashboard
```
Reemplaza `[orgSlug]` con el slug de tu organización de prueba.

---

## Flujo de la demo (orden sugerido)

### 1. Registro de un estudiante nuevo
*Muestra: perfil extendido con datos médicos y representante*

1. Ir a **Miembros → Nuevo miembro**
2. Tab **Personales**: llenar nombre "Carlos Pérez", teléfono "0991234567", fecha de nacimiento, unidad educativa "Unidad Educativa Riobamba", curso "8vo A"
3. Tab **Médico**: tipo de sangre "O+", alergias "Ninguna"
4. Tab **Representante**: nombre "María López", parentesco "Madre", teléfono "0987654321"
5. Guardar → redirige al listado
6. Hacer clic en el estudiante → ver ficha completa con las 3 secciones
7. **Mensaje clave:** *"Toda la información que necesitan en una emergencia está en un solo lugar"*

---

### 2. Carnet digital del estudiante
*Muestra: carnet con QR, acceso sin login*

1. Desde la ficha del estudiante, clic en **"Ver carnet"** (abre nueva pestaña)
2. Mostrar el carnet: nombre, estado ACTIVO, código QR
3. Abrir la URL del carnet en el celular (sin cuenta, sin app)
4. **Mensaje clave:** *"El padre o el portero puede escanear este QR con cualquier celular para verificar que el estudiante está activo"*

> Tip: antes de la demo, abre el carnet en tu celular y tenlo listo para mostrarlo físicamente.

---

### 3. Rubros / Tarifas especiales
*Muestra: descuentos configurables por el club*

1. Ir a **Configuración → Rubros / Tarifas**
2. Mostrar el rubro "Descuento hermanos (15%)"
3. Hacer clic en **Nuevo rubro** → crear "Descuento club deportivo", 10%
4. Volver a editar un estudiante → tab Personales → mostrar dropdown "Rubro / Tarifa"
5. **Mensaje clave:** *"Si dos hermanos se inscriben, asignas el rubro y el sistema sabe que tienen descuento — no tienes que recordarlo manualmente"*

---

### 4. Sedes
*Muestra: gestión de múltiples canchas/locales*

1. Ir a **Configuración → Sedes**
2. Mostrar "Coliseo Riobamba" ya creado
3. Hacer clic en **Nueva sede** → crear "Cancha Norte", dirección "Av. Daniel León Borja"
4. Editar un estudiante → mostrar que se puede asignar a una sede
5. **Mensaje clave:** *"Si tienen dos canchas, pueden saber cuántos estudiantes van a cada una"*

---

### 5. Inscripción pública (el padre llena desde su celular)
*Muestra: formulario público sin necesidad de cuenta*

1. Abrir ventana de incógnito (Ctrl+Shift+N)
2. Ir a `http://localhost:3000/[orgSlug]/inscripcion`
3. Mostrar que carga sin pedir login
4. Llenar los 3 tabs (Datos del estudiante / Médico / Representante) con datos de prueba
5. Enviar → mostrar mensaje de confirmación
6. Volver al dashboard (cuenta admin) → ir a **Inscripciones pendientes**
7. Mostrar la solicitud recibida → hacer clic en **Aprobar**
8. Verificar que el estudiante aparece en **Miembros** como Activo
9. **Mensaje clave:** *"El padre llena todo desde el celular, tú solo apruebas — sin papeles, sin transcribir datos a mano"*

---

### 6. Pagos y recordatorios automáticos
*Muestra: aprobación de pago + recordatorios que se generan solos*

1. Ir a **Pagos → Registrar pago**
2. Seleccionar un estudiante, plan "Mensualidad FENIX", $32, método "Transferencia bancaria"
3. Guardar → aparece en "Pendientes de revisión"
4. Clic en **Aprobar pago**
5. Mostrar en Supabase Studio (tabla `payment_reminders`) las 6 filas generadas:
   - Confirmación de pago (inmediata)
   - Recordatorio 3 días antes del vencimiento
   - Recordatorio el día del vencimiento
   - Aviso 1, 3 y 7 días después de vencido
6. **Mensaje clave:** *"Cuando apruebas el pago, el sistema agenda automáticamente todos los recordatorios del próximo mes — no tienes que recordar enviarlos"*

---

### 7. Factura simulada
*Muestra: comprobante de pago estilo SRI para el padre*

1. Ir a **Facturación**
2. Clic en **Nueva factura**
3. Llenar: receptor "María López", cédula "0912345678", concepto "Mensualidad octubre 2026", subtotal $32.00
4. Crear → aparece en listado con número "001"
5. Clic en **Ver / Imprimir** → se abre la vista de impresión
6. Mostrar: datos del club, datos del receptor, subtotal $32.00, IVA 15% $4.80, total $36.80
7. Hacer Ctrl+P para mostrar que se puede imprimir o guardar como PDF
8. **Mensaje clave:** *"El padre le puede pedir un comprobante y en 30 segundos lo tienen impreso o en PDF"*

---

### 8. Vista del entrenador (acceso restringido)
*Muestra: el entrenador ve solo lo que necesita*

1. Cerrar sesión del admin
2. Iniciar sesión con `kevito418+trainer@gmail.com`
3. Mostrar el sidebar: **solo aparece "Mis clases" y "Asistencia"**
4. No ve Miembros, no ve Pagos, no ve Configuración
5. Intentar ir manualmente a `/dashboard/miembros` → redirige al dashboard sin error
6. **Mensaje clave:** *"El entrenador entra, marca asistencia, ve sus clases — y no puede ver ni tocar información de pagos o configuración del club"*

---

## Puntos de venta a enfatizar

| Lo que ven | Lo que significa para FENIX |
|---|---|
| Formulario de inscripción público | Los padres llenan los datos desde casa, sin ir al club |
| Datos médicos del estudiante | En una emergencia, la información está disponible de inmediato |
| Representante obligatorio | El club siempre tiene un contacto de emergencia en el sistema |
| Recordatorios automáticos | Reducción de morosidad sin trabajo manual |
| Carnet digital con QR | Control de acceso sin impresiones, funciona en cualquier celular |
| Vista del entrenador | Cada persona ve solo lo que necesita — más orden, más seguridad |
| Factura simulada | Comprobante profesional sin necesidad de contador |

---

## Si preguntan sobre funciones que no están listas

| Pregunta probable | Respuesta |
|---|---|
| "¿Se puede pagar con tarjeta?" | "Sí, en la siguiente fase integramos Kushki — por ahora el cobro es por transferencia y el admin aprueba el comprobante" |
| "¿Se integra con el SRI?" | "La facturación electrónica es la siguiente fase — por ahora generamos un comprobante interno" |
| "¿Hay app para Android/iPhone?" | "La app funciona en el celular desde el navegador y se puede instalar como si fuera una app — sin tiendas de aplicaciones" |
| "¿Puedo ver la asistencia?" | "El control de asistencia por QR está en la siguiente fase — ya están generados los QR de cada estudiante" |

---

## Orden alternativo (demo corta, 15 minutos)

1. Inscripción pública → aprobación (5 min)
2. Ficha del estudiante + carnet (3 min)
3. Aprobar un pago + mostrar recordatorios (4 min)
4. Vista del entrenador (3 min)
