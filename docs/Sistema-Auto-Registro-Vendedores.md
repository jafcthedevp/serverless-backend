# Sistema de Auto-Registro de Vendedores

## 📋 Descripción

Sistema automático de registro y gestión de vendedores que permite que cualquier número de WhatsApp se registre automáticamente al enviar su primer mensaje, entrando en un estado de aprobación pendiente.

## 🎯 Problema que Resuelve

Anteriormente, la lista de vendedores autorizados estaba "hardcodeada" en el código:

```typescript
const VENDEDORES_AUTORIZADOS = [
  '51957614218', // Juan Vendedor - Lima
  // Agregar más vendedores aquí
];
```

**Problemas de este enfoque:**
- ❌ Requiere modificar código para agregar vendedores
- ❌ Requiere re-deploy para cada nuevo vendedor
- ❌ No hay historial de quién aprobó a quién
- ❌ No hay trazabilidad de actividad
- ❌ No permite bloquear vendedores temporalmente

## ✅ Solución Implementada

### Sistema de Auto-Registro con Aprobación

1. **Vendedor envía primer mensaje** → Se registra automáticamente como PENDIENTE
2. **Admin revisa solicitud** → Aprueba o rechaza
3. **Vendedor recibe notificación** → Puede empezar a usar el sistema
4. **Sistema rastrea actividad** → Total de validaciones, última actividad, etc.

## 🗄️ Nueva Tabla: overshark-backend-dev-vendedores

### Estructura

```json
{
  "PK": "VENDEDOR#51957614218",
  "telefono": "51957614218",
  "nombre": "Juan Vendedor",
  "estado": "APROBADO",

  "fecha_registro": "2025-12-06T10:30:00.000Z",
  "primer_mensaje": "Hola, necesito validar un voucher",
  "total_validaciones": 15,
  "ultima_actividad": "2025-12-06T18:45:00.000Z",

  "aprobado_por": "SCRIPT_ADMIN",
  "fecha_aprobacion": "2025-12-06T10:35:00.000Z",

  "email": "juan.vendedor@overshark.pe",
  "ubicacion": "Lima",
  "notas": "Vendedor principal de Lima"
}
```

### Estados Posibles

| Estado | Descripción | Puede Usar Sistema |
|--------|-------------|-------------------|
| `PENDIENTE` | Registrado automáticamente, esperando aprobación | ❌ No |
| `APROBADO` | Aprobado por administrador | ✅ Sí |
| `RECHAZADO` | Rechazado por administrador | ❌ No |
| `BLOQUEADO` | Bloqueado (suspensión temporal o permanente) | ❌ No |

### Índices

**Global Secondary Index**: `EstadoIndex`
- Permite consultar rápidamente todos los vendedores por estado
- Útil para listar pendientes, aprobados, bloqueados, etc.

## 🔄 Flujo Completo

### Caso 1: Vendedor Nuevo (Auto-Registro)

```
Vendedor (+51999888777) envía primer mensaje:
"Hola, necesito ayuda"
         ↓
Webhook detecta mensaje
         ↓
Busca vendedor en tabla: NO EXISTE
         ↓
┌──────────────────────────────────────────┐
│ AUTO-REGISTRO AUTOMÁTICO                 │
│                                          │
│ Crea registro en DynamoDB:               │
│ - PK: VENDEDOR#51999888777              │
│ - estado: PENDIENTE                      │
│ - fecha_registro: 2025-12-06T10:30:00Z  │
│ - primer_mensaje: "Hola, necesito ayuda"│
│ - total_validaciones: 0                  │
└──────────────────────────────────────────┘
         ↓
Envía mensaje automático al vendedor:
┌──────────────────────────────────────────┐
│ 👋 Bienvenido a Overshark Backend       │
│                                          │
│ 📝 Tu número ha sido registrado         │
│ automáticamente.                         │
│                                          │
│ ⏳ Tu solicitud está siendo revisada    │
│ por un administrador.                    │
│ Recibirás una notificación cuando seas  │
│ aprobado.                                │
└──────────────────────────────────────────┘
         ↓
Registra log para notificar admin:
"⚠️ Nuevo vendedor pendiente: 51999888777"
```

### Caso 2: Admin Aprueba Vendedor

```
Admin ejecuta script:
npx ts-node scripts/aprobar-vendedor.ts 51999888777
         ↓
┌──────────────────────────────────────────┐
│ APROBACIÓN                               │
│                                          │
│ UPDATE en DynamoDB:                      │
│ - estado: PENDIENTE → APROBADO          │
│ - aprobado_por: SCRIPT_ADMIN            │
│ - fecha_aprobacion: 2025-12-06T10:35:00Z│
└──────────────────────────────────────────┘
         ↓
✅ Vendedor puede usar el sistema
```

### Caso 3: Vendedor Aprobado Usa el Sistema

```
Vendedor (+51999888777) envía imagen de voucher
         ↓
Webhook detecta mensaje
         ↓
Busca vendedor en tabla: EXISTE
         ↓
Verifica estado: APROBADO ✅
         ↓
Actualiza actividad:
- ultima_actividad: 2025-12-06T18:45:00Z
- total_validaciones: +1
         ↓
Procesa voucher normalmente
```

### Caso 4: Vendedor Pendiente Intenta Usar Sistema

```
Vendedor (+51999888777) envía mensaje
         ↓
Busca vendedor: EXISTE (estado: PENDIENTE)
         ↓
Verifica permiso: NO PERMITIDO
         ↓
Envía mensaje:
┌──────────────────────────────────────────┐
│ 🚫 Acceso Denegado                       │
│                                          │
│ Tu solicitud está pendiente de          │
│ aprobación. Un administrador la          │
│ revisará pronto.                         │
└──────────────────────────────────────────┘
```

### Caso 5: Admin Rechaza Vendedor

```
Admin ejecuta:
aws dynamodb update-item ...
O usa endpoint POST /dashboard/vendedores/aprobar
{
  "telefono": "51999888777",
  "accion": "RECHAZAR",
  "razon": "Número no verificado"
}
         ↓
┌──────────────────────────────────────────┐
│ RECHAZO                                  │
│                                          │
│ UPDATE en DynamoDB:                      │
│ - estado: PENDIENTE → RECHAZADO         │
│ - aprobado_por: admin_telefono          │
│ - fecha_aprobacion: 2025-12-06T11:00:00Z│
│ - razon_rechazo: "Número no verificado" │
└──────────────────────────────────────────┘
         ↓
Vendedor NO puede usar el sistema
```

## 🛠️ Scripts de Utilidad

### 1. Aprobar Vendedor

```bash
# Aprobar un vendedor específico
npx ts-node scripts/aprobar-vendedor.ts 51957614218

# Output:
# 🔍 Buscando vendedor: 51957614218...
# ✅ Vendedor encontrado:
#    Teléfono: 51957614218
#    Estado actual: PENDIENTE
#    Fecha registro: 2025-12-06 10:30:00
# ✅ Aprobando vendedor...
# 🎉 ¡Vendedor aprobado exitosamente!
```

### 2. Listar Vendedores Pendientes

```bash
# Listar todos los pendientes
npx ts-node scripts/aprobar-vendedor.ts --listar

# Output:
# 📋 Listando vendedores pendientes...
# 📊 Total: 3 vendedor(es) pendiente(s)
#
# 1. Teléfono: 51999888777
#    Estado: PENDIENTE
#    Registro: 12/6/2025, 10:30:00 AM
#    Primer mensaje: "Hola, necesito ayuda..."
#
# 2. Teléfono: 51999111222
#    Estado: PENDIENTE
#    Registro: 12/6/2025, 11:15:00 AM
#    Primer mensaje: "Buenos días..."
```

## 🌐 Endpoints API

### 1. GET /dashboard/vendedores

**Descripción**: Lista vendedores (con filtro opcional por estado)

**Autenticación**: ✅ Requerida (Cognito JWT)

**Query Parameters**:
- `estado` (opcional): `PENDIENTE` | `APROBADO` | `RECHAZADO` | `BLOQUEADO`

**Ejemplos**:

```bash
# Listar todos los vendedores
curl -X GET https://API_URL/dashboard/vendedores \
  -H "Authorization: Bearer TOKEN"

# Listar solo pendientes
curl -X GET https://API_URL/dashboard/vendedores?estado=PENDIENTE \
  -H "Authorization: Bearer TOKEN"

# Listar solo aprobados
curl -X GET https://API_URL/dashboard/vendedores?estado=APROBADO \
  -H "Authorization: Bearer TOKEN"
```

**Response**:
```json
{
  "total": 5,
  "estado": "PENDIENTE",
  "vendedores": [
    {
      "PK": "VENDEDOR#51999888777",
      "telefono": "51999888777",
      "estado": "PENDIENTE",
      "fecha_registro": "2025-12-06T10:30:00.000Z",
      "primer_mensaje": "Hola, necesito ayuda",
      "total_validaciones": 0,
      "ultima_actividad": "2025-12-06T10:30:00.000Z"
    }
  ]
}
```

### 2. POST /dashboard/vendedores/aprobar

**Descripción**: Aprobar, rechazar o bloquear vendedor

**Autenticación**: ✅ Requerida (Cognito JWT)

**Request Body**:

```json
{
  "telefono": "51999888777",
  "accion": "APROBAR" | "RECHAZAR" | "BLOQUEAR",
  "razon": "Opcional, requerido si RECHAZAR o BLOQUEAR"
}
```

**Ejemplos**:

```bash
# Aprobar vendedor
curl -X POST https://API_URL/dashboard/vendedores/aprobar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "51999888777",
    "accion": "APROBAR"
  }'

# Rechazar vendedor
curl -X POST https://API_URL/dashboard/vendedores/aprobar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "51999888777",
    "accion": "RECHAZAR",
    "razon": "Número no verificado"
  }'

# Bloquear vendedor
curl -X POST https://API_URL/dashboard/vendedores/aprobar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefono": "51999888777",
    "accion": "BLOQUEAR",
    "razon": "Comportamiento sospechoso"
  }'
```

**Response Exitoso**:
```json
{
  "message": "Vendedor 51999888777 aprobado correctamente",
  "telefono": "51999888777",
  "accion": "APROBAR",
  "timestamp": "2025-12-06T10:35:00.000Z"
}
```

## 📊 Casos de Uso

### Caso 1: Onboarding de Nuevo Vendedor

```
1. Nuevo vendedor recibe instrucciones:
   "Envía un mensaje al +51 XXX XXX XXX"

2. Vendedor envía mensaje:
   "Hola, soy Juan y quiero validar vouchers"

3. Sistema auto-registra automáticamente

4. Admin recibe notificación (CloudWatch logs)

5. Admin revisa y aprueba:
   npx ts-node scripts/aprobar-vendedor.ts 51999888777

6. Vendedor puede empezar a trabajar
```

### Caso 2: Bloquear Vendedor Sospechoso

```
1. Admin detecta actividad sospechosa

2. Admin bloquea vendedor:
   POST /dashboard/vendedores/aprobar
   {
     "telefono": "51999888777",
     "accion": "BLOQUEAR",
     "razon": "Actividad sospechosa detectada"
   }

3. Vendedor NO puede usar el sistema

4. Si vendedor intenta enviar mensaje:
   "🚫 Tu acceso ha sido bloqueado. Razón: Actividad sospechosa detectada"
```

### Caso 3: Reactivar Vendedor Bloqueado

```
1. Admin investiga y resuelve el problema

2. Admin actualiza estado manualmente:
   AWS DynamoDB console o script

3. Cambia estado: BLOQUEADO → APROBADO

4. Vendedor puede usar el sistema nuevamente
```

## 🔐 Seguridad

### Validaciones

1. **Auto-registro**: Solo crea registro, NO da acceso inmediato
2. **Aprobación manual**: Administrador debe aprobar explícitamente
3. **Trazabilidad**: Se registra quién aprobó/rechazó y cuándo
4. **Bloqueo rápido**: Admin puede bloquear vendedores al instante
5. **Historial**: Se mantiene todo el historial de actividad

### Permisos

- **Vendedor nuevo**: Solo puede registrarse (auto-registro)
- **Vendedor pendiente**: No puede usar el sistema
- **Vendedor aprobado**: Acceso completo al sistema
- **Vendedor rechazado**: No puede usar el sistema
- **Vendedor bloqueado**: No puede usar el sistema
- **Admin**: Puede aprobar, rechazar, bloquear vendedores

## 📈 Métricas Rastreadas

Para cada vendedor:
- ✅ Fecha de registro
- ✅ Primer mensaje enviado
- ✅ Total de validaciones realizadas
- ✅ Última actividad
- ✅ Quién lo aprobó/rechazó
- ✅ Fecha de aprobación/rechazo
- ✅ Razón de rechazo (si aplica)

## 🚀 Despliegue

```bash
# Desplegar cambios
npx serverless deploy

# Recursos creados automáticamente:
# ✅ Tabla: overshark-backend-dev-vendedores
# ✅ Función Lambda: listarVendedores
# ✅ Función Lambda: aprobarVendedor
# ✅ Endpoint: GET /dashboard/vendedores
# ✅ Endpoint: POST /dashboard/vendedores/aprobar
# ✅ Índice: EstadoIndex (para queries por estado)
```

## 📝 Comandos AWS CLI

```bash
# Ver todos los vendedores
aws dynamodb scan --table-name overshark-backend-dev-vendedores

# Ver vendedores pendientes
aws dynamodb query \
  --table-name overshark-backend-dev-vendedores \
  --index-name EstadoIndex \
  --key-condition-expression "estado = :estado" \
  --expression-attribute-values '{":estado":{"S":"PENDIENTE"}}'

# Aprobar vendedor manualmente
aws dynamodb update-item \
  --table-name overshark-backend-dev-vendedores \
  --key '{"PK":{"S":"VENDEDOR#51999888777"}}' \
  --update-expression "SET estado = :estado, aprobado_por = :admin, fecha_aprobacion = :fecha" \
  --expression-attribute-values '{
    ":estado":{"S":"APROBADO"},
    ":admin":{"S":"AWS_CLI"},
    ":fecha":{"S":"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}'
  }'
```

## 💡 Mejoras Futuras

- [ ] Notificaciones push a admins cuando hay nuevo vendedor pendiente
- [ ] Notificar al vendedor por WhatsApp cuando sea aprobado/rechazado
- [ ] Dashboard web para gestión visual de vendedores
- [ ] Niveles de permisos (vendedor, supervisor, admin)
- [ ] Límites de validaciones por vendedor
- [ ] Reportes de actividad por vendedor
- [ ] Auto-bloqueo por comportamiento sospechoso
- [ ] Integración con sistema de roles y permisos más avanzado

## 📞 Soporte

Para agregar un vendedor manualmente sin esperar auto-registro:

```bash
npx ts-node scripts/crear-vendedor.ts 51999888777 "Juan Vendedor" "juan@example.com"
```

(Este script aún no está creado, pero sería útil para casos especiales)

---

**Versión**: 1.0.0
**Fecha**: Diciembre 2025
**Autor**: Overshark Backend Team
