# 🔧 Guía: Configurar Webhook de WhatsApp Business

## ✅ Verificación Previa

Tu webhook está funcionando correctamente:
- ✅ URL: `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook`
- ✅ Endpoint GET responde correctamente
- ✅ Devuelve el challenge al verificar

---

## 📋 Pasos para Configurar en Meta/Facebook

### Paso 1: Acceder a la Configuración

1. Ve a: https://developers.facebook.com/apps
2. Selecciona tu aplicación de WhatsApp
3. En el menú lateral izquierdo, busca **"WhatsApp"** y haz clic en **"Configuración"** (o **"Configuration"**)

### Paso 2: Configurar el Webhook

En la sección **"Configuración del webhook"** o **"Webhook configuration"**:

1. **Haz clic en "Editar" o "Edit"**

2. **Ingresa los siguientes datos EXACTAMENTE como se muestran:**

   ```
   URL de devolución de llamada (Callback URL):
   https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook
   ```

   ⚠️ **IMPORTANTE**:
   - Copia y pega la URL completa
   - Asegúrate de incluir `https://`
   - NO agregues `/` al final
   - NO agregues parámetros adicionales

   ```
   Token de verificación (Verify Token):
   9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20
   ```

   ⚠️ **IMPORTANTE**:
   - Copia y pega el token COMPLETO
   - NO agregues espacios ni saltos de línea
   - Debe ser exactamente el mismo token

3. **Haz clic en "Verificar y guardar" o "Verify and Save"**

### Paso 3: Qué Esperar Durante la Verificación

Cuando hagas clic en "Verificar y guardar", Meta/Facebook:

1. 🔄 Enviará una petición GET a tu webhook
2. 📨 Tu webhook responderá con el challenge
3. ✅ Si la respuesta es correcta, mostrará: **"Webhook verificado correctamente"**
4. 💾 La configuración se guardará automáticamente

**Si NO ves el mensaje de éxito:**
- Verifica que copiaste exactamente la URL sin espacios
- Verifica que copiaste exactamente el token sin espacios
- Intenta hacer clic en "Verificar y guardar" nuevamente
- Si sigue fallando, ve a la sección "Solución de Problemas" abajo

### Paso 4: Suscribir a Campos de Webhook

Después de verificar exitosamente, **MUY IMPORTANTE**:

1. En la misma página, busca la sección **"Campos del webhook"** o **"Webhook fields"**
2. Verás una lista de opciones con checkboxes
3. **Marca las siguientes opciones:**
   - ☑️ **messages** (OBLIGATORIO - para recibir mensajes de usuarios)
   - ☑️ **message_status** (opcional - para ver estados de envío)

4. **Haz clic en "Guardar" o "Save"**

### Paso 5: Verificar la Configuración

Para confirmar que todo está bien:

1. En la página de configuración, deberías ver:
   ```
   ✅ URL del webhook: https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook
   ✅ Campos suscritos: messages, message_status
   ```

2. Puedes hacer una prueba enviando un mensaje de WhatsApp al número: **+51 983 212 138**

---

## 🚨 Solución de Problemas

### ❌ Problema: "Vuelve a la pantalla de configuración sin confirmación"

**Posibles causas y soluciones:**

1. **Token de verificación incorrecto**
   - ✅ Solución: Copia nuevamente el token desde esta guía
   - ✅ Asegúrate de NO tener espacios al inicio o final
   - ✅ El token debe ser: `9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20`

2. **URL incorrecta**
   - ✅ Solución: Copia nuevamente la URL desde esta guía
   - ✅ Debe incluir `https://`
   - ✅ NO debe tener `/` al final
   - ✅ La URL debe ser: `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook`

3. **Permisos de la aplicación**
   - Ve a "Configuración de la aplicación" > "Básica"
   - Verifica que el estado de la app no sea "En desarrollo bloqueado"

4. **Caché del navegador**
   - Intenta abrir la configuración en una ventana de incógnito
   - O usa otro navegador (Chrome, Firefox, Edge)

5. **Extensiones del navegador**
   - Desactiva temporalmente extensiones de seguridad o bloqueadores
   - Algunas extensiones pueden interferir con las peticiones

### ❌ Problema: "Error de red" o "No se puede conectar"

1. Verifica que la URL del webhook esté activa ejecutando:
   ```bash
   bash scripts/test-webhook-verification.sh
   ```
   Deberías ver: "✅ ¡Verificación EXITOSA!"

2. Si el test falla, contacta al equipo de desarrollo

### ❌ Problema: "El webhook se verificó pero no recibo mensajes"

1. Verifica que estés suscrito al campo **"messages"** (Paso 4)
2. El usuario debe enviar el **primer mensaje** al bot
3. Revisa los logs para confirmar que llegan los eventos:
   ```bash
   MSYS_NO_PATHCONV=1 aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --since 10m --format short --follow
   ```

---

## 📞 Prueba del Chatbot

Una vez configurado correctamente:

1. **Desde tu WhatsApp personal:**
   - Agrega el número: **+51 983 212 138** a tus contactos
   - Envía cualquier mensaje de texto (ej: "Hola")

2. **El bot debería responder con:**
   ```
   📸 Bienvenido al Sistema de Validación de Vouchers Yape

   Para validar un voucher:

   1️⃣ Envía la FOTO/CAPTURA del voucher de Yape
   2️⃣ Luego envía los datos en texto:

   Nombre del cliente
   Código del servicio (ej: NETFLIX)
   Teléfono del cliente (opcional)
   Ubicación (opcional)

   ✅ El sistema validará automáticamente.
   ```

3. **Si no recibes respuesta:**
   - Revisa los logs del webhook
   - Verifica que el campo "messages" esté suscrito
   - Contacta al equipo de desarrollo

---

## 🔑 Datos de Configuración (Referencia Rápida)

**URL del Webhook:**
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/webhook
```

**Token de Verificación:**
```
9ab6fbadf1272e6971ac45572c73bc159bf148516c192da8a780effb6d1d8d20
```

**Número de WhatsApp del Bot:**
```
+51 983 212 138
```

**Campos a Suscribir:**
- ☑️ messages
- ☑️ message_status (opcional)

---

## 📚 Referencias

- [Documentación oficial de WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)
- [Script de diagnóstico](../scripts/diagnosticar-whatsapp.js)
- [Script de prueba de verificación](../scripts/test-webhook-verification.sh)
