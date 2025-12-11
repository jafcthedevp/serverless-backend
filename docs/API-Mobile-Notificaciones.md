# API de Notificaciones - Documentación para Equipo Móvil

**Versión**: 1.0.0
**Última actualización**: Diciembre 2025
**Endpoint Base**: `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com`

---

## Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Endpoint POST /notificaciones](#endpoint-post-notificaciones)
- [Request Format](#request-format)
- [Response Format](#response-format)
- [Códigos de Dispositivos Válidos](#códigos-de-dispositivos-válidos)
- [Tipos de Pago Soportados](#tipos-de-pago-soportados)
- [Estados de Notificación](#estados-de-notificación)
- [Manejo de Errores](#manejo-de-errores)
- [Ejemplos de Código](#ejemplos-de-código)
- [Testing](#testing)

---

## Descripción General

Este endpoint permite a las aplicaciones móviles instaladas en los **21 dispositivos de recepción de pagos** enviar notificaciones de transacciones (Yape, Plin, transferencias bancarias, etc.) al backend para su procesamiento y validación automática.

### ¿Qué hace el endpoint?

1. **Recibe** el texto completo de la notificación de pago
2. **Detecta automáticamente** el tipo de pago (Yape, Plin, BCP, Interbank, etc.)
3. **Parsea** la información (monto, nombre, código de seguridad, número de operación)
4. **Guarda** la notificación en DynamoDB
5. **Determina** si requiere revisión manual o validación automática
6. **Responde** con los datos parseados y estado

---

## Endpoint POST /notificaciones

### URL
```
POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones
```

### Headers
```http
Content-Type: application/json
```

### Autenticación
- **No requiere autenticación** (los dispositivos son de confianza)
- Validación por `codigo_dispositivo` en lugar de token

---

## Request Format

### Campos Requeridos

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `texto` | `string` | Texto completo de la notificación de pago | Ver ejemplos abajo |
| `codigo_dispositivo` | `string` | Código único del dispositivo (ver lista abajo) | `"L1-000"`, `"P1-556"`, `"TK1-320"` |

### Campos Opcionales

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `metadata` | `object` | Información adicional del dispositivo (versión app, OS, etc.) |

### Ejemplo Request Body

```json
{
  "texto": "Te pagaron S/150.00\nNombre: Juan Pérez\nOperación: 987654321 | Código de seguridad: 7890\n5/12/2025 18:30",
  "codigo_dispositivo": "L1-000"
}
```

---

## Response Format

### Response Exitoso (200 OK)

```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "987654321",
  "tipo_pago": "YAPE",
  "monto": 150.00,
  "codigo_dispositivo": "L1-000",
  "estado": "PENDIENTE_VALIDACION",
  "requiere_revision_manual": false
}
```

### Response con Revisión Manual (200 OK)

```json
{
  "message": "Notificación guardada - Requiere revisión manual",
  "numero_operacion": "TEMP-1733687430123-L1-000",
  "tipo_pago": "OTRO",
  "monto": null,
  "codigo_dispositivo": "L1-000",
  "estado": "REVISION_MANUAL",
  "requiere_revision_manual": true
}
```

### Campos del Response

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `message` | `string` | Mensaje descriptivo del resultado |
| `numero_operacion` | `string` | Número de operación extraído o ID temporal |
| `tipo_pago` | `string` | Tipo de pago detectado (`YAPE`, `PLIN`, `BCP`, `INTERBANK`, `OTRO`, `IMAGEN_MANUAL`) |
| `monto` | `number \| null` | Monto parseado (null si no se pudo parsear) |
| `codigo_dispositivo` | `string` | Código del dispositivo que envió la notificación |
| `estado` | `string` | Estado inicial (`PENDIENTE_VALIDACION` o `REVISION_MANUAL`) |
| `requiere_revision_manual` | `boolean` | Indica si requiere que un humano revise la notificación |

---

## Códigos de Dispositivos Válidos

### OVERSHARK - LIMA (4 dispositivos)
```
L1-000    → Lima 1 (+51981139000)
L2-378    → Lima 2 (+51981139378)
L3-711    → Lima 3 (+51981139711)
L4-138    → Lima 4 (+51981139138)
```

### OVERSHARK - PROVINCIA (7 dispositivos)
```
P1-556    → Provincia 1 (+51981139556)
P1-A-375  → Provincia 1-A (+51981139375)
P2-576    → Provincia 2 (+51981139576)
P3-825    → Provincia 3 (+51981139825)
P4-101    → Provincia 4 (+51981139101)
P4-A-262  → Provincia 4-A (+51981139262)
P5-795    → Provincia 5 (+51981139795)
```

### OVERSHARK - TIKTOK (4 dispositivos)
```
TK1-320   → TikTok 1 (+51981139320)
TK2-505   → TikTok 2 (+51981139505)
TK3-016   → TikTok 3 (+51981139016)
TK6-600   → TikTok 6 (+51981139600)
```

### OVERSHARK - TRANSFERENCIAS (2 dispositivos)
```
TRANSF.0102  → Transferencia Overshark 0102
TRANSF.5094  → Transferencia Overshark 5094
```

### BRAVO'S - YAPE (2 dispositivos)
```
PUB BRAV-829  → Pub Bravo's (+51981139829)
LIVE BRAV-402 → Live Bravo's (+51981139402)
```

### BRAVO'S - TRANSFERENCIAS (2 dispositivos)
```
TRANSF.4006  → Transferencia Bravo's 4006
TRANSF.0040  → Transferencia Bravo's 0040
```

---

## Tipos de Pago Soportados

El sistema detecta automáticamente los siguientes tipos de pago:

| Tipo | Descripción | Auto-Parseable | Requiere Revisión Manual |
|------|-------------|----------------|--------------------------|
| `YAPE` | Notificaciones de Yape | ✅ Sí | ❌ No |
| `PLIN` | Notificaciones de Plin | ✅ Sí | ❌ No |
| `BCP` | Transferencias BCP | ⚠️ Parcial | ⚠️ Algunas |
| `INTERBANK` | Transferencias Interbank | ⚠️ Parcial | ⚠️ Algunas |
| `IMAGEN_MANUAL` | Screenshots de vouchers | ❌ No | ✅ Sí |
| `OTRO` | Otros tipos no reconocidos | ❌ No | ✅ Sí |

### Detección Automática

El backend analiza el texto y detecta patrones específicos:

- **YAPE**: Contiene "Te pagaron", "Operación:", "Código de seguridad:"
- **PLIN**: Contiene "plin", "recibiste"
- **BCP**: Contiene "BCP", "transferencia", "cuenta"
- **INTERBANK**: Contiene "interbank", "transferencia"
- **IMAGEN_MANUAL**: Contiene "screenshot", "imagen", "voucher", "foto"

---

## Estados de Notificación

### Estados Iniciales

| Estado | Descripción | Procesamiento |
|--------|-------------|---------------|
| `PENDIENTE_VALIDACION` | Notificación parseada correctamente, lista para validación automática | Automático |
| `REVISION_MANUAL` | Notificación que requiere revisión humana | Manual |

### Flujo de Estados

```
PENDIENTE_VALIDACION → (Sistema valida automáticamente)
                     → VALIDADO ✅ (Pago confirmado)
                     → RECHAZADO ❌ (No coincide)

REVISION_MANUAL → (Admin revisa manualmente)
                → APROBADO_MANUAL ✅
                → RECHAZADO_MANUAL ❌
```

---

## Manejo de Errores

### Error 400 - Bad Request

#### Falta el Body
```json
{
  "error": "Body requerido"
}
```

#### Faltan Campos Requeridos
```json
{
  "error": "Faltan campos requeridos: texto, codigo_dispositivo"
}
```

#### Código de Dispositivo Inválido
```json
{
  "error": "Código de dispositivo inválido: CODIGO-INVALIDO"
}
```

### Error 500 - Internal Server Error

```json
{
  "error": "Error interno del servidor",
  "details": "Descripción del error"
}
```

---

## Ejemplos de Código

### JavaScript / React Native

```javascript
const enviarNotificacion = async (textoNotificacion, codigoDispositivo) => {
  try {
    const response = await fetch(
      'https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          texto: textoNotificacion,
          codigo_dispositivo: codigoDispositivo,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      console.log('Notificación enviada:', data);
      return data;
    } else {
      console.error('Error:', data.error);
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error de red:', error);
    throw error;
  }
};

// Uso
const texto = "Te pagaron S/150.00\nNombre: Juan Pérez\nOperación: 987654321 | Código de seguridad: 7890";
enviarNotificacion(texto, "L1-000");
```

### Kotlin / Android

```kotlin
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

class NotificacionService {
    private val client = OkHttpClient()
    private val endpoint = "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones"

    fun enviarNotificacion(texto: String, codigoDispositivo: String): Result<JSONObject> {
        val json = JSONObject().apply {
            put("texto", texto)
            put("codigo_dispositivo", codigoDispositivo)
        }

        val body = json.toString()
            .toRequestBody("application/json".toMediaType())

        val request = Request.Builder()
            .url(endpoint)
            .post(body)
            .build()

        return try {
            client.newCall(request).execute().use { response ->
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    Result.success(JSONObject(responseBody))
                } else {
                    Result.failure(Exception("Error: ${response.code}"))
                }
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

// Uso
val service = NotificacionService()
val texto = "Te pagaron S/150.00\nNombre: Juan Pérez..."
val result = service.enviarNotificacion(texto, "L1-000")
```

### Swift / iOS

```swift
import Foundation

struct NotificacionRequest: Codable {
    let texto: String
    let codigo_dispositivo: String
}

struct NotificacionResponse: Codable {
    let message: String
    let numero_operacion: String
    let tipo_pago: String
    let monto: Double?
    let codigo_dispositivo: String
    let estado: String
    let requiere_revision_manual: Bool
}

class NotificacionService {
    let endpoint = "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones"

    func enviarNotificacion(
        texto: String,
        codigoDispositivo: String,
        completion: @escaping (Result<NotificacionResponse, Error>) -> Void
    ) {
        guard let url = URL(string: endpoint) else {
            completion(.failure(NSError(domain: "Invalid URL", code: -1)))
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = NotificacionRequest(
            texto: texto,
            codigo_dispositivo: codigoDispositivo
        )

        do {
            request.httpBody = try JSONEncoder().encode(body)
        } catch {
            completion(.failure(error))
            return
        }

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                completion(.failure(error))
                return
            }

            guard let data = data else {
                completion(.failure(NSError(domain: "No data", code: -1)))
                return
            }

            do {
                let result = try JSONDecoder().decode(NotificacionResponse.self, from: data)
                completion(.success(result))
            } catch {
                completion(.failure(error))
            }
        }.resume()
    }
}

// Uso
let service = NotificacionService()
let texto = "Te pagaron S/150.00\nNombre: Juan Pérez..."
service.enviarNotificacion(texto: texto, codigoDispositivo: "L1-000") { result in
    switch result {
    case .success(let response):
        print("Enviado:", response.message)
    case .failure(let error):
        print("Error:", error)
    }
}
```

### Python (Para Testing)

```python
import requests
import json

def enviar_notificacion(texto: str, codigo_dispositivo: str):
    url = "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones"

    payload = {
        "texto": texto,
        "codigo_dispositivo": codigo_dispositivo
    }

    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None

# Uso
texto = "Te pagaron S/150.00\nNombre: Juan Pérez\nOperación: 987654321 | Código de seguridad: 7890"
resultado = enviar_notificacion(texto, "L1-000")
print(json.dumps(resultado, indent=2))
```

---

## Testing

### Test Manual con cURL

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "texto": "Te pagaron S/150.00\nNombre: Juan Pérez\nOperación: 987654321 | Código de seguridad: 7890\n5/12/2025 18:30",
    "codigo_dispositivo": "L1-000"
  }'
```

### Ejemplos de Texto para Testing

#### Notificación Yape (Parseado Automático)
```
Te pagaron S/150.00
Nombre: Juan Pérez
Operación: 987654321 | Código de seguridad: 7890
5/12/2025 18:30
```

#### Notificación Plin (Parseado Automático)
```
Recibiste S/200.00
De: María García
Código: PLIN-123456
12/05/2025 10:30
```

#### Transferencia BCP (Puede requerir revisión)
```
BCP Transferencia recibida
Monto: S/300.00
De: Carlos López
Cuenta: XXXX-1234
12/05/2025 14:45
```

#### Imagen Manual (Requiere Revisión)
```
screenshot voucher yape cliente manuel
```

### Validación del Response

Verifica que el response contenga:

1. ✅ `message` no vacío
2. ✅ `numero_operacion` presente (real o temporal)
3. ✅ `tipo_pago` es uno de: `YAPE`, `PLIN`, `BCP`, `INTERBANK`, `IMAGEN_MANUAL`, `OTRO`
4. ✅ `codigo_dispositivo` coincide con el enviado
5. ✅ `estado` es `PENDIENTE_VALIDACION` o `REVISION_MANUAL`
6. ✅ `requiere_revision_manual` es boolean

### Casos de Prueba Recomendados

| Caso | Entrada | Resultado Esperado |
|------|---------|-------------------|
| Yape válido | Notificación Yape completa | `PENDIENTE_VALIDACION`, `requiere_revision_manual: false` |
| Plin válido | Notificación Plin completa | `PENDIENTE_VALIDACION`, `requiere_revision_manual: false` |
| Transferencia | Texto de transferencia BCP | `REVISION_MANUAL`, `requiere_revision_manual: true` |
| Imagen manual | "screenshot voucher" | `REVISION_MANUAL`, `requiere_revision_manual: true` |
| Código inválido | Código que no existe | Error 400 |
| Sin texto | Body sin campo `texto` | Error 400 |

---

## Notas Importantes

### Performance
- **Tiempo de respuesta promedio**: 200-500ms
- **Timeout**: 30 segundos (configurado en Lambda)

### Reintentos
- Si el request falla por error de red, **reintenta automáticamente** con backoff exponencial
- Máximo 3 reintentos recomendados
- Espera inicial: 1s, luego 2s, luego 4s

### Rate Limiting
- No hay límite de rate actualmente
- Se espera máximo ~100 notificaciones por minuto en horario pico

### Logging
- Todas las notificaciones se registran en CloudWatch Logs
- Los logs incluyen: timestamp, código dispositivo, tipo de pago, monto, estado

### Monitoreo
- Configurar alertas si el request falla más de 5 veces seguidas
- Notificar al equipo backend si `requiere_revision_manual: true` aparece frecuentemente

---

## Soporte

**Backend Team**: Overshark Backend
**Endpoint Status**: [AWS Health Dashboard](https://health.aws.amazon.com/)
**Logs**: CloudWatch Logs → `/aws/lambda/overshark-backend-dev-guardarNotificacion`

---

## Changelog

### v1.0.0 (Diciembre 2025)
- Lanzamiento inicial
- Soporte para 21 dispositivos
- Detección automática de Yape, Plin, BCP, Interbank
- Estados: PENDIENTE_VALIDACION, REVISION_MANUAL

---

**Última revisión**: 2025-12-08
**Documento válido hasta**: 2026-06-08
