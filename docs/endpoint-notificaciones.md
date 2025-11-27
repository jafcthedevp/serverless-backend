# 📱 Endpoint: Guardar Notificación de Yape

## Información General

**URL:** `POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones`

**Propósito:** Recibe y guarda notificaciones de Yape capturadas automáticamente desde las apps móviles instaladas en los 21 dispositivos.

---

## Request

### Headers
```http
Content-Type: application/json
```

### Body (JSON)

```json
{
  "texto": "¡Yapeaste!\nS/100\nJuan C. Perez F.\n22 nov. 2025 | 11:34 a.m.\nCÓDIGO DE SEGURIDAD\n5 0 2\nNro. de operación\n03443217",
  "codigo_dispositivo": "TK6-600",
  "timestamp": 1732276440000
}
```

### Parámetros

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `texto` | string | ✅ Sí | Texto completo de la notificación de Yape capturada |
| `codigo_dispositivo` | string | ✅ Sí | Código del dispositivo (Ej: TK6-600, L1-000, P2-576) |
| `timestamp` | number | ⚪ Opcional | Timestamp Unix en milisegundos |

### Códigos de Dispositivo Válidos

**OVERSHARK - Lima:**
- `L1-000`, `L2-378`, `L3-711`, `L4-138`

**OVERSHARK - Provincia:**
- `P1-556`, `P1-A-375`, `P2-576`, `P3-825`, `P4-101`, `P4-A-262`, `P5-795`

**OVERSHARK - TikTok:**
- `TK1-320`, `TK2-505`, `TK3-016`, `TK6-600`

**OVERSHARK - Transferencias:**
- `TRANSF.0102`, `TRANSF.5094`

**BRAVO'S:**
- `PUB BRAV-829`, `LIVE BRAV-402`, `TRANSF.4006`, `TRANSF.0040`

---

## Response

### ✅ Success (200 OK)

```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "03443217",
  "monto": 100.0,
  "codigo_dispositivo": "TK6-600"
}
```

### ❌ Error 400 - Campos Faltantes

```json
{
  "error": "Faltan campos requeridos: texto, codigo_dispositivo"
}
```

### ❌ Error 400 - Código Inválido

```json
{
  "error": "Código de dispositivo inválido: XYZ-999"
}
```

### ❌ Error 400 - No se pudo parsear

```json
{
  "error": "No se pudo extraer información de la notificación"
}
```

### ❌ Error 500 - Error Interno

```json
{
  "error": "Error interno del servidor",
  "details": "Mensaje de error específico"
}
```

---

## Ejemplo de Uso

### JavaScript/TypeScript (React Native)

```typescript
const enviarNotificacion = async (textoYape: string, codigoDispositivo: string) => {
  try {
    const response = await fetch(
      'https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: textoYape,
          codigo_dispositivo: codigoDispositivo,
          timestamp: Date.now(),
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Notificación enviada:', data.numero_operacion);
      return data;
    } else {
      console.error('❌ Error:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('❌ Error de red:', error);
    throw error;
  }
};

// Uso
await enviarNotificacion(notificationText, 'TK6-600');
```

### cURL

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "texto": "¡Yapeaste!\\nS/100\\nJuan C. Perez F.\\n22 nov. 2025 | 11:34 a.m.\\nCÓDIGO DE SEGURIDAD\\n5 0 2\\nNro. de operación\\n03443217",
    "codigo_dispositivo": "TK6-600",
    "timestamp": 1732276440000
  }'
```

---

## Proceso Interno

1. **Validación** del body y campos requeridos
2. **Validación** del código de dispositivo contra lista de 21 códigos válidos
3. **Parseo** automático de la notificación de Yape:
   - Extrae monto (S/100 → 100.0)
   - Extrae nombre del pagador
   - Extrae código de seguridad (5 0 2 → "502")
   - Extrae número de operación
   - Extrae fecha y hora
4. **Guardado** en DynamoDB tabla `notificaciones_yape`
5. **Actualización** de última notificación del dispositivo
6. **Respuesta** con datos extraídos

---

## Datos Guardados en DynamoDB

```json
{
  "PK": "NOTIF#03443217",
  "SK": "2025-11-22T11:34:00",
  "monto": 100.0,
  "nombre_pagador": "Juan C. Perez F.",
  "codigo_seguridad": "502",
  "numero_operacion": "03443217",
  "fecha_hora": "2025-11-22T11:34:00",
  "codigo_dispositivo": "TK6-600",
  "estado": "PENDIENTE_VALIDACION",
  "parseado": true,
  "created_at": "2025-11-26T20:30:00Z"
}
```

---

## Notas Importantes

⚠️ **Formato del texto:** Debe ser el texto exacto de la notificación de Yape tal como aparece en el dispositivo

⚠️ **Código único:** Cada número de operación solo se puede registrar una vez (clave primaria)

⚠️ **Estado inicial:** Todas las notificaciones se guardan con estado `PENDIENTE_VALIDACION`

✅ **Validación posterior:** Estas notificaciones serán validadas cuando un vendedor envíe un voucher por WhatsApp
