# Overshark Backend - Sistema de Validación de Pagos Yape

Backend serverless AWS para el sistema de validación automática de pagos Yape de Overshark App.

## 📋 Descripción

Sistema que automatiza la validación de pagos Yape mediante:
- **21 dispositivos Android** capturando notificaciones de Yape en tiempo real
- **WhatsApp Business API** para interactuar con vendedores
- **Amazon Textract** para OCR de vouchers
- **Matching inteligente** con 5 puntos de verificación obligatorios

## 🏗️ Arquitectura

```
Apps Móviles (21) → API Gateway → Lambda (guardarNotificacion) → DynamoDB
Vendedor WhatsApp → Webhook → Lambda (webhookWhatsApp) → Textract → S3
                                    ↓
                              Lambda (validarConMatch) → Matching → DynamoDB
```

### Componentes AWS

- **Lambda Functions**: 3 handlers principales
- **DynamoDB**: 4 tablas (dispositivos, notificaciones, ventas, sesiones)
- **S3**: Almacenamiento de imágenes de vouchers
- **Textract**: OCR para extraer datos de imágenes
- **API Gateway**: Endpoints HTTP

## 🚀 Instalación

### Prerrequisitos

- Node.js 20.x
- AWS CLI configurado
- Cuenta de AWS
- Meta WhatsApp Business API configurada

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
WHATSAPP_ACCESS_TOKEN=tu_access_token
WHATSAPP_VERIFY_TOKEN=tu_verify_token
```

### 3. Compilar TypeScript

```bash
npm run build
```

### 4. Desplegar a AWS

```bash
# Desplegar a ambiente de desarrollo
npm run deploy

# O directamente con serverless
serverless deploy --stage dev

# Desplegar a producción
serverless deploy --stage prod
```

## 📁 Estructura del Proyecto

```
src/
├── handlers/               # Lambda handlers
│   ├── guardarNotificacion.ts    # Recibe notificaciones de apps móviles
│   ├── webhookWhatsApp.ts        # Webhook WhatsApp Business API
│   └── validarConMatch.ts        # Validación con matching
│
├── services/              # Lógica de negocio
│   ├── yapeParser.ts     # Parsear notificaciones Yape
│   ├── matching.ts       # Algoritmo de matching
│   ├── similitud.ts      # Cálculo de similitud de nombres
│   └── whatsapp.ts       # Cliente WhatsApp API
│
├── types/                # Interfaces TypeScript
│   ├── notificacion.ts
│   ├── venta.ts
│   ├── dispositivo.ts
│   └── whatsapp.ts
│
├── utils/                # Utilidades
│   ├── dynamodb.ts       # Cliente DynamoDB
│   ├── s3.ts             # Cliente S3
│   └── textract.ts       # Cliente Textract
│
└── config/               # Configuración
    └── dispositivos.ts   # Lista de 21 dispositivos
```

## 📡 Endpoints API

### POST /notificaciones
Recibe notificaciones desde apps móviles.

**Request:**
```json
{
  "texto": "¡Yapeaste!\nS/100\nJuan C. Perez F.\n22 nov. 2025 | 11:34 a.m.\nCÓDIGO DE SEGURIDAD\n5 0 2\nNro. de operación\n03443217",
  "codigo_dispositivo": "TK6-600",
  "timestamp": 1732276440000
}
```

**Response:**
```json
{
  "message": "Notificación guardada exitosamente",
  "numero_operacion": "03443217",
  "monto": 100.0,
  "codigo_dispositivo": "TK6-600"
}
```

### POST /webhook
Webhook para WhatsApp Business API.

**Flujo:**
1. Vendedor envía IMAGEN del voucher
2. Sistema procesa con Textract (OCR)
3. Bot solicita datos adicionales (nombre cliente, código servicio)
4. Vendedor envía TEXTO con datos
5. Sistema valida con matching automático
6. Bot responde con resultado de validación

### GET /webhook
Verificación del webhook (requerido por WhatsApp).

### POST /validar
Endpoint opcional para validación directa.

**Request:**
```json
{
  "monto": 100.0,
  "codigoSeguridad": "502",
  "numeroOperacion": "03443217",
  "fechaHora": "2025-11-22T11:34:00",
  "nombreCliente": "Juan Carlos Perez Fernandez",
  "codigoServicio": "TK6-600",
  "vendedorWhatsApp": "+51957614218"
}
```

## 🔍 Algoritmo de Matching

El sistema realiza 5 checks obligatorios:

1. **Número de operación** (exacto - 100%)
2. **Código de dispositivo** (crítico - 100%)
3. **Monto** (exacto sin tolerancia - 100%)
4. **Nombre cliente** (similitud ≥95%)
5. **Código de seguridad** (exacto - 100%)

**Decisión:**
- 5/5 checks (100%) → ✅ VALIDADO automáticamente
- 4/5 checks (80%) → ⏳ REVISIÓN_MANUAL
- ≤3/5 checks (≤60%) → ❌ RECHAZADO

## 🗄️ DynamoDB Tables

### 1. dispositivos
Registro de los 21 dispositivos que reciben pagos.

**PK:** `DISPOSITIVO#TK6-600`

### 2. notificaciones_yape
Notificaciones capturadas automáticamente.

**PK:** `NOTIF#03443217`
**SK:** `2025-11-22T11:34:00`

### 3. ventas_validadas
Ventas validadas exitosamente.

**PK:** `VENTA#03443217`
**SK:** `2025-11-22T11:35:00`

### 4. sesiones_vendedores
Sesiones temporales (TTL 30 minutos).

**PK:** `SESION#51957614218`

## 🧪 Testing Local

```bash
# Iniciar Serverless Offline
serverless offline

# Los endpoints estarán disponibles en:
# http://localhost:3000/notificaciones
# http://localhost:3000/webhook
# http://localhost:3000/validar
```

## 📊 Monitoreo

Logs en CloudWatch:
```bash
# Ver logs de una función específica
serverless logs -f guardarNotificacion --tail

# Ver logs de webhook
serverless logs -f webhookWhatsApp --tail
```

## 🔐 Seguridad

- ✅ Validación anti-duplicación (número de operación único)
- ✅ Verificación de código de dispositivo
- ✅ Matching estricto con 5 puntos de verificación
- ✅ Credenciales en variables de entorno
- ✅ S3 bucket privado
- ✅ IAM roles con permisos mínimos

## 📈 Costos Estimados

**1,000 validaciones/mes:**
- Lambda: $0.02
- DynamoDB: $3.00
- Textract: $1.50
- S3: $0.03
- **Total: ~$8.27/mes**

**10,000 validaciones/mes:**
- **Total: ~$41.83/mes**

## 🚧 Próximos Pasos

- [ ] Dashboard de administración
- [ ] Panel de monitoreo por dispositivo
- [ ] Reportes y analytics
- [ ] Sistema de notificaciones admin
- [ ] Tests unitarios e integración

## 📞 Soporte

Para preguntas o problemas:
- Abrir un issue en el repositorio
- Contactar al equipo de desarrollo

## 📄 Licencia

[Especificar licencia]
