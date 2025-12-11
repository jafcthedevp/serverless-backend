# API Reference - Overshark Backend

Índice completo de la documentación de APIs del backend serverless de Overshark.

## Base URL

```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com
```

---

## Endpoints Documentados

### 🔓 Endpoints Públicos (sin autenticación)

#### 1. Webhook de WhatsApp
**Documentación:** [API-Webhook-WhatsApp.md](API-Webhook-WhatsApp.md)

- `GET /webhook` - Verificación del webhook
- `POST /webhook` - Recepción de eventos de WhatsApp

**Uso:** Integración con WhatsApp Business API para recibir y procesar mensajes de vendedores.

---

#### 2. Validar Voucher
**Documentación:** [API-Validar-Voucher.md](API-Validar-Voucher.md)

- `POST /validar` - Validar voucher de Yape

**Uso:** Validación automática de vouchers con algoritmo de matching de 5 checks.

---

### 🔐 Endpoints Dashboard (requieren autenticación Cognito)

#### 3. Dashboard de Administración
**Documentación:** [API-Dashboard.md](API-Dashboard.md)

- `GET /dashboard/pendientes` - Listar notificaciones pendientes de revisión
- `POST /dashboard/validar` - Aprobar/Rechazar notificaciones manualmente
- `GET /dashboard/vendedores` - Listar vendedores registrados
- `POST /dashboard/vendedores/aprobar` - Aprobar/Rechazar/Bloquear vendedores

**Uso:** Gestión administrativa del sistema desde dashboard web o integraciones.

---

## Resumen Rápido

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/webhook` | GET | No | Verificación webhook WhatsApp |
| `/webhook` | POST | No | Eventos de WhatsApp |
| `/validar` | POST | No | Validar voucher |
| `/dashboard/pendientes` | GET | Sí | Listar pendientes |
| `/dashboard/validar` | POST | Sí (Admin) | Validar manual |
| `/dashboard/vendedores` | GET | Sí | Listar vendedores |
| `/dashboard/vendedores/aprobar` | POST | Sí | Gestionar vendedores |

---

## Flujos de Integración

### Make.com + WhatsApp Cloud API

#### Flujo 1: Automatización de Aprobaciones
```
Trigger: GET /dashboard/pendientes (scheduled cada 1h)
  ↓
Filter: Si hay notificaciones pendientes
  ↓
Para cada notificación:
  ↓
Router:
  - Si monto < 50 → POST /dashboard/validar (APROBAR)
  - Si monto >= 50 → Notificar admin por email
```

#### Flujo 2: Gestión de Vendedores
```
Trigger: GET /dashboard/vendedores?estado=PENDIENTE (scheduled diario)
  ↓
Filter: Si hay vendedores pendientes
  ↓
Enviar lista a Google Sheets
  ↓
Admin revisa en Google Sheets
  ↓
Trigger: Google Sheets - New Row (columna "Acción")
  ↓
POST /dashboard/vendedores/aprobar
  ↓
Enviar WhatsApp al vendedor notificando
```

#### Flujo 3: Validación Automática desde Formulario Web
```
Trigger: Webhooks - Custom (formulario web)
  ↓
Procesar datos del formulario
  ↓
POST /validar
  ↓
Router según response.valido:
  - true → Enviar confirmación al cliente
  - false (MATCH_INSUFICIENTE) → Crear ticket en Trello
  - false (otro) → Enviar email de rechazo
```

---

## Autenticación

### Endpoints Públicos
No requieren autenticación. Pueden ser llamados directamente.

### Endpoints Dashboard
Requieren token JWT de AWS Cognito.

**Obtener token:**
```bash
aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id YOUR_CLIENT_ID \
  --auth-parameters USERNAME=admin@example.com,PASSWORD=password
```

**Usar token:**
```bash
curl -H "Authorization: Bearer {JWT_TOKEN}" \
  https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes
```

**Desde Make.com:**
1. Crear módulo HTTP para login
2. Extraer `IdToken` de la respuesta
3. Usar en header `Authorization: Bearer {{IdToken}}`

Ver detalles: [API-Dashboard.md - Autenticación](API-Dashboard.md#autenticación-con-cognito)

---

## Testing

### Con curl

```bash
# Endpoints públicos
curl https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/validar \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"monto": 100, "numeroOperacion": "12345", ...}'

# Endpoints con auth
TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
curl https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes \
  -H "Authorization: Bearer $TOKEN"
```

### Desde Make.com

1. Crear HTTP Module
2. Configurar URL, Method, Headers
3. Agregar Body (si POST)
4. Run once para probar

---

## Documentación Complementaria

### Configuración
- [Configuracion-WhatsApp-Verificada.md](Configuracion-WhatsApp-Verificada.md) - Setup de WhatsApp Business
- [Guia-Configuracion-Webhook-WhatsApp.md](Guia-Configuracion-Webhook-WhatsApp.md) - Configurar webhook en Meta
- [setup-dashboard-auth.md](setup-dashboard-auth.md) - Configurar Cognito

### Conceptos
- [Entendiendo-Webhooks-WhatsApp.md](Entendiendo-Webhooks-WhatsApp.md) - Cómo funcionan los webhooks
- [Sistema-Auto-Registro-Vendedores.md](Sistema-Auto-Registro-Vendedores.md) - Sistema de auto-registro

### Otros
- [API-Mobile-Notificaciones.md](API-Mobile-Notificaciones.md) - API para apps móviles
- [API-Mobile-QuickStart.md](API-Mobile-QuickStart.md) - Guía rápida mobile

---

## Monitoreo

### CloudWatch Logs

```bash
# Ver logs de webhook
aws logs tail /aws/lambda/overshark-backend-dev-webhookWhatsApp --follow

# Ver logs de validación
aws logs tail /aws/lambda/overshark-backend-dev-validarConMatch --follow

# Ver logs de dashboard
aws logs tail /aws/lambda/overshark-backend-dev-listarPendientes --follow
aws logs tail /aws/lambda/overshark-backend-dev-validarManual --follow
```

### Dashboard Serverless

https://app.serverless.com/jesusflores123/apps/overshark-backend/overshark-backend/dev/us-east-1

---

## Soporte

Para dudas o problemas:
- Revisar la documentación específica de cada endpoint
- Verificar logs en CloudWatch
- Consultar el código fuente en `src/handlers/`

---

## Changelog

**2025-11-22**
- ✅ Documentación completa de API Webhook WhatsApp
- ✅ Documentación completa de API Validar Voucher
- ✅ Documentación completa de API Dashboard
- ✅ Ejemplos de integración con Make.com
- ✅ Guías de testing con curl
