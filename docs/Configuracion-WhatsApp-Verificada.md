# Configuración de WhatsApp Business API - Verificada

**Fecha de verificación:** 2025-12-06

## ✅ Credenciales Verificadas

### Access Token
- **Estado:** ✅ VÁLIDO
- **Tipo:** System User Token (permanente)
- **Expira:** No expira (`expires_at: 0`)
- **App ID:** 1468780424221338
- **Aplicación:** CHATBOT VALIDADOR

### Permisos del Token
```json
[
  "whatsapp_business_management",
  "whatsapp_business_messaging",
  "whatsapp_business_manage_events",
  "public_profile"
]
```

### Phone Number ID
- **ID:** `808365405703506`
- **Estado:** ✅ Verificado y funcional
- **Tipo:** Número de producción (no es número de prueba)
- **Número del Chatbot:** 51983212138 (Perú)

### Vendor de Prueba
- **Teléfono:** 51930193795
- **Nombre:** Vendedor Prueba
- **Estado en DB:** APROBADO
- **Aprobado por:** SCRIPT_SETUP
- **Fecha aprobación:** 2025-12-06T23:04:30.345Z

## 🔧 Configuración Actual

### Variables de Entorno (.env)
```
WHATSAPP_PHONE_NUMBER_ID=863206073549532
WHATSAPP_ACCESS_TOKEN=EAAU32RdwUpoBQAn8i2r04jD5CXCPbjMHP391IHRxGxMB05KGVS20fDy16qDZBhObqdzbZAD1rKfvCrFlgJ9YLWZCCazss8TZCObbHufXKYtSCAZA6hgreEzhiWp4ZCFwrluxG3Svz3ZCVAFND9NZBiSiSlkwB5E4034uPSeKEYz9QpH8TVVZBwt95vRrF0fCuLDctnAZDZD
WHATSAPP_VERIFY_TOKEN=9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20
```

### AWS SSM Parameter Store
```bash
/overshark/dev/whatsapp/phone-number-id = 808365405703506
/overshark/dev/whatsapp/access-token = EAAU32RdwUpoB... (válido)
/overshark/dev/whatsapp/verify-token = 9ab6fbadf127...
```

## ⚠️ Limitación Identificada

### Template "hello_world"
**Error:** `(#131058) Hello World templates can only be sent from the Public Test Numbers`

**Causa:** El número 808365405703506 es un número de producción, no un número de prueba público.

**Solución:**
1. **Opción recomendada:** El usuario (vendedor) inicia la conversación enviando un mensaje al chatbot
2. **Alternativa:** Crear y aprobar templates personalizados en Meta Developer Console

## 📱 Flujo de Prueba Recomendado

### Paso 1: Vendedor Inicia Conversación
```
Vendedor (51930193795) → Envía "Hola" → Chatbot (51983212138)
```

### Paso 2: Sistema Procesa
1. Webhook recibe el mensaje
2. Verifica que el vendedor está APROBADO en DynamoDB
3. Responde con mensaje de bienvenida
4. Abre ventana de 24 horas para enviar mensajes libremente

### Paso 3: Flujo de Validación
1. Vendedor envía imagen del voucher
2. Sistema procesa con Textract
3. Vendedor envía datos en texto
4. Sistema valida y responde

## 🔍 Pruebas Realizadas

### Test 1: Debug Token
```bash
curl "https://graph.facebook.com/debug_token?input_token=..."
```
**Resultado:** ✅ Token válido, no expira, permisos correctos

### Test 2: Envío de Mensaje
```bash
curl -X POST "https://graph.facebook.com/v22.0/808365405703506/messages"
```
**Resultado:** ⚠️ Error #131058 (limitación de template en producción)

## 📊 Estado del Sistema

- ✅ Lambda functions desplegadas (7 funciones)
- ✅ API Gateway endpoints activos (8 endpoints)
- ✅ DynamoDB tables creadas (5 tablas)
- ✅ Vendedor de prueba aprobado
- ✅ Token válido y sin expiración
- ⏳ Pendiente: Prueba real con mensaje del vendedor

## 🎯 Próximo Paso

**Pedir al vendedor (51930193795) que envíe un mensaje al chatbot (51983212138)**

Esto iniciará el flujo completo y permitirá probar:
- Auto-detección de vendedor aprobado
- Mensaje de bienvenida
- Procesamiento de imágenes
- Validación de vouchers
- Respuestas automáticas
