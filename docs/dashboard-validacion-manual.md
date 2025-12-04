# Dashboard de Validación Manual

Sistema de revisión manual para notificaciones de pago que no son de Yape (Plin, BCP, Interbank, imágenes, etc.).

## 🎯 Flujo de Validación

### Procesamiento Automático vs Manual

#### ✅ Procesamiento Automático (YAPE)
- **Tipo de pago**: Yape
- **Flujo**: La notificación se parsea automáticamente y pasa a `PENDIENTE_VALIDACION`
- **Estado inicial**: `PENDIENTE_VALIDACION`

#### 🔍 Revisión Manual (PLIN, BCP, INTERBANK, OTROS)
- **Tipos de pago**: Plin, BCP, Interbank, Imagen Manual, Otro
- **Flujo**: La notificación se guarda y requiere revisión manual
- **Estado inicial**: `REVISION_MANUAL`

---

## 📡 Endpoints del Dashboard

### Base URL
```
https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com
```

---

### 1️⃣ Listar Notificaciones Pendientes

**Endpoint**: `GET /dashboard/pendientes`

Lista todas las notificaciones que requieren revisión manual.

#### Query Parameters
| Parámetro | Tipo | Descripción | Requerido |
|-----------|------|-------------|-----------|
| `limit` | number | Límite de resultados (default: 50) | No |
| `tipo_pago` | string | Filtrar por tipo: PLIN, BCP, INTERBANK, etc. | No |

#### Ejemplo de Request
```bash
curl https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes?limit=20&tipo_pago=PLIN
```

#### Ejemplo de Response
```json
{
  "total": 15,
  "notificaciones": [
    {
      "id": "NOTIF#TEMP-1733275200000-L1-000",
      "numero_operacion": null,
      "tipo_pago": "PLIN",
      "monto": 150.50,
      "nombre_pagador": "Juan Perez",
      "codigo_dispositivo": "L1-000",
      "texto_raw": "¡Plineaste! S/150.50 Juan Perez 22 nov. 2025 | 11:34 a.m. Operación 123456",
      "parseado": true,
      "created_at": "2025-12-03T15:30:00.000Z",
      "estado": "REVISION_MANUAL"
    },
    {
      "id": "NOTIF#TEMP-1733275300000-L2-378",
      "numero_operacion": "987654",
      "tipo_pago": "BCP",
      "monto": 200.00,
      "nombre_pagador": "Maria Lopez",
      "codigo_dispositivo": "L2-378",
      "texto_raw": "Transferencia BCP S/200.00 de Maria Lopez Operación 987654",
      "parseado": true,
      "created_at": "2025-12-03T15:35:00.000Z",
      "estado": "REVISION_MANUAL"
    }
  ]
}
```

---

### 2️⃣ Validar Notificación Manualmente

**Endpoint**: `POST /dashboard/validar`

Permite aprobar o rechazar una notificación en revisión manual.

#### Request Body
```json
{
  "numero_operacion": "TEMP-1733275200000-L1-000",
  "accion": "APROBAR",
  "operador_id": "admin@overshark.com",
  "notas": "Verificado con el banco, pago confirmado",
  // Datos corregidos (opcionales, solo al aprobar)
  "monto": 150.50,
  "nombre_pagador": "Juan Perez Corregido",
  "codigo_seguridad": "123",
  "fecha_hora": "2025-12-03T11:34:00.000Z"
}
```

#### Campos del Request

| Campo | Tipo | Descripción | Requerido |
|-------|------|-------------|-----------|
| `numero_operacion` | string | ID de la notificación (campo `id` de listar pendientes) | ✅ Sí |
| `accion` | string | "APROBAR" o "RECHAZAR" | ✅ Sí |
| `operador_id` | string | Email o ID del operador que revisa | ✅ Sí |
| `notas` | string | Notas de la revisión | No |
| `monto` | number | Monto corregido (solo al aprobar) | No |
| `nombre_pagador` | string | Nombre corregido (solo al aprobar) | No |
| `codigo_seguridad` | string | Código corregido (solo al aprobar) | No |
| `fecha_hora` | string | Fecha/hora corregida (solo al aprobar) | No |

#### Ejemplo - Aprobar
```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/validar \
  -H "Content-Type: application/json" \
  -d '{
    "numero_operacion": "TEMP-1733275200000-L1-000",
    "accion": "APROBAR",
    "operador_id": "admin@overshark.com",
    "notas": "Pago verificado con el cliente por WhatsApp",
    "monto": 150.50
  }'
```

#### Ejemplo - Rechazar
```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/validar \
  -H "Content-Type: application/json" \
  -d '{
    "numero_operacion": "TEMP-1733275200000-L1-000",
    "accion": "RECHAZAR",
    "operador_id": "admin@overshark.com",
    "notas": "Monto no coincide con lo reportado por el cliente"
  }'
```

#### Response Exitoso
```json
{
  "message": "Notificación aprobada exitosamente",
  "numero_operacion": "TEMP-1733275200000-L1-000",
  "estado_anterior": "REVISION_MANUAL",
  "estado_nuevo": "VALIDADO",
  "operador_id": "admin@overshark.com",
  "fecha_revision": "2025-12-03T16:00:00.000Z"
}
```

---

## 🔄 Estados de Notificaciones

| Estado | Descripción |
|--------|-------------|
| `PENDIENTE_VALIDACION` | Notificación de Yape parseada automáticamente, esperando validación con matching |
| `REVISION_MANUAL` | Notificación que requiere revisión manual (Plin, BCP, etc.) |
| `VALIDADO` | Notificación aprobada (automática o manualmente) |
| `RECHAZADO` | Notificación rechazada |

---

## 🏷️ Tipos de Pago Soportados

| Tipo | Procesamiento | Ejemplo |
|------|---------------|---------|
| `YAPE` | ✅ Automático | "¡Yapeaste! S/100..." |
| `PLIN` | 🔍 Manual | "¡Plineaste! S/150..." |
| `BCP` | 🔍 Manual | "Transferencia BCP S/200..." |
| `INTERBANK` | 🔍 Manual | "Transferencia Interbank..." |
| `IMAGEN_MANUAL` | 🔍 Manual | Imagen capturada manualmente |
| `OTRO` | 🔍 Manual | Otros métodos no reconocidos |

---

## 🛠️ Integración con Frontend

### Flujo de Trabajo del Dashboard

```javascript
// 1. Obtener notificaciones pendientes
const response = await fetch(
  'https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/pendientes?limit=20'
);
const { notificaciones } = await response.json();

// 2. Mostrar notificaciones en tabla/lista
// El operador revisa cada notificación

// 3. Aprobar una notificación
await fetch(
  'https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/dashboard/validar',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      numero_operacion: 'TEMP-1733275200000-L1-000',
      accion: 'APROBAR',
      operador_id: 'admin@overshark.com',
      notas: 'Verificado'
    })
  }
);
```

### Interfaz de Usuario Sugerida

**Vista de Lista**:
- Tabla con columnas: Fecha, Tipo de Pago, Monto, Nombre, Dispositivo, Acciones
- Filtros: Por tipo de pago, por dispositivo, por fecha
- Búsqueda por número de operación

**Vista de Detalle**:
- Mostrar texto raw completo
- Campos parseados (si aplica)
- Formulario para editar datos si es necesario
- Botones: Aprobar / Rechazar
- Campo de notas

---

## 🔒 Seguridad

**⚠️ Importante**: Estos endpoints del dashboard deben estar protegidos con autenticación.

Recomendaciones:
1. Agregar API Key en headers
2. Implementar OAuth/JWT
3. Usar AWS Cognito para autenticación
4. Registrar todas las acciones de validación manual para auditoría

---

## 📊 Ejemplo de Flujo Completo

```
1. App Móvil recibe notificación de Plin
   ↓
2. POST /notificaciones
   {
     "texto": "¡Plineaste! S/150...",
     "codigo_dispositivo": "L1-000"
   }
   ↓
3. Backend detecta tipo_pago = PLIN
   ↓
4. Guarda con estado = REVISION_MANUAL
   ↓
5. Dashboard: GET /dashboard/pendientes
   ↓
6. Operador revisa y decide aprobar
   ↓
7. POST /dashboard/validar
   {
     "numero_operacion": "...",
     "accion": "APROBAR",
     "operador_id": "admin@overshark.com"
   }
   ↓
8. Notificación cambia a estado = VALIDADO
```

---

## 🧪 Testing

### Probar con Plin
```bash
curl -X POST https://8ks01z9fg4.execute-api.us-east-1.amazonaws.com/notificaciones \
  -H "Content-Type: application/json" \
  -d '{
    "texto": "¡Plineaste! S/150 Juan Perez 22 nov. 2025 | 11:34 a.m. Operación 123456",
    "codigo_dispositivo": "L1-000"
  }'
```

**Resultado esperado**:
```json
{
  "message": "Notificación guardada - Requiere revisión manual",
  "tipo_pago": "PLIN",
  "estado": "REVISION_MANUAL",
  "requiere_revision_manual": true
}
```
