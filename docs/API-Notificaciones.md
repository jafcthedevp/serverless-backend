# API - Endpoint de Notificaciones

## Descripción
Endpoint público para recibir y guardar notificaciones de pago desde las aplicaciones móviles instaladas en los 21 dispositivos del sistema.

---

## Información del Endpoint

**URL:** `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones`
**Método:** `POST`
**Autenticación:** No requiere (público)
**Content-Type:** `application/json`

---

## Request Body

### Campos Requeridos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `texto` | `string` | Texto completo de la notificación de pago (capturado desde la app) |
| `codigo_dispositivo` | `string` | Código único del dispositivo que envía la notificación |

### Ejemplo de Request

```json
{
  "texto": "Recibiste S/ 150.00 de JUAN PEREZ LOPEZ. Operación: 4321567890 • Código de seguridad: 8765",
  "codigo_dispositivo": "L1-000"
}
```

---

## Códigos de Dispositivo Válidos

### OVERSHARK - LIMA (4 dispositivos)
- `L1-000` - Lima 1 (+51981139000)
- `L2-378` - Lima 2 (+51981139378)
- `L3-711` - Lima 3 (+51981139711)
- `L4-138` - Lima 4 (+51981139138)

### OVERSHARK - PROVINCIA (7 dispositivos)
- `P1-556` - Provincia 1 (+51981139556)
- `P1-A-375` - Provincia 1-A (+51981139375)
- `P2-576` - Provincia 2 (+51981139576)
- `P3-825` - Provincia 3 (+51981139825)
- `P4-101` - Provincia 4 (+51981139101)
- `P4-A-262` - Provincia 4-A (+51981139262)
- `P5-795` - Provincia 5 (+51981139795)

### OVERSHARK - TIKTOK (4 dispositivos)
- `TK1-320` - TikTok 1 (+51981139320)
- `TK2-505` - TikTok 2 (+51981139505)
- `TK3-016` - TikTok 3 (+51981139016)
- `TK6-600` - TikTok 6 (+51981139600)

### OVERSHARK - TRANSFERENCIAS (2 dispositivos)
- `TRANSF.0102` - Transferencia Overshark 0102
- `TRANSF.5094` - Transferencia Overshark 5094

### BRAVO'S - YAPE (2 dispositivos)
- `PUB BRAV-829` - Pub Bravo's (+51981139829)
- `LIVE BRAV-402` - Live Bravo's (+51981139402)

### BRAVO'S - TRANSFERENCIAS (2 dispositivos)
- `TRANSF.4006` - Transferencia Bravo's 4006
- `TRANSF.0040` - Transferencia Bravo's 0040

---

## Tipos de Pago Soportados

El sistema detecta automáticamente el tipo de pago según el formato del texto:

| Tipo | Detección Automática | Parseo Automático |
|------|---------------------|-------------------|
| `YAPE` | Sí | Sí |
| `PLIN` | Sí | Sí |
| `BCP` | Sí | Sí |
| `INTERBANK` | Sí | Sí |
| `IMAGEN_MANUAL` | Sí | No (requiere revisión manual) |
| `OTRO` | Sí | No (requiere revisión manual) |

---

## Respuestas

### ✅ Éxito (200 OK)

**Caso 1: Notificación parseada correctamente**
```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "4321567890",
  "tipo_pago": "YAPE",
  "monto": 150.00,
  "codigo_dispositivo": "L1-000",
  "estado": "PENDIENTE_VALIDACION",
  "requiere_revision_manual": false
}
```

**Caso 2: Requiere revisión manual**
```json
{
  "message": "Notificación guardada - Requiere revisión manual",
  "numero_operacion": "TEMP-1733425874000-L1-000",
  "tipo_pago": "IMAGEN_MANUAL",
  "monto": null,
  "codigo_dispositivo": "L1-000",
  "estado": "REVISION_MANUAL",
  "requiere_revision_manual": true
}
```

### ❌ Error 400 - Bad Request

**Caso 1: Body vacío**
```json
{
  "error": "Body requerido"
}
```

**Caso 2: Faltan campos requeridos**
```json
{
  "error": "Faltan campos requeridos: texto, codigo_dispositivo"
}
```

**Caso 3: Código de dispositivo inválido**
```json
{
  "error": "Código de dispositivo inválido: XYZ-999"
}
```

### ❌ Error 500 - Internal Server Error

```json
{
  "error": "Error interno del servidor",
  "details": "Descripción del error"
}
```

---

## Estados de Notificación

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE_VALIDACION` | Notificación parseada correctamente, lista para validación automática |
| `REVISION_MANUAL` | Notificación que requiere revisión manual por un administrador |
| `VALIDADA` | Notificación validada exitosamente (después de matching) |
| `RECHAZADA` | Notificación rechazada (no coincide con ninguna venta) |

---

## Ejemplos de Uso

### cURL - Notificación de Yape

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "texto": "Recibiste S/ 150.00 de JUAN PEREZ LOPEZ. Operación: 4321567890 • Código de seguridad: 8765",
    "codigo_dispositivo": "L1-000"
  }'
```

### JavaScript (Fetch API)

```javascript
const notificacion = {
  texto: "Recibiste S/ 150.00 de JUAN PEREZ LOPEZ. Operación: 4321567890 • Código de seguridad: 8765",
  codigo_dispositivo: "L1-000"
};

fetch('https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(notificacion)
})
  .then(response => response.json())
  .then(data => console.log('Respuesta:', data))
  .catch(error => console.error('Error:', error));
```

### Python (requests)

```python
import requests

url = "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones"
payload = {
    "texto": "Recibiste S/ 150.00 de JUAN PEREZ LOPEZ. Operación: 4321567890 • Código de seguridad: 8765",
    "codigo_dispositivo": "L1-000"
}

response = requests.post(url, json=payload)
print(response.json())
```

### Node.js (axios)

```javascript
const axios = require('axios');

const notificacion = {
  texto: "Recibiste S/ 150.00 de JUAN PEREZ LOPEZ. Operación: 4321567890 • Código de seguridad: 8765",
  codigo_dispositivo: "L1-000"
};

axios.post('https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones', notificacion)
  .then(response => {
    console.log('Respuesta:', response.data);
  })
  .catch(error => {
    console.error('Error:', error.response?.data || error.message);
  });
```

---

## Flujo de Procesamiento

1. **Recepción**: El endpoint recibe la notificación desde la app móvil
2. **Validación**: Verifica que existan los campos requeridos y el código de dispositivo sea válido
3. **Detección**: Identifica automáticamente el tipo de pago (YAPE, PLIN, BCP, etc.)
4. **Parseo**: Extrae los datos estructurados del texto (monto, número de operación, nombre, etc.)
5. **Almacenamiento**: Guarda la notificación en DynamoDB
6. **Actualización**: Registra la última actividad del dispositivo
7. **Respuesta**: Devuelve confirmación con los datos parseados

---

## Datos Almacenados en DynamoDB

La notificación se guarda en la tabla `overshark-backend-dev-notificaciones` con el siguiente formato:

```json
{
  "PK": "NOTIF#4321567890",
  "SK": "2025-12-05T18:30:00.000Z",
  "tipo_pago": "YAPE",
  "texto_raw": "Recibiste S/ 150.00 de JUAN PEREZ LOPEZ. Operación: 4321567890 • Código de seguridad: 8765",
  "monto": 150.00,
  "nombre_pagador": "JUAN PEREZ LOPEZ",
  "codigo_seguridad": "8765",
  "numero_operacion": "4321567890",
  "fecha_hora": "2025-12-05T18:30:00.000Z",
  "codigo_dispositivo": "L1-000",
  "estado": "PENDIENTE_VALIDACION",
  "parseado": true,
  "created_at": "2025-12-05T18:30:00.000Z"
}
```

---

## Notas Importantes

1. **Sin Autenticación**: Este endpoint es público para permitir que las apps móviles envíen notificaciones sin complejidad adicional
2. **Validación de Dispositivo**: Solo acepta códigos de dispositivo previamente configurados (21 dispositivos)
3. **Parseo Automático**: Soporta múltiples formatos de notificación de diferentes bancos
4. **Revisión Manual**: Algunas notificaciones (imágenes, formatos desconocidos) se marcan para revisión manual
5. **Idempotencia**: Si se envía la misma operación múltiples veces, se puede detectar por el número de operación

---

## Próximos Pasos

Después de guardar una notificación:
1. El sistema puede validarla automáticamente con el endpoint `/validar`
2. Las notificaciones con `estado: "REVISION_MANUAL"` deben ser procesadas desde el dashboard
3. Los administradores pueden listar pendientes en `/dashboard/pendientes` (requiere autenticación)
4. Los administradores pueden aprobar/rechazar en `/dashboard/validar` (requiere autenticación)

---

## Soporte

Para reportar problemas o sugerencias, contacta al equipo de desarrollo.

**Versión del API:** 1.0
**Última actualización:** 2025-12-05
