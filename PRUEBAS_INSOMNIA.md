# Guía de Pruebas con Insomnia - Overshark Backend

Esta guía contiene todos los formatos JSON necesarios para hacer pruebas del API usando Insomnia o cualquier otro cliente HTTP.

## URL Base del API

```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com
```

---

## Endpoints Disponibles

### 1. POST /notificaciones - Simular Notificación de Yape

Simula que un dispositivo móvil recibió una notificación de pago.

**URL Completa:**
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones
```

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body - Ejemplo 1 (Notificación de YAPE válida):**
```json
{
  "texto": "Recibiste S/100.00 de Jesus F. Anthony C. - Yape. Código de seguridad: 098 Número de operación: 12345678",
  "codigo_dispositivo": "L1-000"
}
```

**Body - Ejemplo 2 (Notificación de PLIN):**
```json
{
  "texto": "Recibiste S/200.50 de Maria Lopez via PLIN. Código: 654321. Op: 87654321",
  "codigo_dispositivo": "L2-378"
}
```

**Body - Ejemplo 3 (Notificación de BCP):**
```json
{
  "texto": "Transferencia BCP recibida: S/350.00 de Carlos Mendoza. Código: 789012",
  "codigo_dispositivo": "P1-556"
}
```

**Body - Ejemplo 4 (Notificación que requiere revisión manual):**
```json
{
  "texto": "Transferencia bancaria recibida por S/500.00",
  "codigo_dispositivo": "TK1-320"
}
```

**Códigos de dispositivo válidos:**

| Código | Nombre | Ubicación | Empresa |
|--------|--------|-----------|---------|
| L1-000 | Lima 1 | Lima | Overshark |
| L2-378 | Lima 2 | Lima | Overshark |
| L3-711 | Lima 3 | Lima | Overshark |
| L4-138 | Lima 4 | Lima | Overshark |
| P1-556 | Provincia 1 | Provincia | Overshark |
| P2-576 | Provincia 2 | Provincia | Overshark |
| P3-825 | Provincia 3 | Provincia | Overshark |
| P4-101 | Provincia 4 | Provincia | Overshark |
| TK1-320 | TikTok 1 | TikTok | Overshark |
| TK2-505 | TikTok 2 | TikTok | Overshark |
| TK3-016 | TikTok 3 | TikTok | Overshark |
| PUB BRAV-829 | Pub Bravo's | Lima | Bravo's |
| LIVE BRAV-402 | Live Bravo's | Lima | Bravo's |

**Respuesta Exitosa (200):**
```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "12345678",
  "tipo_pago": "YAPE",
  "monto": 150,
  "codigo_dispositivo": "L1-000",
  "estado": "PENDIENTE_VALIDACION",
  "requiere_revision_manual": false
}
```

**Respuesta Error (400) - Código inválido:**
```json
{
  "error": "Código de dispositivo inválido: DISP999"
}
```

---

### 2. POST /validar - Validar Voucher con Matching

Valida un voucher mediante el sistema de matching simple (código de seguridad + monto).

**URL Completa:**
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/validar
```

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body - Campos Requeridos:**
```json
{
  "monto": 100.00,
  "codigoSeguridad": "098",
  "numeroOperacion": "12345678",
  "fechaHora": "2025-12-12T14:30:00",
  "nombreCliente": "Jesus F. Anthony C.",
  "codigoServicio": "TK1-320",
  "telefonoCliente": "987654321",
  "ubicacion": "Lima Centro",
  "vendedorWhatsApp": "+51987654321"
}
```

**Body - Con Campos Opcionales:**
```json
{
  "monto": 250.50,
  "codigoSeguridad": "654321",
  "numeroOperacion": "87654321",
  "fechaHora": "2025-12-12T15:45:00",
  "nombreCliente": "Maria Lopez",
  "codigoServicio": "SRV002",
  "telefonoCliente": "912345678",
  "ubicacion": "Miraflores, Lima",
  "vendedorWhatsApp": "+51912345678",
  "voucherUrl": "vouchers/2025/12/12/voucher.jpg"
}
```

**Descripción de Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| monto | number | Sí | Monto del pago (ej: 100.00) - **Usado para matching** |
| codigoSeguridad | string | Sí | Código de seguridad de Yape (3 dígitos) - **Usado para matching** |
| numeroOperacion | string | Sí | Número de operación de Yape (6-8 dígitos) - Solo para anti-duplicación |
| fechaHora | string | Sí | Fecha y hora en formato ISO (YYYY-MM-DDTHH:mm:ss) |
| nombreCliente | string | Sí | Nombre completo del cliente |
| codigoServicio | string | Sí | Código del dispositivo/servicio (ej: TK1-320) |
| telefonoCliente | string | No | Teléfono del cliente |
| ubicacion | string | No | Ubicación del cliente |
| vendedorWhatsApp | string | Sí | Número de WhatsApp del vendedor |
| voucherUrl | string | No | URL del voucher en S3 |

**Nota Importante:** El sistema hace matching **SOLO** por:
1. Código de seguridad (EXACTO)
2. Monto (EXACTO)

**Respuesta Exitosa - Match Encontrado (100% confianza):**
```json
{
  "valido": true,
  "confianza": 100,
  "mensaje": "✅ Venta validada correctamente\n\n📋 Detalles:\n• Cliente: Jesus F. Anthony C.\n• Servicio: TK1-320\n• Monto: S/100.00\n• Operación: 12345678\n• Código Seguridad: 098",
  "campos_coincidentes": ["codigoSeguridad", "monto"]
}
```

**Respuesta - No Match:**
```json
{
  "valido": false,
  "confianza": 0,
  "razon": "NO_EXISTE_NOTIFICACION",
  "mensaje": "⚠️ No encontramos el pago en nuestro sistema.\n\nVerifica:\n• El código de seguridad (098)\n• El monto (S/100.00)\n• Que el pago se haya realizado a uno de nuestros números\n• Que hayan pasado al menos 30 segundos desde el pago"
}
```

---

### 3. GET /dashboard/pendientes - Listar Notificaciones Pendientes

Lista todas las notificaciones que requieren revisión manual.

**URL Completa:**
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes
```

**Método:** `GET`

**Headers:**
```
Authorization: Bearer {tu_token_cognito}
Content-Type: application/json
```

**Nota:** Este endpoint requiere autenticación con AWS Cognito.

---

### 4. POST /dashboard/validar - Validar Notificación Manualmente

Permite aprobar o rechazar notificaciones de forma manual.

**URL Completa:**
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/validar
```

**Método:** `POST`

**Headers:**
```
Authorization: Bearer {tu_token_cognito}
Content-Type: application/json
```

**Body:**
```json
{
  "notificacion_id": "NOTIF#12345678",
  "accion": "aprobar",
  "notas": "Voucher verificado manualmente"
}
```

**Nota:** Este endpoint requiere autenticación con AWS Cognito.

---

### 5. POST /webhook - Webhook de WhatsApp

Endpoint para recibir mensajes de WhatsApp Business API.

**URL Completa:**
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook
```

**Método:** `POST` y `GET`

**Nota:** Este endpoint es usado por Meta/Facebook para enviar mensajes de WhatsApp. No es necesario probarlo manualmente.

---

## Flujo de Prueba Recomendado

### Prueba 1: Crear una Notificación
1. Usa el endpoint `POST /notificaciones` con el Ejemplo 1
2. Observa la respuesta:
   - `numero_operacion`: "12345678"
   - `codigo_seguridad`: debería parsearse como "098" (del texto)
   - `monto`: 100
   - `estado`: "PENDIENTE_VALIDACION"

### Prueba 2: Validar con Matching (Match Exitoso)
1. Usa el endpoint `POST /validar`
2. Usa el **mismo `codigoSeguridad`** ("098") y **mismo `monto`** (100.00) que enviaste en la notificación
3. Puedes usar diferente `numeroOperacion`, `nombreCliente`, etc. (no afectan el matching)
4. El sistema debería devolver:
   - `"valido": true`
   - `"confianza": 100`
   - `"campos_coincidentes": ["codigoSeguridad", "monto"]`

### Prueba 3: Validar con Matching (Sin Match - Código incorrecto)
1. Usa el endpoint `POST /validar`
2. Usa un `codigoSeguridad` diferente (ej: "999") pero el mismo monto
3. El sistema debería devolver:
   - `"valido": false`
   - Mensaje indicando que el código de seguridad no coincide

### Prueba 4: Validar con Matching (Sin Match - Monto incorrecto)
1. Usa el endpoint `POST /validar`
2. Usa el mismo `codigoSeguridad` ("098") pero un monto diferente (ej: 200.00)
3. El sistema debería devolver:
   - `"valido": false`
   - Mensaje indicando que el monto no coincide

### Prueba 5: Anti-duplicación
1. Crea una notificación con `POST /notificaciones`
2. Valídala exitosamente con `POST /validar`
3. Intenta validar el mismo `numeroOperacion` nuevamente
4. El sistema debería devolver:
   - `"valido": false`
   - `"razon": "OPERACION_DUPLICADA"`
   - Mensaje indicando que el pago ya fue validado

### Prueba 6: Notificación que Requiere Revisión Manual
1. Usa el endpoint `POST /notificaciones` con el Ejemplo 4 (tipo de pago desconocido)
2. Verifica que el `estado` sea "REVISION_MANUAL"
3. Verifica que `requiere_revision_manual` sea `true`

---

## Ejemplo de Colección para Importar en Insomnia

Guarda este JSON en un archivo y luego impórtalo en Insomnia:

```json
{
  "_type": "export",
  "__export_format": 4,
  "resources": [
    {
      "_id": "req_001",
      "name": "POST Notificación Yape",
      "method": "POST",
      "url": "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones",
      "headers": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"texto\": \"Recibiste S/100.00 de Jesus F. Anthony C. - Yape. Código de seguridad: 098 Número de operación: 12345678\",\n  \"codigo_dispositivo\": \"L1-000\"\n}"
      }
    },
    {
      "_id": "req_002",
      "name": "POST Validar Voucher",
      "method": "POST",
      "url": "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/validar",
      "headers": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ],
      "body": {
        "mimeType": "application/json",
        "text": "{\n  \"monto\": 100.00,\n  \"codigoSeguridad\": \"098\",\n  \"numeroOperacion\": \"12345678\",\n  \"fechaHora\": \"2025-12-12T14:30:00\",\n  \"nombreCliente\": \"Jesus F. Anthony C.\",\n  \"codigoServicio\": \"TK1-320\",\n  \"telefonoCliente\": \"987654321\",\n  \"ubicacion\": \"Lima Centro\",\n  \"vendedorWhatsApp\": \"+51987654321\"\n}"
      }
    }
  ]
}
```

---

## Errores Comunes

### Error 400 - Código de dispositivo inválido
```json
{
  "error": "Código de dispositivo inválido: XXX"
}
```
**Solución:** Usa uno de los códigos de dispositivo válidos listados arriba.

### Error 400 - Faltan campos requeridos
```json
{
  "error": "Faltan campos requeridos: texto, codigo_dispositivo"
}
```
**Solución:** Verifica que estés enviando todos los campos requeridos en el body.

### Error 500 - Error interno del servidor
```json
{
  "error": "Error interno del servidor",
  "details": "..."
}
```
**Solución:** Revisa los logs de CloudWatch para más detalles.

---

## Notas Adicionales

### Sistema de Matching Simplificado

El sistema ahora usa un **matching simple** basado en **2 campos EXACTOS**:

1. **Código de seguridad** - Debe coincidir exactamente
2. **Monto** - Debe coincidir exactamente

**NO se usa para matching:**
- ❌ Código del dispositivo
- ❌ Nombre del cliente
- ❌ Número de operación (solo para anti-duplicación)
- ❌ Fecha y hora

**Ventajas:**
- ✅ Más rápido y simple
- ✅ Menos errores de validación
- ✅ El vendedor solo necesita asegurarse del código de seguridad y monto

### Formato de Datos

- Todas las fechas deben estar en formato ISO 8601: `YYYY-MM-DDTHH:mm:ss`
- Los montos deben ser números decimales (usar punto, no coma): `100.00`
- Los códigos de seguridad de Yape son de **3 dígitos** (ej: "098", "123", "456")
- Los números de operación de Yape pueden ser de **6-8 dígitos**
- El sistema detecta automáticamente el tipo de pago (YAPE, PLIN, BCP, INTERBANK, etc.)

### Flujo en WhatsApp

Cuando un vendedor usa el chatbot de WhatsApp:
1. **Envía imagen** del voucher de Yape
2. Sistema extrae: monto, código de seguridad, número de operación
3. **Vendedor escribe:**
   - Línea 1: Nombre del cliente
   - Línea 2: Código del servicio/dispositivo (ej: TK1-320)
   - Línea 3 (opcional): Teléfono del cliente
   - Línea 4 (opcional): Ubicación
4. Sistema hace **matching automático** solo por código de seguridad + monto
5. Si hay match → ✅ Venta validada
6. Si no hay match → ❌ Venta rechazada con feedback detallado

---

## Soporte

Para más información, revisa:
- Logs de CloudWatch: [AWS Console](https://console.aws.amazon.com/cloudwatch)
- Documentación de Serverless: `serverless.yml`
- Código fuente: `src/handlers/`
