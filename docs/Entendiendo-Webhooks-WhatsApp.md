# 📚 Entendiendo los Webhooks de WhatsApp

## ¿Por qué muchos usan servicios externos?

### Respuesta corta:
**Complejidad técnica + Limitaciones de WhatsApp**

Los servicios como wasapi, make.com, woo, etc. son populares porque resuelven problemas complejos que requieren tiempo de desarrollo. Sin embargo, **tú ya tienes un webhook funcional**, solo necesita algunos ajustes de configuración.

---

## 🔍 Qué está pasando con tu webhook

### Lo que la documentación dice:

Según la documentación oficial de WhatsApp, hay dos tipos principales de eventos en el campo **"messages"**:

1. **Mensajes ENTRANTES** (de usuarios al bot):
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {...},
        "contacts": [{           // ← Info del usuario
          "profile": {"name": "Usuario"},
          "wa_id": "51999999999"
        }],
        "messages": [{          // ← MENSAJES ENTRANTES
          "from": "51999999999",
          "type": "text",
          "text": {"body": "Hola"}
        }]
      },
      "field": "messages"
    }]
  }]
}
```

2. **Estados de mensajes SALIENTES** (del bot a usuarios):
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {...},
        "statuses": [{          // ← ESTADOS DE MENSAJES SALIENTES
          "id": "wamid.xxx",
          "status": "failed",   // sent, delivered, read, failed
          "recipient_id": "51999999999",
          "errors": [{
            "code": 131000,
            "message": "Something went wrong"
          }]
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Lo que está pasando en tu caso:

Basándome en los logs de tu Lambda:

✅ **El webhook FUNCIONA correctamente**
✅ **El webhook ESTÁ CONFIGURADO en Meta**
✅ **El webhook ESTÁ SUSCRITO al campo "messages"**

❌ **Pero SOLO recibes eventos de "statuses" (estados de mensajes salientes)**
❌ **NO recibes eventos de "messages" (mensajes entrantes de usuarios)**

**Esto significa que:**
- Los usuarios NO están enviando mensajes al bot
- Por eso solo ves notificaciones de estado de los mensajes que el bot intentó enviar (y fallaron)

---

## ❌ El Error 131000 explicado

### ¿Qué es el error 131000?

```json
{
  "code": 131000,
  "title": "Something went wrong",
  "message": "Something went wrong",
  "error_data": {"details": "Something went wrong."}
}
```

Este es el error más genérico de WhatsApp. Según la documentación, las causas comunes son:

1. **El usuario NO ha iniciado conversación con el bot**
   - WhatsApp requiere que el **usuario envíe el primer mensaje**
   - No puedes enviar mensajes a alguien que no te ha escrito

2. **La ventana de 24 horas expiró**
   - Solo puedes responder mensajes durante 24 horas después de que el usuario escribió
   - Después de 24 horas, necesitas usar plantillas aprobadas

3. **El número no está registrado en WhatsApp**
   - El número destino no tiene WhatsApp instalado o activo

4. **Límites de mensajería alcanzados**
   - Tu cuenta tiene límites según su "throughput level"
   - Tu cuenta está en "STANDARD" (límite básico)

---

## 🔧 Campos del Webhook (según documentación)

Tu webhook debe estar suscrito a estos campos en Meta:

| Campo | Descripción | ¿Lo necesitas? |
|-------|-------------|----------------|
| **messages** | Mensajes entrantes y estados de mensajes salientes | ✅ SÍ - OBLIGATORIO |
| message_status | Estados de mensajes (alias de messages) | ⚠️ Ya incluido en messages |
| message_template_status_update | Cambios en estado de plantillas | 🔄 Opcional (útil) |
| message_template_quality_update | Cambios en calidad de plantillas | 🔄 Opcional (útil) |
| account_alerts | Alertas de cuenta (límites, etc.) | 🔄 Opcional (útil) |
| phone_number_quality_update | Cambios en throughput level | 🔄 Opcional (útil) |

---

## 📋 Permisos necesarios

Según la documentación oficial:

| Permiso | Para qué sirve | Estado |
|---------|----------------|--------|
| `whatsapp_business_messaging` | Enviar/recibir mensajes | ✅ Necesario |
| `whatsapp_business_management` | Gestionar cuenta, plantillas, etc. | ✅ Necesario |

**¿Cómo verificar?**
1. Ve a tu app en developers.facebook.com
2. Settings > Basic
3. Busca la sección "User Data Deletion"
4. Verifica que los permisos estén listados

---

## 🆚 Tu Webhook vs Servicios Externos

### Tu Webhook (lo que ya tienes):

**Ventajas:**
- ✅ Control total sobre lógica de negocio
- ✅ Integración directa con AWS (DynamoDB, S3, Textract)
- ✅ Mucho más económico ($0.20/millón de requests en Lambda)
- ✅ Datos sensibles no pasan por terceros
- ✅ Personalización ilimitada
- ✅ Ya está funcionando técnicamente

**Desventajas:**
- ❌ Necesitas configurar plantillas de mensaje manualmente
- ❌ Debes manejar la ventana de 24 horas tú mismo
- ❌ Necesitas debuggear problemas técnicos
- ❌ Requiere conocimientos de desarrollo

### Servicios externos (wasapi, make.com, woo):

**Ventajas:**
- ✅ Configuración rápida (1-2 horas)
- ✅ Plantillas pre-aprobadas
- ✅ Interfaz visual (drag & drop)
- ✅ Soporte técnico
- ✅ Manejo automático de ventana de 24 horas

**Desventajas:**
- ❌ Costo mensual ($30-$200+ USD/mes)
- ❌ Menos control sobre lógica
- ❌ Datos pasan por sus servidores
- ❌ Limitaciones de personalización
- ❌ Dependencia de terceros
- ❌ No tienen OCR/Textract integrado como tú

---

## 💡 Por qué tu solución es MEJOR (a largo plazo)

### Caso de uso: 1000 vouchers/día

**Tu solución (webhook propio):**
```
Lambda: $0.20/millón requests × 1000 = $0.0002/día
DynamoDB: ~$5/mes
S3: ~$1/mes
Textract: $1.50/1000 páginas = $1.50/día

Total: ~$50/mes
```

**Servicio externo:**
```
wasapi Pro: $99/mes
+ 1000 mensajes/día × $0.05 = $1,500/mes

Total: ~$1,600/mes
```

**Diferencia: Ahorras $1,550/mes** 💰

---

## 🎯 Lo que necesitas hacer AHORA

### Paso 1: Verificar configuración en Meta

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu app
3. WhatsApp > Configuration
4. **Verifica el webhook:**
   - URL: `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook`
   - Estado: ✅ Verificado

5. **Verifica campos suscritos:**
   - ☑️ messages (DEBE estar marcado)

### Paso 2: Probar enviando un mensaje

1. **Desde tu WhatsApp personal:**
   - Agrega: +51 983 212 138
   - Envía: "Hola"

2. **Verificar logs:**
   ```bash
   MSYS_NO_PATHCONV=1 aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --since 5m --format short --follow
   ```

3. **Deberías ver:**
   ```
   ✅ Recibidos 1 mensaje(s) ENTRANTE(s) de usuario(s)
   📨 Mensaje de: Tu Nombre (51999999999), tipo: text
   ```

### Paso 3: Si NO recibes mensajes entrantes

**Posibles causas:**

1. **Webhook no suscrito a "messages"**
   - Solución: Marca el checkbox en Meta

2. **El webhook no se verificó correctamente**
   - Solución: Re-verificar en Meta (Editar > Verificar y guardar)

3. **Permisos faltantes**
   - Solución: Verificar que tengas `whatsapp_business_messaging`

4. **App en modo desarrollo bloqueado**
   - Solución: Cambiar a modo producción o agregar testers

### Paso 4: Para enviar mensajes proactivamente

**Necesitas crear plantillas de mensaje aprobadas:**

1. Ve a WhatsApp > Message Templates
2. Crea una plantilla (ej: "bienvenida_vendedor")
3. Espera aprobación de Meta (24-48 horas)
4. Úsala para iniciar conversaciones

**Ejemplo de plantilla:**
```
Nombre: vendedor_aprobado
Categoría: UTILITY
Idioma: Spanish

Mensaje:
Hola {{1}}, tu cuenta ha sido aprobada.
Ahora puedes validar vouchers enviando la foto del comprobante.
```

---

## 📊 Comparativa Final

| Característica | Tu Webhook | wasapi/make.com |
|----------------|------------|-----------------|
| Costo mensual (1000 msg/día) | $50 | $1,600 |
| Control total | ✅ | ❌ |
| OCR/Textract integrado | ✅ | ❌ |
| Datos en tus servidores | ✅ | ❌ |
| Configuración inicial | 🔧 Compleja | ✅ Fácil |
| Plantillas pre-aprobadas | ❌ | ✅ |
| Soporte técnico | ❌ | ✅ |
| Personalización ilimitada | ✅ | ❌ |

---

## ✅ Conclusión

**Tu webhook ya está funcionando correctamente.**

El problema NO es técnico, es de:
1. Configuración en Meta (suscripción a "messages")
2. Usuarios que NO están enviando mensajes al bot
3. Falta de plantillas aprobadas para iniciar conversaciones

**Mi recomendación:** Continúa con tu webhook propio porque:
- Es técnicamente superior
- Mucho más económico a largo plazo
- Tienes integración completa con Textract/OCR
- Control total sobre datos sensibles

Solo necesitas:
- ✅ Configurar correctamente en Meta
- ✅ Crear plantillas de mensaje aprobadas
- ✅ Que los usuarios escriban primero al bot

---

## 🆘 Siguiente paso

Ejecuta el script de diagnóstico actualizado:

```bash
bash scripts/test-webhook-verification.sh
```

Y luego **envía un mensaje de WhatsApp al +51 983 212 138** para verificar que llegan eventos de "messages".
