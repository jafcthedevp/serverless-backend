# Quick Start - API de Notificaciones

Guía rápida para integrar el endpoint de notificaciones en tu app móvil.

---

## 🚀 En 3 Pasos

### 1. Endpoint
```
POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones
```

### 2. Request
```json
{
  "texto": "Te pagaron S/150.00\nNombre: Juan Pérez\nOperación: 987654321 | Código de seguridad: 7890",
  "codigo_dispositivo": "L1-000"
}
```

### 3. Response
```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "987654321",
  "tipo_pago": "YAPE",
  "monto": 150.00,
  "estado": "PENDIENTE_VALIDACION"
}
```

---

## 📱 Código de Ejemplo

### React Native / JavaScript
```javascript
const enviarNotificacion = async (texto, codigo) => {
  const response = await fetch(
    'https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texto: texto,
        codigo_dispositivo: codigo
      })
    }
  );
  return await response.json();
};

// Uso
enviarNotificacion(
  "Te pagaron S/150.00\nNombre: Juan Pérez\nOperación: 987654321",
  "L1-000"
);
```

### Kotlin / Android
```kotlin
val json = JSONObject().apply {
    put("texto", textoNotificacion)
    put("codigo_dispositivo", "L1-000")
}

val body = json.toString()
    .toRequestBody("application/json".toMediaType())

val request = Request.Builder()
    .url("https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones")
    .post(body)
    .build()

client.newCall(request).execute()
```

### Swift / iOS
```swift
struct Notificacion: Codable {
    let texto: String
    let codigo_dispositivo: String
}

var request = URLRequest(
    url: URL(string: "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones")!
)
request.httpMethod = "POST"
request.setValue("application/json", forHTTPHeaderField: "Content-Type")
request.httpBody = try? JSONEncoder().encode(
    Notificacion(texto: textoNotificacion, codigo_dispositivo: "L1-000")
)

URLSession.shared.dataTask(with: request).resume()
```

---

## 🔑 Códigos de Dispositivos

### Lima
- `L1-000`, `L2-378`, `L3-711`, `L4-138`

### Provincia
- `P1-556`, `P1-A-375`, `P2-576`, `P3-825`, `P4-101`, `P4-A-262`, `P5-795`

### TikTok
- `TK1-320`, `TK2-505`, `TK3-016`, `TK6-600`

### Transferencias Overshark
- `TRANSF.0102`, `TRANSF.5094`

### Bravo's
- `PUB BRAV-829`, `LIVE BRAV-402`, `TRANSF.4006`, `TRANSF.0040`

[Ver lista completa con teléfonos →](./API-Mobile-Notificaciones.md#códigos-de-dispositivos-válidos)

---

## ⚠️ Errores Comunes

### Error 400: "Código de dispositivo inválido"
**Causa**: El `codigo_dispositivo` no existe en la lista
**Solución**: Verifica que estás usando un código válido de la lista

### Error 400: "Faltan campos requeridos"
**Causa**: Falta `texto` o `codigo_dispositivo` en el body
**Solución**: Asegúrate de enviar ambos campos

### Error 500: "Error interno del servidor"
**Causa**: Error en el backend
**Solución**: Reintenta después de 5 segundos. Si persiste, contacta al equipo backend

---

## 🧪 Test Rápido con cURL

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "texto": "Te pagaron S/150.00\nNombre: Test\nOperación: 123456",
    "codigo_dispositivo": "L1-000"
  }'
```

**Response esperado:**
```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "123456",
  "tipo_pago": "YAPE",
  "monto": 150.0,
  "codigo_dispositivo": "L1-000",
  "estado": "PENDIENTE_VALIDACION",
  "requiere_revision_manual": false
}
```

---

## 📖 Documentación Completa

Para información detallada sobre:
- Tipos de pago soportados
- Estados de notificación
- Manejo avanzado de errores
- Ejemplos completos de código
- Testing exhaustivo

**Lee**: [API-Mobile-Notificaciones.md](./API-Mobile-Notificaciones.md)

---

## 🆘 ¿Necesitas Ayuda?

1. **Revisa la documentación completa**: `API-Mobile-Notificaciones.md`
2. **Verifica los logs de CloudWatch**: `/aws/lambda/overshark-backend-dev-guardarNotificacion`
3. **Contacta al equipo backend**: Overshark Backend Team

---

**Última actualización**: 2025-12-08
