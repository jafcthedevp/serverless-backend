# API - Dashboard de Administración

Documentación técnica de los endpoints del dashboard de administración.

## Información General

**Base URL:** `https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com`

**Autenticación:** Todos los endpoints requieren autenticación con AWS Cognito (JWT Bearer Token)

**Headers requeridos:**
```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## Tabla de Contenidos

1. [GET /dashboard/pendientes](#get-dashboardpendientes) - Listar notificaciones pendientes
2. [POST /dashboard/validar](#post-dashboardvalidar) - Validar manualmente notificaciones
3. [GET /dashboard/vendedores](#get-dashboardvendedores) - Listar vendedores
4. [POST /dashboard/vendedores/aprobar](#post-dashboardvendedoresaprobar) - Aprobar/Rechazar/Bloquear vendedores

---

## GET /dashboard/pendientes

### Descripción
Lista todas las notificaciones con estado `REVISION_MANUAL` que requieren aprobación o rechazo manual por un administrador.

### Handler
`src/handlers/listarPendientes.ts`

### Autenticación
✅ Requiere token JWT de Cognito (cualquier usuario autenticado)

### Query Parameters

| Parámetro | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `limit` | number | No | 50 | Cantidad máxima de resultados |
| `tipo_pago` | string | No | - | Filtrar por tipo de pago (ej: "YAPE") |

### Request Example

```http
GET /dashboard/pendientes?limit=20&tipo_pago=YAPE
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response - Success (200 OK)

```json
{
  "total": 5,
  "notificaciones": [
    {
      "id": "NOTIF#03443217",
      "numero_operacion": "03443217",
      "tipo_pago": "YAPE",
      "monto": 100.0,
      "nombre_pagador": "Juan C. Perez F.",
      "codigo_dispositivo": "TK6-600",
      "texto_raw": "¡Yapeaste!\nS/100\nJuan C. Perez F.\n22 nov. 2025 | 11:34 a.m.\nCÓDIGO DE SEGURIDAD\n5 0 2\nNro. de operación\n03443217",
      "parseado": true,
      "created_at": "2025-11-22T11:34:15.000Z",
      "estado": "REVISION_MANUAL"
    },
    {
      "id": "NOTIF#03443218",
      "numero_operacion": "03443218",
      "tipo_pago": "YAPE",
      "monto": 50.0,
      "nombre_pagador": "Maria Lopez",
      "codigo_dispositivo": "L1-000",
      "texto_raw": "...",
      "parseado": true,
      "created_at": "2025-11-22T12:15:30.000Z",
      "estado": "REVISION_MANUAL"
    }
  ]
}
```

### Response - Error (500)

```json
{
  "error": "Error interno del servidor",
  "details": "Descripción del error"
}
```

### Notas

- Los resultados se ordenan por fecha de creación (más recientes primero)
- El límite por defecto es 50 para evitar respuestas muy grandes
- Usa `tipo_pago` para filtrar solo pagos de Yape o de otros métodos

---

## POST /dashboard/validar

### Descripción
Permite a un administrador aprobar o rechazar manualmente notificaciones que están en estado `REVISION_MANUAL`. Opcionalmente puede corregir datos que fueron mal parseados.

### Handler
`src/handlers/validarManual.ts`

### Autenticación
✅ Requiere token JWT de Cognito
✅ Requiere rol de **Admin** (grupo `Admin` en Cognito)

### Request Body

```typescript
{
  numero_operacion: string;         // Número de operación a validar
  accion: "APROBAR" | "RECHAZAR";   // Acción a realizar
  operador_id: string;              // Email o ID del operador
  notas?: string;                   // Notas opcionales

  // Datos corregidos manualmente (opcional, solo si APROBAR)
  monto?: number;
  nombre_pagador?: string;
  codigo_seguridad?: string;
  fecha_hora?: string;
}
```

### Request Example - Aprobar

```json
{
  "numero_operacion": "03443217",
  "accion": "APROBAR",
  "operador_id": "admin@overshark.com",
  "notas": "Verificado manualmente, el nombre tiene un error de OCR pero el pago es válido",
  "nombre_pagador": "Juan Carlos Perez Fernandez"
}
```

### Request Example - Rechazar

```json
{
  "numero_operacion": "03443218",
  "accion": "RECHAZAR",
  "operador_id": "admin@overshark.com",
  "notas": "El código de dispositivo no coincide, posible fraude"
}
```

### Response - Success (200 OK)

```json
{
  "message": "Notificación aprobada exitosamente",
  "numero_operacion": "03443217",
  "estado_anterior": "REVISION_MANUAL",
  "estado_nuevo": "VALIDADO",
  "operador_id": "admin@overshark.com",
  "fecha_revision": "2025-11-22T14:30:00.000Z"
}
```

### Response - Error (400) - Campos faltantes

```json
{
  "error": "Faltan campos requeridos: numero_operacion, accion, operador_id"
}
```

### Response - Error (400) - Acción inválida

```json
{
  "error": "Acción inválida. Debe ser APROBAR o RECHAZAR"
}
```

### Response - Error (404) - Notificación no encontrada

```json
{
  "error": "Notificación no encontrada: 03443217"
}
```

### Response - Error (400) - Estado incorrecto

```json
{
  "error": "La notificación no está en estado REVISION_MANUAL (estado actual: VALIDADO)"
}
```

### Response - Error (403) - Sin permisos

```json
{
  "error": "Acceso denegado. Solo administradores pueden aprobar/rechazar notificaciones."
}
```

### Notas

- Solo usuarios del grupo `Admin` en Cognito pueden usar este endpoint
- Si se aprueba, el estado cambia a `VALIDADO`
- Si se rechaza, el estado cambia a `RECHAZADO`
- Los datos corregidos solo se aplican si la acción es `APROBAR`
- Toda validación manual queda registrada con timestamp y operador

---

## GET /dashboard/vendedores

### Descripción
Lista todos los vendedores registrados en el sistema, con opción de filtrar por estado.

### Handler
`src/handlers/gestionarVendedores.ts` (función `listarHandler`)

### Autenticación
✅ Requiere token JWT de Cognito

### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `estado` | string | No | Filtrar por estado: `PENDIENTE`, `APROBADO`, `RECHAZADO`, `BLOQUEADO` |

### Request Example - Todos los vendedores

```http
GET /dashboard/vendedores
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Example - Solo pendientes

```http
GET /dashboard/vendedores?estado=PENDIENTE
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Response - Success (200 OK)

```json
{
  "total": 3,
  "estado": "PENDIENTE",
  "vendedores": [
    {
      "PK": "VENDEDOR#51987654321",
      "telefono": "51987654321",
      "nombre": "Carlos Ramirez",
      "estado": "PENDIENTE",
      "fecha_registro": "2025-11-22T10:00:00.000Z",
      "primer_mensaje": "Hola, quiero registrarme",
      "total_validaciones": 0,
      "ultima_actividad": "2025-11-22T10:00:00.000Z"
    },
    {
      "PK": "VENDEDOR#51912345678",
      "telefono": "51912345678",
      "estado": "PENDIENTE",
      "fecha_registro": "2025-11-22T11:30:00.000Z",
      "primer_mensaje": "Buenos días",
      "total_validaciones": 0,
      "ultima_actividad": "2025-11-22T11:30:00.000Z"
    }
  ]
}
```

### Response - Error (500)

```json
{
  "error": "Error interno del servidor",
  "details": "Descripción del error"
}
```

### Estados de Vendedor

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE` | Vendedor auto-registrado, esperando aprobación |
| `APROBADO` | Vendedor aprobado, puede validar vouchers |
| `RECHAZADO` | Vendedor rechazado por administrador |
| `BLOQUEADO` | Vendedor bloqueado (por mal uso del sistema) |

### Notas

- Si no se especifica `estado`, devuelve todos los vendedores
- Los vendedores se ordenan por fecha de registro
- Útil para dashboard de administración

---

## POST /dashboard/vendedores/aprobar

### Descripción
Permite aprobar, rechazar o bloquear vendedores. Usado para gestionar el acceso de vendedores al sistema.

### Handler
`src/handlers/gestionarVendedores.ts` (función `aprobarHandler`)

### Autenticación
✅ Requiere token JWT de Cognito

### Request Body

```typescript
{
  telefono: string;                          // Teléfono del vendedor
  accion: "APROBAR" | "RECHAZAR" | "BLOQUEAR"; // Acción a realizar
  razon?: string;                            // Requerido si RECHAZAR o BLOQUEAR
}
```

### Request Example - Aprobar

```json
{
  "telefono": "51987654321",
  "accion": "APROBAR"
}
```

### Request Example - Rechazar

```json
{
  "telefono": "51987654321",
  "accion": "RECHAZAR",
  "razon": "No cumple con los requisitos de verificación"
}
```

### Request Example - Bloquear

```json
{
  "telefono": "51987654321",
  "accion": "BLOQUEAR",
  "razon": "Múltiples intentos de fraude detectados"
}
```

### Response - Success (200 OK)

```json
{
  "message": "Vendedor 51987654321 aprobado correctamente",
  "telefono": "51987654321",
  "accion": "APROBAR",
  "timestamp": "2025-11-22T15:00:00.000Z"
}
```

### Response - Error (400) - Campos faltantes

```json
{
  "error": "Campos requeridos: telefono, accion (APROBAR o RECHAZAR)"
}
```

### Response - Error (400) - Falta razón al rechazar

```json
{
  "error": "El campo \"razon\" es requerido al rechazar"
}
```

### Response - Error (400) - Acción inválida

```json
{
  "error": "Acción inválida. Debe ser APROBAR, RECHAZAR o BLOQUEAR"
}
```

### Response - Error (500)

```json
{
  "error": "Error al aprobar vendedor"
}
```

### Qué hace cada acción

#### APROBAR
1. Cambia el estado del vendedor a `APROBADO`
2. Registra quién aprobó y cuándo
3. El vendedor puede empezar a validar vouchers
4. **Opcional:** Enviar notificación vía WhatsApp al vendedor

#### RECHAZAR
1. Cambia el estado del vendedor a `RECHAZADO`
2. Registra la razón del rechazo
3. El vendedor NO puede usar el sistema
4. **Opcional:** Enviar notificación vía WhatsApp explicando el rechazo

#### BLOQUEAR
1. Cambia el estado del vendedor a `BLOQUEADO`
2. Registra la razón del bloqueo
3. El vendedor pierde acceso inmediatamente
4. Útil para casos de fraude o mal uso

### Notas

- La razón es **obligatoria** para RECHAZAR y BLOQUEAR
- El teléfono del admin se obtiene automáticamente del token JWT
- Toda acción queda registrada en la base de datos

---

## Integración con Make.com

### Escenario 1: Notificar administrador sobre notificaciones pendientes

**Trigger:** Scheduled (cada 1 hora)

**Flujo:**
1. HTTP Request a `GET /dashboard/pendientes?limit=10`
2. Filtro: Si `total > 0`
3. Formatear mensaje con las notificaciones
4. Enviar email al administrador
5. Enviar mensaje de WhatsApp al administrador

**Ejemplo de mensaje:**
```
🔔 Tienes 5 notificaciones pendientes de revisión

1. Op: 03443217 - S/ 100 - Juan Perez
2. Op: 03443218 - S/ 50 - Maria Lopez
...

Revisa en: https://dashboard.overshark.com/pendientes
```

---

### Escenario 2: Aprobar notificaciones desde Google Sheets

**Trigger:** Google Sheets - New Row

**Flujo:**
1. Admin agrega fila en Google Sheets con:
   - Número operación
   - Acción (APROBAR/RECHAZAR)
   - Notas
2. HTTP Request a `POST /dashboard/validar`
3. Actualizar fila en Google Sheets con resultado
4. Enviar notificación al vendedor

---

### Escenario 3: Auto-aprobar vendedores verificados

**Trigger:** Webhook externo (desde sistema de verificación)

**Flujo:**
1. Sistema externo verifica identidad del vendedor
2. Envía webhook a Make.com con teléfono del vendedor
3. HTTP Request a `POST /dashboard/vendedores/aprobar`
4. Enviar mensaje de WhatsApp al vendedor notificando aprobación

---

### Escenario 4: Dashboard de vendedores en Google Sheets

**Trigger:** Scheduled (cada 6 horas)

**Flujo:**
1. HTTP Request a `GET /dashboard/vendedores`
2. Limpiar Google Sheets
3. Para cada vendedor:
   - Agregar fila con: teléfono, estado, fecha registro, validaciones
4. Formatear con colores según estado:
   - Verde: APROBADO
   - Amarillo: PENDIENTE
   - Rojo: RECHAZADO/BLOQUEADO

---

## Autenticación con Cognito

### Obtener Token JWT

Para hacer requests a estos endpoints, necesitas un token JWT de AWS Cognito.

#### Opción 1: Desde aplicación web con Amplify

```javascript
import { Auth } from 'aws-amplify';

const session = await Auth.currentSession();
const token = session.getIdToken().getJwtToken();

// Usar en requests
const response = await fetch('https://API_URL/dashboard/pendientes', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

#### Opción 2: Login directo con API

```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=admin@example.com,PASSWORD=YourPassword
```

Response:
```json
{
  "AuthenticationResult": {
    "IdToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "AccessToken": "...",
    "RefreshToken": "..."
  }
}
```

Usa el `IdToken` como Bearer token.

#### Opción 3: Desde Make.com

1. Crear módulo HTTP para login a Cognito
2. Guardar el token en una variable
3. Usar la variable en los siguientes módulos HTTP

**Módulo 1 - Login:**
```
URL: https://cognito-idp.{region}.amazonaws.com/
Headers:
  X-Amz-Target: AWSCognitoIdentityProviderService.InitiateAuth
  Content-Type: application/x-amz-json-1.1
Body:
{
  "AuthFlow": "USER_PASSWORD_AUTH",
  "ClientId": "YOUR_CLIENT_ID",
  "AuthParameters": {
    "USERNAME": "admin@example.com",
    "PASSWORD": "YourPassword"
  }
}
```

**Módulo 2 - Usar token:**
```
Headers:
  Authorization: Bearer {{module1.IdToken}}
```

---

## Testing

### Test con curl - GET Pendientes

```bash
# Primero obtén el token (reemplaza con tus credenciales)
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."

# Listar pendientes
curl -X GET "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes?limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test con curl - POST Validar

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/validar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "numero_operacion": "03443217",
    "accion": "APROBAR",
    "operador_id": "admin@overshark.com",
    "notas": "Verificado manualmente"
  }'
```

### Test con curl - GET Vendedores

```bash
curl -X GET "https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/vendedores?estado=PENDIENTE" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### Test con curl - POST Aprobar Vendedor

```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/vendedores/aprobar \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "51987654321",
    "accion": "APROBAR"
  }'
```

---

## Logging

### CloudWatch Logs

```bash
# Listar pendientes
aws logs tail /aws/lambda/overshark-backend-dev-listarPendientes --follow

# Validar manual
aws logs tail /aws/lambda/overshark-backend-dev-validarManual --follow

# Gestionar vendedores
aws logs tail /aws/lambda/overshark-backend-dev-listarVendedores --follow
aws logs tail /aws/lambda/overshark-backend-dev-aprobarVendedor --follow
```

---

## Seguridad

### Validaciones Implementadas

1. ✅ **Autenticación JWT:** Todos los endpoints requieren token válido
2. ✅ **Autorización por roles:** Validación manual requiere grupo Admin
3. ✅ **Validación de estado:** Solo se pueden validar notificaciones en REVISION_MANUAL
4. ✅ **Registro de auditoría:** Todas las acciones quedan registradas con timestamp y operador
5. ✅ **CORS habilitado:** Para acceso desde aplicaciones web

### Recomendaciones

- ✅ Rotar tokens JWT regularmente
- ✅ Usar HTTPS siempre (ya implementado con API Gateway)
- ✅ Monitorear accesos sospechosos en CloudWatch
- ✅ Implementar rate limiting por IP
- ✅ Revisar logs de auditoría periódicamente

---

## Referencias

- **Código fuente:**
  - `src/handlers/listarPendientes.ts`
  - `src/handlers/validarManual.ts`
  - `src/handlers/gestionarVendedores.ts`
- **Servicios:**
  - `src/services/vendedorService.ts`
- **Tipos:**
  - `src/types/vendedor.ts`
  - `src/types/notificacion.ts`
- **Configuración Cognito:** [docs/setup-dashboard-auth.md](setup-dashboard-auth.md)
- **Validación de vouchers:** [docs/API-Validar-Voucher.md](API-Validar-Voucher.md)
