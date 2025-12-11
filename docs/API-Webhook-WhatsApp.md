# API - Webhook de WhatsApp Business

Documentación técnica del endpoint del webhook de WhatsApp Business API.

## Información General

**Base URL:** `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com`

**Endpoints:**
- `GET /webhook` - Verificación del webhook (una sola vez)
- `POST /webhook` - Recepción de eventos de WhatsApp (continuo)

**Handler:** `src/handlers/webhookWhatsApp.ts`

---

## GET /webhook

### Descripción
Endpoint de verificación requerido por Meta/Facebook al configurar el webhook. Se llama una sola vez durante la configuración inicial.

### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `hub.mode` | string | Sí | Debe ser `"subscribe"` |
| `hub.verify_token` | string | Sí | Token de verificación configurado |
| `hub.challenge` | string | Sí | Valor aleatorio a devolver |

### Request Example

```http
GET /webhook?hub.mode=subscribe&hub.verify_token=9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20&hub.challenge=1234567890
```

### Response

#### Success (200 OK)

**Headers:**
```
Content-Type: text/plain
```

**Body:**
```
1234567890
```
(Devuelve el mismo valor de `hub.challenge`)

#### Error (403 Forbidden)

Cuando el token no coincide:

```
Forbidden
```

### Código de Referencia

```typescript
// src/handlers/webhookWhatsApp.ts:36-74
if (httpMethod === 'GET') {
  if (WhatsAppService.verificarWebhook(mode, token, verifyToken)) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'text/plain' },
      body: challenge || '',
    };
  }
  return { statusCode: 403, body: 'Forbidden' };
}
```

---

## POST /webhook

### Descripción
Recibe eventos en tiempo real desde WhatsApp Business API. Este endpoint procesa dos tipos principales de eventos:

1. **Mensajes ENTRANTES** - Mensajes enviados por usuarios al bot
2. **Estados de MENSAJES SALIENTES** - Notificaciones de estado de mensajes enviados por el bot

### Headers

| Header | Valor | Requerido |
|--------|-------|-----------|
| `Content-Type` | `application/json` | Sí |

### Request Body Structure

```typescript
{
  object: string;                    // "whatsapp_business_account"
  entry: [
    {
      id: string;                    // ID de la cuenta de WhatsApp Business
      changes: [
        {
          value: {
            messaging_product: string;    // "whatsapp"
            metadata: {
              display_phone_number: string;
              phone_number_id: string;
            };
            contacts?: [...];              // Info de usuarios
            messages?: [...];              // Mensajes ENTRANTES
            statuses?: [...];              // Estados SALIENTES
          };
          field: string;                   // "messages"
        }
      ]
    }
  ]
}
```

---

## Tipo 1: Mensaje ENTRANTE (de usuario)

### Cuándo ocurre
Cuando un usuario envía un mensaje al bot de WhatsApp.

### Request Example - Mensaje de Texto

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789012345",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "51983212138",
              "phone_number_id": "234567890123456"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Juan Perez"
                },
                "wa_id": "51987654321"
              }
            ],
            "messages": [
              {
                "from": "51987654321",
                "id": "wamid.HBgNNTE5ODc2NTQzMjEVAgARGBI4...",
                "timestamp": "1732276440",
                "type": "text",
                "text": {
                  "body": "Hola"
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Request Example - Imagen

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789012345",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "51983212138",
              "phone_number_id": "234567890123456"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Juan Perez"
                },
                "wa_id": "51987654321"
              }
            ],
            "messages": [
              {
                "from": "51987654321",
                "id": "wamid.HBgNNTE5ODc2NTQzMjEVAgARGBI4...",
                "timestamp": "1732276445",
                "type": "image",
                "image": {
                  "id": "1234567890123456",
                  "mime_type": "image/jpeg",
                  "sha256": "abc123def456..."
                }
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Tipos de Mensaje Soportados

| Tipo | Campo en Request | Procesado |
|------|------------------|-----------|
| `text` | `message.text.body` | ✅ Sí |
| `image` | `message.image.id` | ✅ Sí |
| `audio` | `message.audio.id` | ❌ No |
| `video` | `message.video.id` | ❌ No |
| `document` | `message.document.id` | ❌ No |

---

## Tipo 2: Estado de Mensaje SALIENTE

### Cuándo ocurre
Cuando un mensaje enviado por el bot cambia de estado (enviado, entregado, leído, fallido).

### Request Example - Mensaje Entregado

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789012345",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "51983212138",
              "phone_number_id": "234567890123456"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNTE5ODc2NTQzMjEVAgARGBI4...",
                "status": "delivered",
                "timestamp": "1732276450",
                "recipient_id": "51987654321"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Request Example - Mensaje Fallido

```json
{
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "123456789012345",
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "51983212138",
              "phone_number_id": "234567890123456"
            },
            "statuses": [
              {
                "id": "wamid.HBgNNTE5ODc2NTQzMjEVAgARGBI4...",
                "status": "failed",
                "timestamp": "1732276455",
                "recipient_id": "51987654321",
                "errors": [
                  {
                    "code": 131000,
                    "title": "Something went wrong",
                    "message": "Something went wrong",
                    "error_data": {
                      "details": "Something went wrong."
                    }
                  }
                ]
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
}
```

### Estados Posibles

| Estado | Descripción |
|--------|-------------|
| `sent` | Mensaje enviado al servidor de WhatsApp |
| `delivered` | Mensaje entregado al dispositivo del usuario |
| `read` | Mensaje leído por el usuario |
| `failed` | Mensaje falló al enviarse |

### Errores Comunes

| Código | Título | Causa Común |
|--------|--------|-------------|
| 131000 | Something went wrong | Usuario no ha iniciado conversación / Ventana de 24h expirada |
| 131026 | Message Undeliverable | Número no registrado en WhatsApp |
| 131047 | Re-engagement message | Ventana de 24 horas expirada, requiere plantilla |

---

## Response

### Success (200 OK)

El webhook SIEMPRE debe responder con 200, incluso si hay errores internos. WhatsApp reintentará si recibe otro código.

```json
{
  "message": "Procesado exitosamente"
}
```

### Error (500 Internal Server Error)

Solo en caso de errores críticos no manejados:

```json
{
  "error": "Error interno del servidor",
  "details": "Descripción del error"
}
```

---

## Flujo de Validación de Vouchers

### PASO 1: Vendedor envía IMAGEN

**Usuario envía:** Foto del voucher de Yape

**Sistema:**
1. Recibe evento con `message.type = "image"`
2. Descarga la imagen usando `message.image.id`
3. Guarda en S3
4. Procesa con Textract (OCR)
5. Extrae: monto, número operación, código seguridad, fecha/hora
6. Crea sesión temporal (TTL 30 min) en DynamoDB
7. Envía mensaje solicitando datos adicionales

**Bot responde:**
```
✅ Imagen recibida correctamente.

Ahora envíame los siguientes datos en este formato:

Nombre completo del cliente
Código del servicio

Ejemplo:
Juan Carlos Perez Fernandez
TK6-600
```

**Código de referencia:** `webhookWhatsApp.ts:232-282`

### PASO 2: Vendedor envía TEXTO

**Usuario envía:**
```
Juan Carlos Perez Fernandez
TK6-600
```

**Sistema:**
1. Recibe evento con `message.type = "text"`
2. Verifica que existe sesión activa (`estado = "ESPERANDO_DATOS_TEXTO"`)
3. Parsea el texto:
   - Línea 1: Nombre del cliente
   - Línea 2: Código del servicio
   - Línea 3 (opcional): Teléfono del cliente
   - Línea 4 (opcional): Ubicación
4. Combina datos de IMAGEN + TEXTO
5. Valida con sistema de matching
6. Envía resultado al vendedor
7. Elimina sesión de DynamoDB

**Bot responde (éxito):**
```
✅ VOUCHER VALIDADO

Monto: S/ 100.00
Operación: 03443217
Cliente: Juan Carlos Perez Fernandez
Servicio: TK6-600
Código Seg.: 502

Checks aprobados: 5/5 (100%)
```

**Bot responde (fallo):**
```
❌ VOUCHER RECHAZADO

Monto: S/ 100.00
Operación: 03443217

Checks aprobados: 2/5 (40%)

❌ Código de dispositivo no coincide
❌ Nombre del cliente no coincide
❌ Código de seguridad no coincide

Por favor revisa los datos y vuelve a intentarlo.
```

**Código de referencia:** `webhookWhatsApp.ts:287-339`

---

## Sistema de Auto-Registro de Vendedores

### Primera Vez que un Usuario Escribe

**Evento recibido:**
```json
{
  "messages": [{
    "from": "51999888777",
    "type": "text",
    "text": { "body": "Hola" }
  }]
}
```

**Sistema:**
1. Busca vendedor en DynamoDB (`VENDEDORES_TABLE`)
2. Si NO existe:
   - Crea registro con `estado: "PENDIENTE"`
   - Envía mensaje de bienvenida
   - NO procesa más mensajes hasta aprobación
3. Si existe:
   - Verifica estado (`APROBADO`, `PENDIENTE`, `RECHAZADO`, `BLOQUEADO`)
   - Procesa según permiso

**Bot responde (nuevo vendedor):**
```
👋 Bienvenido a Overshark Backend

📝 Tu número ha sido registrado automáticamente.

⏳ Tu solicitud está siendo revisada por un administrador.
Recibirás una notificación cuando seas aprobado.

Mientras tanto, puedes contactar al administrador si tienes preguntas.
```

**Código de referencia:** `webhookWhatsApp.ts:162-186`

### Estados de Vendedor

| Estado | Puede usar sistema | Mensaje al intentar usar |
|--------|-------------------|------------------------|
| `APROBADO` | ✅ Sí | - |
| `PENDIENTE` | ❌ No | "⏳ Tu solicitud está pendiente de aprobación..." |
| `RECHAZADO` | ❌ No | "🚫 Tu solicitud fue rechazada. Contacta al administrador." |
| `BLOQUEADO` | ❌ No | "🚫 Tu cuenta ha sido bloqueada. Contacta al administrador." |

**Código de referencia:** `vendedorService.ts`

---

## Gestión de Sesiones

### Tabla: sesiones_vendedores

**PK:** `SESION#{telefono}`

**Estructura:**
```typescript
{
  PK: "SESION#51987654321",
  estado: "ESPERANDO_DATOS_TEXTO",
  datosImagen: {
    monto: 100.0,
    codigoSeguridad: "502",
    numeroOperacion: "03443217",
    fechaHora: "2025-11-22T11:34:00"
  },
  s3Key: "vouchers/51987654321/2025-11-22T11:34:00.jpg",
  created_at: "2025-11-22T11:34:15.000Z",
  ttl: 1732278855  // 30 minutos después de created_at
}
```

**TTL:** 30 minutos (auto-eliminación por DynamoDB)

**Código de referencia:** `webhookWhatsApp.ts:263-274`

---

## Logging y Debugging

### Logs en CloudWatch

**Ver logs en tiempo real:**
```bash
# Windows (Git Bash)
MSYS_NO_PATHCONV=1 aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --since 5m --format short --follow

# Linux/Mac
aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --since 5m --format short --follow
```

### Eventos Loggeados

1. **Evento completo recibido:**
```
Event: { httpMethod: "POST", body: "{...}", ... }
```

2. **Tipo de webhook:**
```
📦 Webhook recibido: { object: "whatsapp_business_account", ... }
📋 Campo del webhook: messages
```

3. **Mensajes ENTRANTES:**
```
✅ Recibidos 1 mensaje(s) ENTRANTE(s) de usuario(s)
📨 Mensaje de: Juan Perez (51987654321), tipo: text
```

4. **Estados SALIENTES:**
```
📊 Recibidos 1 estado(s) de mensaje(s) SALIENTE(s)
📤 Estado de mensaje saliente: { id: "wamid...", status: "delivered", ... }
```

5. **Auto-registro:**
```
📝 Auto-registrando nuevo vendedor: 51987654321
⚠️ Notificar admin: Nuevo vendedor pendiente de aprobación
```

6. **Acceso denegado:**
```
🚫 Acceso denegado para vendedor: 51987654321, razón: Tu solicitud está pendiente...
```

**Código de referencia:** `webhookWhatsApp.ts:29, 87-135`

---

## Testing

### Test de Verificación (GET)

```bash
bash scripts/test-webhook-verification.sh
```

**Salida esperada:**
```
✅ ¡Verificación EXITOSA!
Challenge recibido: 1234567890
```

### Test con Mensaje Real

1. Desde WhatsApp personal, agrega: `+51 983 212 138`
2. Envía: `"Hola"`
3. Verifica logs:

```bash
MSYS_NO_PATHCONV=1 aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --since 2m --follow
```

### Test Manual con curl

**Verificación (GET):**
```bash
curl "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook?hub.mode=subscribe&hub.verify_token=9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20&hub.challenge=test123"
```

**Respuesta esperada:**
```
test123
```

---

## Seguridad

### Validaciones Implementadas

1. **Token de verificación:** Solo acepta el token configurado en GET
2. **Verificación de vendedor:** Solo vendedores aprobados pueden validar vouchers
3. **Sesiones con TTL:** Sesiones expiran automáticamente en 30 minutos
4. **Auto-registro controlado:** Nuevos usuarios quedan en estado PENDIENTE
5. **Estados de mensaje:** Se loggean errores de mensajes fallidos

### Recomendaciones Adicionales

- ✅ Mantener el `WHATSAPP_VERIFY_TOKEN` secreto
- ✅ Rotar el `WHATSAPP_ACCESS_TOKEN` periódicamente
- ✅ Monitorear errores 131000 (usuarios no iniciaron conversación)
- ✅ Revisar vendedores pendientes regularmente

---

## Referencias

- **Código fuente:** `src/handlers/webhookWhatsApp.ts`
- **Tipos TypeScript:** `src/types/whatsapp.ts`
- **Servicio WhatsApp:** `src/services/whatsapp.ts`
- **Servicio Vendedores:** `src/services/vendedorService.ts`
- **Configuración:** `docs/Guia-Configuracion-Webhook-WhatsApp.md`
- **Conceptos:** `docs/Entendiendo-Webhooks-WhatsApp.md`
- **Auto-registro:** `docs/Sistema-Auto-Registro-Vendedores.md`
- **Documentación oficial:** https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks
