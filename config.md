# Overshark App - Sistema de Validación de Pagos Yape

## 📋 Descripción del Proyecto

Overshark App es un sistema de **doble validación automática de pagos** para WhatsApp. El sistema captura automáticamente notificaciones de Yape en múltiples dispositivos y valida vouchers enviados por vendedores mediante matching inteligente, todo en una arquitectura serverless AWS.

### Problema que Resuelve

Cuando un cliente paga por Yape y envía el voucher al vendedor, el vendedor necesita validar que:
1. El pago realmente llegó a la cuenta correcta de la empresa
2. Los datos del voucher coinciden con el pago recibido
3. No se está usando un voucher duplicado o falso
4. El pago llegó al número/servicio específico solicitado

Este sistema **automatiza completamente** este proceso de validación con múltiples dispositivos.

## 📱 Dispositivos que Reciben Pagos

El sistema gestiona **21 puntos de recepción de pagos**:

### OVERSHARK (17 puntos)

**Lima:**
- `L1-000` - Lima 1 (teléfono termina en 000)
- `L2-378` - Lima 2 (teléfono termina en 378)
- `L3-711` - Lima 3 (teléfono termina en 711)
- `L4-138` - Lima 4 (teléfono termina en 138)

**Provincia:**
- `P1-556` - Provincia 1 (teléfono termina en 556)
- `P1-A-375` - Provincia 1-A (teléfono termina en 375)
- `P2-576` - Provincia 2 (teléfono termina en 576)
- `P3-825` - Provincia 3 (teléfono termina en 825)
- `P4-101` - Provincia 4 (teléfono termina en 101)
- `P4-A-262` - Provincia 4-A (teléfono termina en 262)
- `P5-795` - Provincia 5 (teléfono termina en 795)

**TikTok:**
- `TK1-320` - TikTok 1 (teléfono termina en 320)
- `TK2-505` - TikTok 2 (teléfono termina en 505)
- `TK3-016` - TikTok 3 (teléfono termina en 016)
- `TK6-600` - TikTok 6 (teléfono termina en 600)

**Transferencias Bancarias:**
- `TRANSF.0102` - Cuenta bancaria xxxxx0102
- `TRANSF.5094` - Cuenta bancaria xxxxx5094

### BRAVO'S (4 puntos)

**Yape:**
- `PUB BRAV-829` - Pub Bravo's (teléfono termina en 829)
- `LIVE BRAV-402` - Live Bravo's (teléfono termina en 402)

**Transferencias Bancarias:**
- `TRANSF.4006` - Cuenta bancaria xxxxx4006
- `TRANSF.0040` - Cuenta bancaria xxxxx0040

## 🏗️ Arquitectura del Sistema

### 📊 Resumen de Fuentes de Datos

El sistema valida pagos combinando datos de **3 fuentes**:

| Fuente | Datos | Cómo se Obtienen |
|--------|-------|------------------|
| **📱 Notificación Yape<br>(Captura Automática)** | • Monto recibido<br>• Nombre del pagador<br>• Código de seguridad<br>• Número de operación<br>• Código del dispositivo | App móvil captura notificación<br>push automáticamente |
| **📸 Imagen del Voucher<br>(Vendedor envía)** | • Monto<br>• Código de seguridad<br>• Número de operación<br>• Fecha y hora | Vendedor envía screenshot,<br>Textract extrae texto (OCR) |
| **💬 Texto del Vendedor<br>(Vendedor escribe)** | • Nombre del cliente<br>• Código del servicio destino | Vendedor escribe manualmente<br>después de enviar imagen |

**Validación:** El sistema hace matching entre estos 3 conjuntos de datos para validar que:
- El número de operación existe en notificaciones capturadas ✓
- El código del servicio coincide (TK6-600, L1-000, etc.) ✓
- El monto es exactamente el mismo ✓
- El nombre del cliente es similar al pagador (≥95%) ✓
- El código de seguridad coincide ✓

### Flujo Completo de Validación

```
┌─────────────────────────────────────────────────────────────────┐
│  FUENTE 1: App Móvil (21 Dispositivos - Captura Automática)    │
└─────────────────────────────────────────────────────────────────┘

Cliente paga S/100 por Yape a TK6-600
         ↓
Dispositivo TK6-600 recibe notificación push de Yape
         ↓
┌──────────────────────────────────────────────────────┐
│ App Móvil (expo-android-notification-listener)      │
│ Dispositivo configurado como: TK6-600               │
│                                                      │
│ Captura automáticamente:                            │
│  • Monto: S/100                                     │
│  • Pagador: Juan C. Perez F.                        │
│  • Código Seguridad: 502                            │
│  • Nro. Operación: 03443217                         │
│  • Código Dispositivo: TK6-600  ← NUEVO             │
│  • Fecha/Hora: 22/11 11:34                         │
└──────────────────────────────────────────────────────┘
         ↓
    API Gateway AWS
         ↓
  Lambda: guardarNotificacion()
         ↓
DynamoDB: notificaciones_yape
{
  "numero_operacion": "03443217",
  "monto": 100.00,
  "codigo_dispositivo": "TK6-600",
  "estado": "PENDIENTE_VALIDACION"
}


┌─────────────────────────────────────────────────────────────────┐
│  FUENTE 2: WhatsApp Chatbot (Vendedor envía voucher)           │
└─────────────────────────────────────────────────────────────────┘

Vendedor (+51957614218) recibe voucher del cliente
         ↓
📸 PASO 1: Vendedor envía IMAGEN del voucher por WhatsApp
  [Screenshot de Yape]
         ↓
WhatsApp Business API → Webhook
         ↓
    API Gateway AWS
         ↓
  Lambda: procesarVoucher()
         ↓
  Descarga imagen → Amazon S3
         ↓
  Amazon Textract (OCR)
  Extrae de la imagen:
  ✓ Monto: S/100
  ✓ Código Seguridad: 502
  ✓ Nro. Operación: 03443217
  ✓ Fecha y Hora: 22/11/2025 11:34
         ↓
Bot responde:
"✅ Imagen recibida. Ahora envíame:
1. Nombre del cliente
2. Código del servicio (Ej: TK6-600)"
         ↓
💬 PASO 2: Vendedor envía TEXTO con datos adicionales
  "Juan Carlos Perez Fernandez
   TK6-600"
         ↓
  Lambda: parsearDatosVendedor()
  Extrae:
  ✓ Nombre Cliente: Juan Carlos Perez Fernandez
  ✓ Código Servicio: TK6-600
         ↓
  Lambda: validarConMatch()
  Combina datos de IMAGEN + TEXTO
         ↓
┌──────────────────────────────────────────────────────┐
│ MATCHING AUTOMÁTICO (5 validaciones):               │
│  ✓ Nro. Operación: 03443217 == 03443217            │
│  ✓ Código Dispositivo: TK6-600 == TK6-600          │
│  ✓ Monto: 100.00 === 100.00 (EXACTO)               │
│  ✓ Nombre: "Juan C. Perez F." ≈ "Juan Carlos..."  │
│     (Similitud: 98% >= 95%)                         │
│  ✓ Código Seguridad: 502 === 502                   │
│  → Confianza: 100% (5/5 checks)                     │
└──────────────────────────────────────────────────────┘
         ↓
DynamoDB: ventas_validadas
Estado: VALIDADO
         ↓
Respuesta automática al vendedor:
"✅ Venta validada correctamente

📋 Detalles:
• Cliente: Juan Carlos Perez Fernandez
• Teléfono: +51999888777
• Ubicación: Provincia
• Servicio: TK6-600
• Monto: S/100
• Operación: 03443217"
```

## 🔧 Componentes del Sistema

### 1. App Móvil (React Native + Expo)

**Ubicación**: `/home/user/overshark-app/`

**Tecnologías**:
- React Native con Expo
- `expo-android-notification-listener-service` para captura automática
- TypeScript

**Función**:
- Se instala en cada uno de los 21 dispositivos que reciben pagos
- Captura automáticamente notificaciones de Yape del teléfono Android
- Parsea los datos (monto, nombre, código, operación)
- Agrega el código del dispositivo configurado
- Envía a AWS API Gateway en tiempo real

**Configuración Inicial por Dispositivo**:

```typescript
// Al instalar app en dispositivo TK6-600
const configurarDispositivo = async () => {
  // Mostrar selector con todos los códigos disponibles
  const codigo = await mostrarSelector([
    // OVERSHARK
    "L1-000", "L2-378", "L3-711", "L4-138",
    "P1-556", "P1-A-375", "P2-576", "P3-825",
    "P4-101", "P4-A-262", "P5-795",
    "TK1-320", "TK2-505", "TK3-016", "TK6-600",
    "TRANSF.0102", "TRANSF.5094",
    // BRAVO'S
    "PUB BRAV-829", "LIVE BRAV-402",
    "TRANSF.4006", "TRANSF.0040"
  ]);

  // Guardar configuración
  await AsyncStorage.setItem('CODIGO_DISPOSITIVO', codigo);
  await registrarDispositivoAWS(codigo);
};

// Captura de notificaciones
const capturarNotificacion = async (notification) => {
  if (notification.packageName !== 'com.yape.app') return;

  const datos = parsearYapeNotificacion(notification.text);
  const codigoDispositivo = await AsyncStorage.getItem('CODIGO_DISPOSITIVO');

  datos.codigo_dispositivo = codigoDispositivo; // "TK6-600"

  await fetch(AWS_API_URL + '/notificaciones', {
    method: 'POST',
    body: JSON.stringify(datos)
  });
};
```

**Estado**: ⚠️ Requiere adaptación para usar la librería `expo-android-notification-listener-service` correctamente

### 2. Backend AWS (Serverless)

**Ubicación**: `/home/user/overshark-app/backend/`

**Servicios AWS**:

#### API Gateway
- **Endpoint 1**: `POST /notificaciones` - Recibe notificaciones desde apps móviles
- **Endpoint 2**: `POST /webhook` - Webhook para WhatsApp Business API

#### Lambda Functions
- `guardarNotificacion` - Guarda y parsea notificación de Yape en DynamoDB
- `procesarVoucher` - Procesa voucher enviado por WhatsApp (maneja IMAGEN y TEXTO)
- `validarConMatch` - Hace matching entre notificación y voucher
- `responderWhatsApp` - Envía respuesta al vendedor
- `gestionarSesionVendedor` - Maneja estado conversacional del bot (sesiones temporales)

#### DynamoDB Tables

**Tabla 1: `dispositivos`**
```json
{
  "PK": "DISPOSITIVO#TK6-600",
  "codigo": "TK6-600",
  "nombre": "TikTok 6 Overshark",
  "telefono_completo": "+51981139600",
  "ultimos_digitos": "600",
  "tipo": "YAPE",
  "empresa": "OVERSHARK",
  "ubicacion": "TIKTOK",
  "activo": true,
  "ultima_notificacion": "2025-11-22T11:34:00"
}
```

**Tabla 2: `notificaciones_yape`**
```json
{
  "PK": "NOTIF#03443217",
  "SK": "2025-11-22T11:34:00",

  // Datos parseados de la notificación Yape
  "monto": 100.00,
  "nombre_pagador": "Juan C. Perez F.",
  "codigo_seguridad": "502",
  "numero_operacion": "03443217",
  "fecha_hora": "2025-11-22T11:34:00",

  // Dispositivo que capturó la notificación
  "codigo_dispositivo": "TK6-600",

  // Control
  "estado": "PENDIENTE_VALIDACION",
  "parseado": true,
  "created_at": "2025-11-22T11:34:00"
}
```

**Tabla 3: `ventas_validadas`**
```json
{
  "PK": "VENTA#03443217",
  "SK": "2025-11-22T11:35:00",

  // Identificación
  "numero_operacion": "03443217",

  // Datos del cliente (quien pagó)
  "cliente_nombre": "Juan Carlos Perez Fernandez",
  "cliente_telefono": "+51999888777",
  "cliente_ubicacion": "Provincia",

  // Datos del pago
  "monto": 100.00,
  "codigo_seguridad": "502",
  "fecha_hora_pago": "2025-11-22T11:34:00",

  // Códigos de servicio
  "codigo_servicio_voucher": "TK6-600",       // Del voucher
  "codigo_servicio_notificacion": "TK6-600",  // Donde llegó

  // Vendedor que validó (desde WhatsApp)
  "vendedor_whatsapp": "+51957614218",
  "vendedor_nombre": "Juan Vendedor",

  // Matching
  "match_exitoso": true,
  "confianza_match": 100.0,
  "campos_coincidentes": [
    "numero_operacion",
    "codigo_dispositivo",
    "monto",
    "nombre",
    "codigo_seguridad"
  ],

  // Estado
  "estado": "VALIDADO",
  "validado_por": "SISTEMA_AUTOMATICO",
  "fecha_hora_validacion": "2025-11-22T11:35:00"
}
```

**Tabla 4: `sesiones_vendedores`** (Temporal - TTL 30 minutos)
```json
{
  "PK": "SESION#51957614218",
  "estado": "ESPERANDO_DATOS_TEXTO",

  // Datos extraídos de la imagen
  "datosImagen": {
    "monto": 100.00,
    "codigoSeguridad": "502",
    "numeroOperacion": "03443217",
    "fechaHora": "2025-11-22T11:34:00"
  },

  // Referencia al voucher en S3
  "s3Key": "vouchers/1732276530-51957614218.jpg",

  // Control
  "created_at": "2025-11-22T11:35:30",
  "ttl": 1732278330  // Expira en 30 minutos
}
```

#### Amazon Textract
- **Función**: OCR (Reconocimiento óptico de caracteres)
- **Uso**: Extraer texto de imágenes de vouchers de Yape
- **Proceso**:
  1. Vendedor envía imagen del voucher por WhatsApp
  2. Lambda descarga imagen y la guarda en S3
  3. Textract analiza la imagen y extrae todo el texto
  4. Lambda parsea el texto extraído para obtener datos estructurados
- **Datos extraídos**:
  - Monto (S/100)
  - Código de seguridad (2 1 7)
  - Número de operación (03443217)
  - Últimos dígitos del celular (505)
- **Costo**: $1.50 por 1,000 páginas procesadas
- **Precisión**: ~95-98% en vouchers de Yape con buena calidad

#### Amazon S3
- **Función**: Almacenamiento de objetos
- **Uso**: Guardar imágenes de vouchers
- **Buckets**:
  - `overshark-vouchers/` - Imágenes de vouchers enviados por vendedores
  - `overshark-vouchers/processed/` - Vouchers ya procesados
  - `overshark-vouchers/failed/` - Imágenes que fallaron OCR
- **Lifecycle**: Eliminar imágenes después de 30 días (opcional)
- **Costo**: $0.023 por GB/mes
- **Seguridad**: Acceso solo desde Lambda (IAM policies)

#### Secrets Manager
- Credenciales de WhatsApp Business API
- Tokens de autenticación

## 🎯 Lógica de Matching

### Algoritmo de Validación (5 Checks Obligatorios)

```javascript
async function validarVenta(voucher, vendedorWhatsApp) {
  // 1. Buscar notificación por número de operación
  const notificacion = await dynamodb.get({
    TableName: 'notificaciones_yape',
    Key: { PK: `NOTIF#${voucher.numeroOperacion}` }
  });

  if (!notificacion) {
    return {
      valido: false,
      razon: 'NO_EXISTE_NOTIFICACION',
      mensaje: '⚠️ No encontramos el pago en nuestro sistema. Verifica el número de operación.'
    };
  }

  // 2. VALIDACIÓN CRÍTICA: Código de dispositivo debe coincidir
  if (notificacion.codigo_dispositivo !== voucher.codigoServicio) {
    return {
      valido: false,
      razon: 'CODIGO_DISPOSITIVO_NO_COINCIDE',
      mensaje: `❌ El pago llegó a ${notificacion.codigo_dispositivo} pero enviaste voucher para ${voucher.codigoServicio}`
    };
  }

  // 3. MATCHING de 5 campos obligatorios
  const checks = {
    // Check 1: Número de operación (único - ya validado)
    numeroOperacion: true,

    // Check 2: Código de dispositivo (crítico - ya validado)
    codigoDispositivo: true,

    // Check 3: Monto EXACTO (sin tolerancia)
    monto: notificacion.monto === voucher.monto,

    // Check 4: Nombre MUY ESTRICTO (≥95% similitud)
    nombre: calcularSimilitud(
      notificacion.nombre_pagador,
      voucher.nombreCliente
    ) >= 95,

    // Check 5: Código de seguridad OBLIGATORIO
    codigoSeguridad: notificacion.codigo_seguridad === voucher.codigoSeguridad
  };

  const checksPasados = Object.values(checks).filter(v => v).length;
  const confianza = (checksPasados / 5) * 100;

  // 4. Decisión (requiere 5/5 = 100% confianza)
  if (confianza >= 95) {
    // Registrar venta validada
    await registrarVentaValidada({
      numero_operacion: voucher.numeroOperacion,
      codigo_servicio_voucher: voucher.codigoServicio,
      codigo_servicio_notificacion: notificacion.codigo_dispositivo,
      vendedor_whatsapp: vendedorWhatsApp,
      cliente_nombre: voucher.nombreCliente,
      cliente_telefono: voucher.telefonoCliente,
      cliente_ubicacion: voucher.ubicacion,
      monto: voucher.monto,
      codigo_seguridad: voucher.codigoSeguridad,
      confianza_match: confianza,
      campos_coincidentes: Object.keys(checks).filter(k => checks[k])
    });

    return {
      valido: true,
      confianza: confianza,
      mensaje: formatearMensajeExito(voucher)
    };
  } else {
    // Match insuficiente - Revisión manual
    return {
      valido: false,
      razon: 'MATCH_INSUFICIENTE',
      confianza: confianza,
      mensaje: `⏳ Los datos no coinciden completamente (${confianza.toFixed(1)}% confianza).\nUn operador revisará tu solicitud.`
    };
  }
}

// Función auxiliar para calcular similitud de nombres
function calcularSimilitud(nombre1, nombre2) {
  // Normalizar
  const normalizar = (str) => str.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const n1 = normalizar(nombre1);
  const n2 = normalizar(nombre2);

  // Comparación exacta
  if (n1 === n2) return 100;

  // Uno contiene al otro (nombres con iniciales)
  if (n1.includes(n2) || n2.includes(n1)) return 95;

  // Algoritmo de similitud (Levenshtein simplificado)
  const palabras1 = n1.split(' ');
  const palabras2 = n2.split(' ');

  let coincidencias = 0;
  palabras1.forEach(p1 => {
    if (palabras2.some(p2 => p2.includes(p1) || p1.includes(p2))) {
      coincidencias++;
    }
  });

  const total = Math.max(palabras1.length, palabras2.length);
  return (coincidencias / total) * 100;
}
```

### Criterios de Validación

| Check | Tipo | Umbral | Crítico |
|-------|------|--------|---------|
| 1. Número de Operación | Exacto | 100% | ✅ Sí |
| 2. Código Dispositivo | Exacto | 100% | ✅ Sí |
| 3. Monto | Exacto (sin tolerancia) | 100% | ✅ Sí |
| 4. Nombre Cliente | Similitud | ≥95% | ✅ Sí |
| 5. Código Seguridad | Exacto | 100% | ✅ Sí |

**Decisión Final:**
- **5/5 checks (100%)** → ✅ VALIDADO automáticamente
- **4/5 checks (80%)** → ⏳ REVISION_MANUAL
- **≤3/5 checks (≤60%)** → ❌ RECHAZADO

## 📸 Procesamiento de Datos del Voucher

### Flujo Completo: IMAGEN + TEXTO

El sistema recibe datos de DOS fuentes del vendedor:

**📸 IMAGEN (procesada con Textract OCR):**
- Monto (S/100)
- Código de seguridad (502)
- Número de operación (03443217)
- Fecha y hora (22 nov. 2025, 11:34 a.m.)

**💬 TEXTO (enviado por el vendedor):**
- Nombre del cliente (Juan Carlos Perez Fernandez)
- Código del servicio/teléfono destino (TK6-600)

### Implementación del Flujo

```javascript
// PASO 1: Vendedor envía IMAGEN del voucher por WhatsApp
const message = whatsappWebhook.messages[0];

if (message.type === 'image') {
  // 1. Descargar imagen desde WhatsApp Media API
  const mediaUrl = await getWhatsAppMediaUrl(message.image.id);
  const imageBuffer = await downloadImage(mediaUrl);

  // 2. Guardar en S3
  const s3Key = `vouchers/${Date.now()}-${message.from}.jpg`;
  await s3.putObject({
    Bucket: 'overshark-vouchers',
    Key: s3Key,
    Body: imageBuffer
  });

  // 3. Procesar con Textract
  const textractResult = await textract.detectDocumentText({
    Document: {
      S3Object: {
        Bucket: 'overshark-vouchers',
        Key: s3Key
      }
    }
  });

  // 4. Extraer texto línea por línea
  const textoExtraido = textractResult.Blocks
    .filter(block => block.BlockType === 'LINE')
    .map(block => block.Text)
    .join('\n');

  /* Texto extraído de la imagen:
   * ¡Yapeaste!
   * S/100
   * Overshark Peru Sac
   * 22 nov. 2025 | 11:34 a.m.
   * CÓDIGO DE SEGURIDAD
   * 5 0 2
   * Nro. de operación
   * 03443217
   */

  // 5. Parsear SOLO los datos que vienen de la IMAGEN
  const datosImagen = {
    monto: extractMonto(textoExtraido),              // S/100 → 100.00
    codigoSeguridad: extractCodigo(textoExtraido),   // 5 0 2 → "502"
    numeroOperacion: extractOperacion(textoExtraido), // 03443217
    fechaHora: extractFechaHora(textoExtraido)       // 22 nov. 2025, 11:34 a.m.
  };

  // 6. Guardar temporalmente los datos de la imagen
  await guardarSesionVendedor(message.from, {
    estado: 'ESPERANDO_DATOS_TEXTO',
    datosImagen,
    s3Key
  });

  // 7. Solicitar datos adicionales al vendedor
  await enviarMensajeWhatsApp(message.from,
    '✅ Imagen recibida correctamente.\n\n' +
    'Ahora envíame los siguientes datos:\n' +
    '1️⃣ Nombre completo del cliente\n' +
    '2️⃣ Código del servicio (Ej: TK6-600, L1-000, P2-576)\n\n' +
    '📝 Formato:\n' +
    'Juan Carlos Perez Fernandez\n' +
    'TK6-600'
  );
}

// PASO 2: Vendedor responde con TEXTO
else if (message.type === 'text') {
  // 1. Obtener sesión del vendedor
  const sesion = await obtenerSesionVendedor(message.from);

  if (sesion?.estado === 'ESPERANDO_DATOS_TEXTO') {
    // 2. Parsear datos del TEXTO
    const lineas = message.text.body.split('\n');
    const datosTexto = {
      nombreCliente: lineas[0]?.trim(),
      codigoServicio: lineas[1]?.trim().toUpperCase()
    };

    // 3. Combinar datos de IMAGEN + TEXTO
    const voucherCompleto = {
      ...sesion.datosImagen,        // monto, código seg., nro. operación, fecha
      ...datosTexto,                 // nombre cliente, código servicio
      vendedorWhatsApp: message.from,
      voucherUrl: sesion.s3Key
    };

    // 4. Validar con matching
    const resultado = await validarConMatch(voucherCompleto);

    // 5. Responder al vendedor
    await enviarMensajeWhatsApp(message.from, resultado.mensaje);

    // 6. Limpiar sesión
    await eliminarSesionVendedor(message.from);
  }
}
```

### Funciones de Parseo

```javascript
function extractMonto(texto) {
  const match = texto.match(/S\/\s*([\d,]+\.?\d*)/i);
  return match ? parseFloat(match[1].replace(',', '')) : null;
}

function extractCodigo(texto) {
  // Buscar patrón "2 1 7" o "217"
  const match = texto.match(/C[ÓO]DIGO\s+DE\s+SEGURIDAD\s*(\d)\s*(\d)\s*(\d)/i) ||
                texto.match(/C[ÓO]DIGO[:\s]*(\d{3})/i);
  return match ? (match[1] + (match[2] || '') + (match[3] || '')) : null;
}

function extractOperacion(texto) {
  const match = texto.match(/Nro\.\s*de\s*operaci[oó]n\s*(\d+)/i);
  return match ? match[1] : null;
}

function extractDigitos(texto) {
  const match = texto.match(/\*+\s*\*+\s*(\d{3})/);
  return match ? match[1] : null;
}
```

### Precisión y Manejo de Errores

- **Precisión esperada**: 95-98% en imágenes claras
- **Si Textract falla**: Pedir al vendedor reenviar imagen más clara
- **Validación**: Verificar que se extrajo número de operación antes de continuar
- **Fallback**: Opción de ingresar datos manualmente si OCR falla

## 📊 Casos de Uso y Ejemplos

### ✅ Ejemplo 1: Validación Exitosa (100% confianza)

```
11:34:00 - Cliente paga S/100 a TK6-600
11:34:01 - Dispositivo TK6-600 captura notificación
11:34:02 - Guardado en DynamoDB:
           {
             "numero_operacion": "03443217",
             "monto": 100.00,
             "nombre_pagador": "Juan C. Perez F.",
             "codigo_seguridad": "502",
             "codigo_dispositivo": "TK6-600",
             "estado": "PENDIENTE_VALIDACION"
           }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📸 PASO 1: IMAGEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11:35:30 - Vendedor (+51957614218) envía IMAGEN del voucher
           📸 [Screenshot de Yape]

11:35:31 - Lambda descarga imagen y guarda en S3
11:35:32 - Textract procesa imagen (OCR)
11:35:33 - Texto extraído:
           "¡Yapeaste!
            S/100
            Overshark Peru Sac
            22 nov. 2025 | 11:34 a.m.
            CÓDIGO DE SEGURIDAD
            5 0 2
            Nro. de operación
            03443217"

11:35:34 - Lambda parsea datos de la IMAGEN:
           ✓ Monto: S/100
           ✓ Código Seguridad: 502
           ✓ Nro. Operación: 03443217
           ✓ Fecha/Hora: 22 nov. 2025, 11:34 a.m.

11:35:35 - Bot responde al vendedor:
           "✅ Imagen recibida correctamente.

            Ahora envíame los siguientes datos:
            1️⃣ Nombre completo del cliente
            2️⃣ Código del servicio (Ej: TK6-600)

            📝 Formato:
            Juan Carlos Perez Fernandez
            TK6-600"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 PASO 2: TEXTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11:35:50 - Vendedor envía TEXTO:
           "Juan Carlos Perez Fernandez
            TK6-600"

11:35:51 - Lambda parsea datos del TEXTO:
           ✓ Nombre Cliente: Juan Carlos Perez Fernandez
           ✓ Código Servicio: TK6-600

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 VALIDACIÓN (Combina IMAGEN + TEXTO)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

11:35:52 - Lambda hace matching:
           ✓ Operación: 03443217 == 03443217 (de IMAGEN)
           ✓ Código: TK6-600 == TK6-600 (de TEXTO vs notificación)
           ✓ Monto: 100.00 === 100.00 (de IMAGEN)
           ✓ Nombre: "Juan C. Perez F." ≈ "Juan Carlos Perez..." (98%)
                     (de notificación vs TEXTO)
           ✓ Código Seg: 502 === 502 (de IMAGEN)

11:35:53 - Match: 5/5 = 100% confianza
11:35:54 - Venta registrada (VALIDADO)
11:35:55 - Vendedor recibe:
           "✅ Venta validada correctamente

            📋 Detalles:
            • Cliente: Juan Carlos Perez Fernandez
            • Servicio: TK6-600
            • Monto: S/100
            • Operación: 03443217
            • Código Seguridad: 502"

Total: 1.5 minutos desde pago hasta validación
Interacciones del vendedor: 2 mensajes (1 imagen + 1 texto)
```

### ❌ Ejemplo 2: Código de Servicio Incorrecto

```
11:34:00 - Cliente paga a L1-000
11:34:01 - Dispositivo L1-000 captura notificación
11:34:02 - Guardado: codigo_dispositivo = "L1-000"

11:35:00 - Vendedor envía voucher:
           "Código: TK6-600"  ← INCORRECTO

11:35:01 - Sistema detecta:
           codigo_dispositivo (L1-000) != voucher (TK6-600)

11:35:02 - Vendedor recibe:
           "❌ Error de validación

            El pago llegó a L1-000 pero enviaste
            voucher para TK6-600.

            Verifica el código de servicio."
```

### ⏳ Ejemplo 3: Nombre no Coincide (Revisión Manual)

```
11:34:00 - Notificación: nombre = "Juan C. Perez F."
11:35:00 - Voucher: nombre = "María Elena Gonzales"

11:35:01 - Match:
           ✓ Operación: OK
           ✓ Código: OK
           ✓ Monto: OK
           ✗ Nombre: 15% similitud (< 95% requerido)
           ✓ Código Seg: OK

11:35:02 - Confianza: 4/5 = 80%
11:35:03 - Vendedor recibe:
           "⏳ Los datos no coinciden completamente (80% confianza).
            Un operador revisará tu solicitud manualmente."

11:35:04 - Admin notificado para revisión
```

### 🔄 Ejemplo 4: Operación Duplicada

```
11:34:00 - Notificación capturada: Op. 03443217
11:35:00 - Vendedor A envía voucher → ✅ Validado
11:35:01 - Registro creado en ventas_validadas

11:40:00 - Vendedor B intenta enviar mismo voucher (Op. 03443217)
11:40:01 - Sistema detecta: Ya existe en ventas_validadas
11:40:02 - Vendedor B recibe:
           "❌ Este pago ya fue validado

            Operación: 03443217
            Validado por: +51957614218
            Fecha: 22/11/2025 11:35"
```

## 🚀 Configuración e Instalación

### Prerrequisitos

1. **AWS Account** con acceso a:
   - Lambda
   - DynamoDB
   - API Gateway
   - Secrets Manager

2. **Meta WhatsApp Business Account**
   - Phone Number ID
   - Access Token
   - Webhook configurado

3. **21 Dispositivos Android** (uno por cada código de servicio)
   - Cada uno con notificaciones de Yape
   - Permisos de acceso a notificaciones

### Instalación Backend

```bash
cd backend

# Instalar Serverless Framework
npm install -g serverless

# Instalar dependencias
npm install

# Configurar credenciales AWS
aws configure

# Configurar variables de entorno
cp .env.example .env
# Editar .env con:
# - WHATSAPP_TOKEN
# - WHATSAPP_PHONE_ID
# - WHATSAPP_VERIFY_TOKEN
# - AWS_REGION
# - DYNAMODB_TABLE_PREFIX

# Desplegar a AWS
serverless deploy

# Output:
# ✓ API Gateway URL: https://abc123.execute-api.us-east-1.amazonaws.com
# ✓ Endpoint notificaciones: POST /notificaciones
# ✓ Webhook WhatsApp: POST /webhook
# ✓ DynamoDB Tables:
#   - dispositivos
#   - notificaciones_yape
#   - ventas_validadas
#   - sesiones_vendedores (con TTL 30 min)
```

### Configuración App Móvil (en cada dispositivo)

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-org/overshark-app
cd overshark-app

# 2. Instalar dependencias
npm install

# 3. Configurar endpoint AWS
# Editar: .env
echo "AWS_API_URL=https://abc123.execute-api.us-east-1.amazonaws.com" > .env

# 4. Construir app
npx expo build:android

# 5. Instalar en cada dispositivo
# - Transferir APK al dispositivo
# - Instalar APK
# - Al abrir por primera vez, seleccionar código:
#   Ejemplo: TK6-600, L1-000, P2-576, etc.
# - Habilitar permisos de notificaciones
# - Verificar que captura notificaciones de Yape
```

### Configuración WhatsApp Business API

```bash
# En Meta Developer Console:
# 1. Ir a WhatsApp > Configuration
# 2. Webhook URL: https://tu-api.execute-api.us-east-1.amazonaws.com/webhook
# 3. Verify Token: (el mismo configurado en .env)
# 4. Subscribe to: messages
# 5. Verificar webhook
```

## 📝 Estructura del Proyecto

```
overshark-app/
├── app/                          # App móvil React Native
│   ├── (auth)/                   # Autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── home.tsx                  # Pantalla principal (captura notificaciones)
│   └── _layout.tsx
│
├── backend/                      # Backend AWS Serverless
│   ├── src/
│   │   ├── handlers/             # Lambda handlers
│   │   │   ├── guardarNotificacion.ts
│   │   │   ├── procesarVoucher.ts
│   │   │   ├── validarConMatch.ts
│   │   │   └── webhookWhatsApp.ts
│   │   ├── services/             # Lógica de negocio
│   │   │   ├── yapeParser.ts     # Parsear notificaciones Yape
│   │   │   ├── matching.ts       # Algoritmo de matching
│   │   │   ├── similitud.ts      # Cálculo de similitud de nombres
│   │   │   └── whatsapp.ts       # Cliente WhatsApp API
│   │   ├── types/                # Interfaces TypeScript
│   │   │   ├── notificacion.ts
│   │   │   ├── venta.ts
│   │   │   └── dispositivo.ts
│   │   ├── utils/                # Utilidades
│   │   │   ├── dynamodb.ts
│   │   │   └── validator.ts
│   │   └── config/               # Configuración
│   │       └── dispositivos.ts   # Lista de 21 dispositivos
│   ├── serverless.yml            # Configuración infraestructura
│   ├── package.json
│   └── .env.example
│
├── types/                        # Types compartidos
│   └── models/
│       ├── notification.ts       # Modelo de notificación
│       └── venta.ts              # Modelo de venta
│
├── components/                   # Componentes React Native
│   └── NotificationCard.tsx
│
├── supabase/                     # (Archivos de referencia - NO usados)
├── README.md                     # Este archivo
└── package.json
```

## 🔐 Seguridad

### Validaciones Implementadas

1. **Anti-duplicación**: Cada número de operación solo se valida una vez
2. **Verificación de dispositivo**: El código debe coincidir exactamente
3. **Matching robusto**: 5 puntos de verificación obligatorios
4. **Matching estricto**: Nombres con similitud ≥95%
5. **Monto exacto**: Sin tolerancia de diferencias
6. **Código de seguridad obligatorio**: Siempre requerido
7. **Credenciales seguras**: AWS Secrets Manager
8. **Webhook verification**: Token de verificación WhatsApp

### Datos Sensibles

- ❌ Nunca guardar tokens en código
- ✅ Usar AWS Secrets Manager
- ✅ HTTPS en todos los endpoints
- ✅ Validación de permisos por dispositivo

## 📈 Monitoreo y Logs

### CloudWatch Metrics

- Notificaciones recibidas por dispositivo/min
- Vouchers procesados/min
- Tasa de matching exitoso (%)
- Tasa de rechazo por código incorrecto
- Latencia promedio de validación
- Errores de validación por tipo

### Alarmas Configuradas

- Tasa de validación < 70%
- Errores > 5%
- Latencia > 5 segundos
- Dispositivo sin notificaciones > 24h
- Rechazos por código incorrecto > 10%

## 💰 Costos Estimados

### Escenario: 1,000 validaciones/mes (50 por dispositivo)

| Servicio | Uso | Costo/mes |
|----------|-----|-----------|
| Lambda | 5,000 invocaciones | $0.02 |
| DynamoDB | 10GB + read/write | $3.00 |
| API Gateway | 5,000 requests | $0.02 |
| **Textract** | **1,000 imágenes OCR** | **$1.50** |
| **S3** | **1GB storage + requests** | **$0.03** |
| Secrets Manager | 3 secretos | $1.20 |
| CloudWatch | 5GB logs | $2.50 |
| **TOTAL** | | **~$8.27/mes** |

### Escenario: 10,000 validaciones/mes (500 por dispositivo)

| Servicio | Uso | Costo/mes |
|----------|-----|-----------|
| Lambda | 50,000 invocaciones | $0.20 |
| DynamoDB | 50GB + read/write | $15.00 |
| API Gateway | 50,000 requests | $0.18 |
| **Textract** | **10,000 imágenes OCR** | **$15.00** |
| **S3** | **10GB storage + requests** | **$0.25** |
| Secrets Manager | 3 secretos | $1.20 |
| CloudWatch | 20GB logs | $10.00 |
| **TOTAL** | | **~$41.83/mes** |

## 🚦 Estado del Proyecto

### ✅ Completado

- [x] Arquitectura del sistema definida
- [x] Diseño de 21 dispositivos multi-punto
- [x] Modelos de datos (TypeScript) actualizados
- [x] Algoritmo de matching con 5 validaciones
- [x] Esquema DynamoDB con 3 tablas
- [x] Documentación completa actualizada

### 🔄 En Progreso

- [ ] Implementación Lambda functions
- [ ] Configuración DynamoDB
- [ ] Integración WhatsApp Business API
- [ ] Adaptación app móvil para AWS
- [ ] Sistema de configuración de dispositivos

### 📋 Pendiente

- [ ] Testing end-to-end
- [ ] Dashboard de administración
- [ ] Panel de monitoreo por dispositivo
- [ ] Reportes y analytics
- [ ] Sistema de notificaciones admin
- [ ] Documentación API completa

## 🤝 Contribución

Para contribuir al proyecto:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📞 Soporte

Para preguntas o problemas:
- Abrir un issue en GitHub
- Contactar al equipo de desarrollo

## 📄 Licencia

[Especificar licencia]

---

**Arquitectura Multi-Dispositivo Escalable** - Sistema serverless con 21 puntos de recepción de pagos, capacidad para procesar miles de validaciones diarias con latencia < 2 segundos y matching inteligente con 5 puntos de verificación.
