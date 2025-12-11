# API - Validar Voucher

Documentación técnica del endpoint de validación de vouchers.

## Información General

**Base URL:** `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com`

**Endpoint:** `POST /validar`

**Handler:** `src/handlers/validarConMatch.ts`

**Autenticación:** No requiere (público)

---

## POST /validar

### Descripción
Valida un voucher de Yape contra las notificaciones registradas en el sistema. Implementa un algoritmo de matching con 5 checks obligatorios para garantizar la autenticidad del pago.

### Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| `Content-Type` | `application/json` | Sí |

### Request Body

```typescript
{
  // De la IMAGEN (extraído con Textract OCR)
  monto: number;                   // Monto del pago
  codigoSeguridad: string;         // Código de seguridad (3 dígitos)
  numeroOperacion: string;         // Número de operación único
  fechaHora: string;               // Fecha y hora del pago (ISO 8601)

  // Del TEXTO (proporcionado por el vendedor)
  nombreCliente: string;           // Nombre completo del cliente que pagó
  codigoServicio: string;          // Código del servicio/dispositivo
  telefonoCliente?: string;        // Teléfono del cliente (opcional)
  ubicacion?: string;              // Ubicación del cliente (opcional)

  // Metadata
  vendedorWhatsApp: string;        // Teléfono del vendedor (formato: 51987654321)
  voucherUrl?: string;             // S3 key de la imagen del voucher
}
```

### Request Example

```json
{
  "monto": 100.0,
  "codigoSeguridad": "502",
  "numeroOperacion": "03443217",
  "fechaHora": "2025-11-22T11:34:00",
  "nombreCliente": "Juan Carlos Perez Fernandez",
  "codigoServicio": "TK6-600",
  "telefonoCliente": "987654321",
  "ubicacion": "Lima",
  "vendedorWhatsApp": "51987654321",
  "voucherUrl": "vouchers/51987654321/2025-11-22T11:34:00.jpg"
}
```

---

## Responses

### Success - Voucher Validado (200 OK)

Todos los checks pasaron (5/5 - 100%).

```json
{
  "valido": true,
  "confianza": 100,
  "mensaje": "✅ VOUCHER VALIDADO\n\nMonto: S/ 100.00\nOperación: 03443217\nCliente: Juan Carlos Perez Fernandez\nServicio: TK6-600\nCódigo Seg.: 502\n\nChecks aprobados: 5/5 (100%)",
  "campos_coincidentes": [
    "numero_operacion",
    "codigo_dispositivo",
    "monto",
    "nombre_cliente",
    "codigo_seguridad"
  ]
}
```

**Qué hace el sistema:**
1. ✅ Valida el voucher
2. ✅ Registra la venta en `ventas_validadas` con estado `VALIDADO`
3. ✅ Actualiza la notificación con estado `VALIDADO`

---

### Partial Match - Revisión Manual (200 OK)

Algunos checks fallaron (4/5 - 80%). Requiere revisión manual.

```json
{
  "valido": false,
  "confianza": 80,
  "razon": "MATCH_INSUFICIENTE",
  "mensaje": "⚠️ REQUIERE REVISIÓN MANUAL\n\nMonto: S/ 100.00\nOperación: 03443217\n\nChecks aprobados: 4/5 (80%)\n\n✅ Número de operación coincide\n✅ Código de dispositivo coincide\n✅ Monto coincide\n❌ Nombre del cliente no coincide (95% requerido)\n✅ Código de seguridad coincide\n\nUn administrador revisará este voucher.",
  "campos_coincidentes": [
    "numero_operacion",
    "codigo_dispositivo",
    "monto",
    "codigo_seguridad"
  ]
}
```

**Qué hace el sistema:**
1. ⏳ Registra la venta en `ventas_validadas` con estado `REVISION_MANUAL`
2. ⏳ Actualiza la notificación con estado `REVISION_MANUAL`
3. ⏳ Queda pendiente de aprobación por un administrador

---

### Error - Voucher Rechazado (400 Bad Request)

Muy pocos checks pasaron (≤3/5 - ≤60%).

```json
{
  "valido": false,
  "confianza": 40,
  "razon": "MATCH_INSUFICIENTE",
  "mensaje": "❌ VOUCHER RECHAZADO\n\nMonto: S/ 100.00\nOperación: 03443217\n\nChecks aprobados: 2/5 (40%)\n\n✅ Número de operación coincide\n❌ Código de dispositivo no coincide\n✅ Monto coincide\n❌ Nombre del cliente no coincide\n❌ Código de seguridad no coincide\n\nPor favor revisa los datos y vuelve a intentarlo.",
  "campos_coincidentes": [
    "numero_operacion",
    "monto"
  ]
}
```

---

### Error - Notificación No Existe (400 Bad Request)

El número de operación no existe en el sistema.

```json
{
  "valido": false,
  "razon": "NO_EXISTE_NOTIFICACION",
  "mensaje": "⚠️ No encontramos el pago en nuestro sistema.\n\nVerifica:\n• El número de operación sea correcto\n• Que el pago se haya realizado a uno de nuestros números\n• Que hayan pasado al menos 30 segundos desde el pago"
}
```

**Posibles causas:**
- El número de operación fue mal escrito
- El pago se hizo a un número que no está registrado en el sistema
- La notificación aún no llegó desde la app móvil (esperar 30 segundos)

---

### Error - Operación Duplicada (400 Bad Request)

El voucher ya fue validado anteriormente.

```json
{
  "valido": false,
  "razon": "OPERACION_DUPLICADA",
  "mensaje": "⚠️ OPERACIÓN DUPLICADA\n\nEste voucher ya fue validado anteriormente.\n\nNúmero de operación: 03443217\nValidado por: 51987654321\nFecha: 2025-11-22T11:35:00\n\nNo se puede volver a validar."
}
```

---

### Error - Servidor (500 Internal Server Error)

Error interno del servidor.

```json
{
  "error": "Error interno del servidor",
  "details": "Descripción del error"
}
```

---

## Algoritmo de Matching

El sistema realiza 5 checks obligatorios:

| # | Check | Criterio | Peso |
|---|-------|----------|------|
| 1 | **Número de operación** | Exacto (100%) | Crítico |
| 2 | **Código de dispositivo** | Exacto (100%) | Crítico |
| 3 | **Monto** | Exacto sin tolerancia (100%) | Crítico |
| 4 | **Nombre cliente** | Similitud ≥95% usando Levenshtein | Crítico |
| 5 | **Código de seguridad** | Exacto (100%) | Crítico |

### Decisión Final

```
Checks aprobados | Confianza | Decisión
----------------|-----------|----------
5/5             | 100%      | ✅ VALIDADO (automático)
4/5             | 80%       | ⏳ REVISION_MANUAL
≤3/5            | ≤60%      | ❌ RECHAZADO
```

**Código de referencia:** `src/services/matching.ts`

---

## Estados de Venta

### VALIDADO
- Todos los checks pasaron (5/5)
- La venta se registró automáticamente
- El vendedor recibe confirmación inmediata
- No requiere intervención manual

### REVISION_MANUAL
- 4/5 checks pasaron
- La venta quedó pendiente de revisión
- Un administrador debe aprobar o rechazar
- Ver endpoint: [POST /dashboard/validar](API-Dashboard-Validacion.md)

### RECHAZADO
- ≤3/5 checks pasaron
- El sistema rechazó automáticamente
- El vendedor debe revisar los datos

---

## Flujo de Validación

```
1. Vendedor envía voucher
   ↓
2. Sistema busca notificación por número de operación
   ├─ No existe → Rechazar (NO_EXISTE_NOTIFICACION)
   └─ Existe → Continuar
      ↓
3. Sistema verifica duplicación
   ├─ Ya validado → Rechazar (OPERACION_DUPLICADA)
   └─ No duplicado → Continuar
      ↓
4. Sistema ejecuta 5 checks de matching
   ↓
5. Decisión según confianza:
   ├─ 100% → ✅ VALIDADO
   ├─ 80%  → ⏳ REVISION_MANUAL
   └─ ≤60% → ❌ RECHAZADO
```

---

## Integración con WhatsApp

Este endpoint es llamado automáticamente por el webhook de WhatsApp cuando un vendedor completa el flujo de validación:

1. Vendedor envía **IMAGEN** del voucher
2. Sistema extrae datos con Textract (OCR)
3. Vendedor envía **TEXTO** con datos adicionales
4. Sistema llama a `POST /validar` internamente
5. Sistema responde al vendedor vía WhatsApp

**Ver:** [API-Webhook-WhatsApp.md](API-Webhook-WhatsApp.md)

---

## Integración con Make.com

### Escenario: Automatizar validación desde formulario web

**Trigger:** Formulario web recibe datos del voucher

**Acción:**
1. HTTP Request a `POST /validar`
2. Parsear response
3. Si `valido === true`:
   - Enviar email de confirmación al cliente
   - Actualizar Google Sheets
   - Notificar al vendedor vía WhatsApp
4. Si `valido === false && razon === "MATCH_INSUFICIENTE"`:
   - Crear tarea en Trello para revisión manual
   - Notificar a administrador
5. Si `valido === false`:
   - Enviar email de rechazo
   - Solicitar corrección de datos

### Ejemplo de Módulo HTTP en Make.com

**URL:** `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/validar`

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "monto": {{voucher.monto}},
  "codigoSeguridad": {{voucher.codigoSeguridad}},
  "numeroOperacion": {{voucher.numeroOperacion}},
  "fechaHora": {{voucher.fechaHora}},
  "nombreCliente": {{cliente.nombre}},
  "codigoServicio": {{servicio.codigo}},
  "vendedorWhatsApp": {{vendedor.telefono}},
  "voucherUrl": {{s3.url}}
}
```

**Parse Response:**
```javascript
// Módulo Router en Make.com
if (response.valido === true) {
  // Route 1: Validado exitosamente
} else if (response.razon === "MATCH_INSUFICIENTE") {
  // Route 2: Requiere revisión manual
} else {
  // Route 3: Rechazado
}
```

---

## Testing

### Test con curl

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/validar \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 100.0,
    "codigoSeguridad": "502",
    "numeroOperacion": "03443217",
    "fechaHora": "2025-11-22T11:34:00",
    "nombreCliente": "Juan Carlos Perez Fernandez",
    "codigoServicio": "TK6-600",
    "vendedorWhatsApp": "51987654321",
    "voucherUrl": "vouchers/51987654321/2025-11-22T11:34:00.jpg"
  }'
```

### Test desde Make.com

1. Crear nuevo Scenario
2. Agregar módulo "HTTP - Make a request"
3. Configurar:
   - URL: El endpoint
   - Method: POST
   - Body type: Raw
   - Content type: JSON
   - Request content: El JSON del voucher
4. Run once para probar

---

## Tablas DynamoDB Afectadas

### 1. notificaciones_yape (lectura)
Busca la notificación por número de operación.

**Query:**
```
PK = "NOTIF#03443217"
```

### 2. ventas_validadas (escritura)
Registra la venta validada.

**Item:**
```json
{
  "PK": "VENTA#03443217",
  "SK": "2025-11-22T11:35:00",
  "estado": "VALIDADO" | "REVISION_MANUAL",
  "confianza_match": 100,
  "campos_coincidentes": [...],
  ...
}
```

### 3. notificaciones_yape (actualización)
Actualiza el estado de la notificación.

**Update:**
```
SET estado = "VALIDADO" | "REVISION_MANUAL"
```

---

## Logging

### CloudWatch Logs

```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/overshark-backend-dev-validarConMatch --follow

# Ver logs de las últimas 10 minutos
aws logs tail /aws/lambda/overshark-backend-dev-validarConMatch --since 10m
```

### Eventos Loggeados

**Validación exitosa:**
```
Venta validada y registrada: { PK: "VENTA#03443217", estado: "VALIDADO", ... }
```

**Revisión manual:**
```
Venta marcada para revisión manual: { PK: "VENTA#03443217", estado: "REVISION_MANUAL", ... }
```

**Errores:**
```
Error validando voucher: Error details...
```

---

## Seguridad

### Validaciones Implementadas

1. ✅ **Anti-duplicación:** No permite validar el mismo número de operación dos veces
2. ✅ **Matching estricto:** 5 checks obligatorios para garantizar autenticidad
3. ✅ **Verificación de existencia:** El pago debe existir en el sistema
4. ✅ **Registro completo:** Toda validación queda registrada con timestamp

### Recomendaciones

- ✅ Validar datos en el lado del cliente antes de enviar
- ✅ Implementar rate limiting si se expone públicamente
- ✅ Considerar agregar autenticación API key para producción
- ✅ Monitorear intentos fallidos repetidos (posible fraude)

---

## Referencias

- **Código fuente:** `src/handlers/validarConMatch.ts`
- **Servicio de matching:** `src/services/matching.ts`
- **Tipos TypeScript:** `src/types/venta.ts`
- **Webhook WhatsApp:** [docs/API-Webhook-WhatsApp.md](API-Webhook-WhatsApp.md)
- **Dashboard de validación:** [docs/API-Dashboard-Validacion.md](API-Dashboard-Validacion.md)
